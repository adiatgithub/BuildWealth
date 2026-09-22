import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Button } from "./ui/button.jsx";
import { Bot, X, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

const AiChatWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Need quick advice on your spending or want to parse a transaction?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const res = await api.chatAdvisor(query);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch (err) {
      toast.error("AI error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[340px] sm:w-[380px] h-[480px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-bold text-sm">BuildWealth AI Quick Chat</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl max-w-[85%] ${
                  m.role === "assistant"
                    ? "bg-muted text-foreground border border-border"
                    : "bg-emerald-600 text-white ml-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground w-fit animate-pulse">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-border flex gap-1.5 bg-background">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Button size="sm" type="submit" disabled={loading || !input.trim()} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 h-12 px-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:scale-105 transition-all shadow-emerald-600/30 font-semibold text-xs"
        >
          <Bot className="h-5 w-5" />
          <span>Ask AI</span>
        </button>
      )}
    </div>
  );
};

export default AiChatWidget;
