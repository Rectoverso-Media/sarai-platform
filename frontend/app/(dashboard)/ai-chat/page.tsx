"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiFetch, API_URL } from '@/lib/api';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
};

type Session = {
  id: string;
  title: string;
  createdAt: string;
  _count: { messages: number };
};

export default function AiChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        'Halo! 👋 Saya SARAI AI Assistant\n\nSaya bisa bantu Anda menganalisis data marketing, mendeteksi anomali, dan memberikan insights. Mulai chat baru atau pilih sesi sebelumnya.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // WebSocket Setup
  useEffect(() => {
    const token = localStorage.getItem('access_token') || '';
    if (!token) {
      setSocketError('Token tidak ditemukan. Silakan login ulang.');
      return;
    }

    const socket = io(`${API_URL}/ai`, {
      auth: { token },
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      setSocketError(null);
    });

    socket.on('connect_error', (err) => {
      setSocketConnected(false);
      setSocketError(`Koneksi gagal: ${err.message}`);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch Sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiFetch('/ai/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session Management
  const createNewSession = async () => {
    const res = await apiFetch('/ai/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: `Sesi ${new Date().toLocaleString('id-ID')}` }),
    });
    if (res.ok) {
      const session = await res.json();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([
        {
          id: 'welcome-new',
          role: 'ai',
          content: 'Sesi baru dimulai! 👋 Ada yang bisa saya bantu?',
        },
      ]);
    }
  };

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const res = await apiFetch(`/ai/sessions/${sessionId}/messages`);
    if (res.ok) {
      const msgs = await res.json();
      if (!msgs || msgs.length === 0) {
        setMessages([
          { id: 'empty', role: 'ai', content: 'Belum ada pesan di sesi ini.' },
        ]);
        return;
      }
      setMessages(
        msgs.map((m: any) => ({
          id: m.id,
          role: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content,
        }))
      );
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiFetch(`/ai/sessions/${sessionId}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([
        { id: 'welcome', role: 'ai', content: 'Pilih atau buat sesi baru untuk mulai.' },
      ]);
    }
  };

  // Send Message via WebSocket
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !socketRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setIsTyping(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: userMsg },
      { id: aiMsgId, role: 'ai', content: '', isStreaming: true },
    ]);

    // Auto-create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await apiFetch('/ai/sessions', {
          method: 'POST',
          body: JSON.stringify({ title: userMsg.substring(0, 50) }),
        });
        if (res.ok) {
          const session = await res.json();
          sessionId = session.id;
          setActiveSessionId(session.id);
          fetchSessions();
        }
      } catch {}
    }

    const socket = socketRef.current;

    const onChunk = (data: { text: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: msg.content + data.text }
            : msg
        )
      );
    };

    const onDone = () => {
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
      if (sessionId) fetchSessions();
    };

    const onError = (data: { message: string }) => {
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: `⚠️ ${data.message}`, isStreaming: false }
            : msg
        )
      );
      socket.off('chat_chunk', onChunk);
      socket.off('chat_done', onDone);
      socket.off('chat_error', onError);
    };

    socket.on('chat_chunk', onChunk);
    socket.on('chat_done', onDone);
    socket.on('chat_error', onError);

    socket.emit('chat', { message: userMsg, sessionId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Session Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1E293B]">Riwayat Chat</h2>
            <div
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'
              }`}
              title={socketConnected ? 'Terhubung' : 'Terputus'}
            />
          </div>
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#6366F1] text-white rounded-xl text-sm font-semibold hover:bg-[#4F46E5] transition-colors shadow-lg shadow-indigo-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Chat Baru
          </button>
        </div>

        {socketError && (
          <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {socketError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center mt-8">
              Belum ada sesi chat
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`group flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? 'bg-[#6366F1]/10 border border-[#6366F1]/20'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {session._count.messages} pesan •{' '}
                    {new Date(session.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#EF4444] transition-all ml-2 flex-shrink-0 p-1 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            ✨
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1E293B]">SARAI AI Assistant</h1>
            <p className="text-sm text-[#64748B]">
              {socketConnected
                ? 'Online — Siap membantu'
                : 'Menghubungkan...'}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              socketConnected
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'ai' && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  ✨
                </div>
              )}

              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#6366F1] text-white rounded-tr-md shadow-lg shadow-indigo-500/20'
                    : 'bg-white border border-slate-200 text-[#1E293B] rounded-tl-md shadow-sm'
                }`}
              >
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-[#94A3B8] animate-pulse rounded-sm align-middle" />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#64748B] font-bold text-sm shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-100 px-6 py-4">
          <form onSubmit={handleSend} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || !socketConnected}
                rows={1}
                placeholder={
                  !socketConnected
                    ? 'Menghubungkan ke SARAI...'
                    : isTyping
                    ? 'SARAI sedang mengetik...'
                    : 'Tanyakan sesuatu tentang data Anda... (Enter untuk kirim)'
                }
                className="w-full pl-5 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all resize-none text-sm text-[#1E293B] placeholder:text-[#94A3B8] disabled:opacity-60"
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || !socketConnected}
              className="px-6 py-3.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              {isTyping ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Kirim
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-[#94A3B8] mt-3 text-center">
            AI mungkin membuat kesalahan. Selalu verifikasi informasi penting.
          </p>
        </div>
      </div>
    </div>
  );
}
