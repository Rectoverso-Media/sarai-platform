"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { apiFetch, API_URL } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "ai";
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
      id: "welcome",
      role: "ai",
      content:
        "Halo! Saya SARAI AI 👋\n\nSaya dapat membantu Anda menganalisis data, mendeteksi anomali, dan menjawab pertanyaan tentang data Anda. Mulai chat baru atau pilih sesi sebelumnya.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ============================================================
  // WebSocket Setup
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    if (!token) {
      setSocketError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    const socket = io(`${API_URL}/ai`, {
      auth: { token }, // ✅ Token dikirim via auth handshake, BUKAN query param
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      setSocketError(null);
    });

    socket.on("connect_error", (err) => {
      setSocketConnected(false);
      setSocketError(`Koneksi gagal: ${err.message}`);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  // ============================================================
  // Fetch Sessions
  // ============================================================
  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiFetch("/ai/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================================
  // Session Management
  // ============================================================
  const createNewSession = async () => {
    const res = await apiFetch("/ai/sessions", {
      method: "POST",
      body: JSON.stringify({ title: `Sesi ${new Date().toLocaleString("id-ID")}` }),
    });
    if (res.ok) {
      const session = await res.json();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([
        {
          id: "welcome-new",
          role: "ai",
          content: "Sesi baru dimulai! Ada yang bisa saya bantu?",
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
          { id: "empty", role: "ai", content: "Belum ada pesan di sesi ini." },
        ]);
        return;
      }
      setMessages(
        msgs.map((m: any) => ({
          id: m.id,
          role: m.role === "assistant" ? "ai" : "user",
          content: m.content,
        }))
      );
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiFetch(`/ai/sessions/${sessionId}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([
        { id: "welcome", role: "ai", content: "Pilih atau buat sesi baru untuk mulai." },
      ]);
    }
  };

  // ============================================================
  // Send Message via WebSocket
  // ============================================================
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !socketRef.current) return;

    const userMsg = input.trim();
    setInput("");
    setIsTyping(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userMsg },
      { id: aiMsgId, role: "ai", content: "", isStreaming: true },
    ]);

    // Auto-create session jika belum ada
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await apiFetch("/ai/sessions", {
          method: "POST",
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

    // Setup listeners untuk response streaming
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
      socket.off("chat_chunk", onChunk);
      socket.off("chat_done", onDone);
      socket.off("chat_error", onError);
      if (sessionId) fetchSessions(); // Refresh session count
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
      socket.off("chat_chunk", onChunk);
      socket.off("chat_done", onDone);
      socket.off("chat_error", onError);
    };

    socket.on("chat_chunk", onChunk);
    socket.on("chat_done", onDone);
    socket.on("chat_error", onError);

    // Kirim pesan
    socket.emit("chat", { message: userMsg, sessionId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar Sesi */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Riwayat Chat</h2>
            <div
              className={`w-2 h-2 rounded-full ${
                socketConnected ? "bg-emerald-500" : "bg-red-400"
              }`}
              title={socketConnected ? "Terhubung" : "Terputus"}
            />
          </div>
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <span>+</span> Chat Baru
          </button>
        </div>

        {socketError && (
          <div className="mx-3 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {socketError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center mt-8">
              Belum ada sesi chat
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`group flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {session._count.messages} pesan •{" "}
                    {new Date(session.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all ml-2 flex-shrink-0 text-xs"
                  title="Hapus sesi"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Area Chat Utama */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
            AI
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">
              SARAI AI Assistant
            </h1>
            <p className="text-xs text-slate-500">
              {socketConnected
                ? "Online — Siap menjawab pertanyaan Anda"
                : "Menghubungkan..."}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                  AI
                </div>
              )}

              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-slate-400 animate-pulse rounded-sm align-middle" />
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                  U
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 px-6 py-4">
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
                    ? "Menghubungkan ke SARAI..."
                    : isTyping
                    ? "SARAI sedang mengetik..."
                    : "Tanyakan sesuatu tentang data Anda... (Enter untuk kirim)"
                }
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none text-sm text-slate-700 placeholder:text-slate-400 disabled:opacity-60"
                style={{ minHeight: "48px", maxHeight: "150px" }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || !socketConnected}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex-shrink-0 flex items-center gap-2"
            >
              {isTyping ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Kirim →"
              )}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">
            SARAI dapat membuat kesalahan. Verifikasi informasi penting.
          </p>
        </div>
      </div>
    </div>
  );
}