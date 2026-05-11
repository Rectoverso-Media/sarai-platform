"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content:
        "Halo! Saya SARAI AI. Ada yang bisa saya bantu terkait analisis data kamu hari ini?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();

    setInput("");
    setIsTyping(true);

    const userMessageId = Date.now().toString();
    const aiMessageId = (Date.now() + 1).toString();

    // Tambahkan user + placeholder AI SEKALIGUS
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: userMsg,
      },
      {
        id: aiMessageId,
        role: "ai",
        content: "",
      },
    ]);

    const eventSource = new EventSource(
      `http://localhost:3001/ai/chat-stream?message=${encodeURIComponent(
        userMsg
      )}`
    );

    eventSource.onmessage = (event) => {
      try {
        console.log("RAW SSE:", event.data);

        const parsed = JSON.parse(event.data);

        // SUPPORT 2 FORMAT:
        // { text: "halo" }
        // { data: { text: "halo" } }

        const text =
          parsed?.text ||
          parsed?.data?.text;

        const status =
          parsed?.status ||
          parsed?.data?.status;

        if (status === "DONE") {
          eventSource.close();
          setIsTyping(false);
          return;
        }

        if (text) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: msg.content + text,
                  }
                : msg
            )
          );
        }
      } catch (err) {
        console.error(
          "SSE Parse Error:",
          err
        );
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);

      eventSource.close();

      setIsTyping(false);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  "⚠️ Gagal terhubung ke AI server.",
              }
            : msg
        )
      );
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] p-8 max-w-5xl mx-auto">
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <span className="text-blue-600">
            ✨
          </span>
          SARAI AI Assistant
        </h1>

        <p className="text-slate-500 mt-1">
          Tanyakan apa saja terkait data
          Anda.
        </p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] flex gap-4 ${
                  msg.role === "user"
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                
                <div
                  className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full font-bold text-sm
                  ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {msg.role === "user"
                    ? "U"
                    : "AI"}
                </div>

                <div
                  className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed
                  ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                  }`}
                >
                  {msg.content}

                  {isTyping &&
                    msg.role === "ai" &&
                    msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle"></span>
                    )}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={handleSendMessage}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              disabled={isTyping}
              placeholder={
                isTyping
                  ? "SARAI sedang berpikir..."
                  : "Tanyakan sesuatu..."
              }
              className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
            />

            <button
              type="submit"
              disabled={
                !input.trim() || isTyping
              }
              className="absolute right-3 p-2.5 bg-blue-600 text-white rounded-xl"
            >
              →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}