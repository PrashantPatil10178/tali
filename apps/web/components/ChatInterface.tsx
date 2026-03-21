import React, { useState, useRef, useEffect } from "react";
import {
  complexEducationalQuery,
  searchGroundingQuery,
} from "@tali/gemini/client";
import { ChatMessage } from "@tali/types";
import { useLanguage } from "@/lib/LanguageContext";

const ChatInterface: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let aiResponse = "";
      let aiSources: any[] = [];

      if (useSearch) {
        const result = await searchGroundingQuery(input);
        aiResponse = result.text;
        aiSources = result.sources;
      } else {
        // Force thinking mode if enabled or if query looks complex
        aiResponse = await complexEducationalQuery(input, useThinking);
      }

      const modelMsg: ChatMessage = {
        role: "model",
        text: aiResponse,
        timestamp: Date.now(),
        sources: aiSources,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error("Chat Error:", err);
      const errorMsg: ChatMessage = {
        role: "model",
        text: t("chat.error"),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl flex flex-col h-[70vh] border border-slate-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{t("chat.title")}</h2>
          <p className="text-xs text-indigo-100 opacity-80">
            {t("chat.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUseThinking(!useThinking);
              setUseSearch(false);
            }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${useThinking ? "bg-white text-indigo-600 border-white" : "bg-transparent text-white border-white/40"}`}
          >
            {useThinking
              ? `🧠 ${t("chat.thinkingMode")} On`
              : `💡 ${t("chat.thinkingMode")}`}
          </button>
          <button
            onClick={() => {
              setUseSearch(!useSearch);
              setUseThinking(false);
            }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${useSearch ? "bg-white text-indigo-600 border-white" : "bg-transparent text-white border-white/40"}`}
          >
            {useSearch
              ? `🔍 ${t("chat.searchMode")} On`
              : `🌐 ${t("chat.searchMode")}`}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-60">
            <span className="text-6xl">🤖</span>
            <p className="text-center max-w-xs">{t("chat.empty")}</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>

              {/* गुगल सर्चच्या मदतीने मिळालेले माहिती स्रोत (Grounding Chunks) */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {t("chat.sources")}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, sIdx) => {
                      if (src.web) {
                        return (
                          <a
                            key={sIdx}
                            href={src.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all truncate max-w-[200px] ${
                              msg.role === "user"
                                ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
                            }`}
                          >
                            🔗 {src.web.title || t("chat.sources")}
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              <span className="text-[10px] opacity-60 mt-2 block">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-4 flex gap-2 shadow-sm border border-slate-200/50">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("chat.inputPlaceholder")}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            <svg
              className="w-6 h-6 rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
