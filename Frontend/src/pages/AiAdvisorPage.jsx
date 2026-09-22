import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Button } from "../components/ui/button.jsx";
import { toast } from "sonner";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  HelpCircle,
  TrendingUp,
  Wallet,
  Coins,
} from "lucide-react";

const PROMPT_SUGGESTIONS = [
  "How can I cut my monthly expenses by $300?",
  "Calculate a personalized 50/30/20 budget for my income.",
  "Which spending category is draining my cash flow the most?",
  "How long will it take to build a 6-month emergency fund?",
  "What is the best strategy to balance investing vs paying expenses?",
];

const AiAdvisorPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello ${user?.name || "there"}! I am **BuildWealth AI**, your personal wealth and finance strategist. I have analyzed your live income, expenses, and savings goals. How can I help optimize your financial future today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      const res = await api.chatAdvisor(text, history);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch (err) {
      toast.error("AI Advisor error: " + err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I experienced a temporary network issue connecting to the financial engine. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: `Chat reset. I am ready to advise you on your financial questions!`,
      },
    ]);
  };

  // Simple markdown renderer for bold and bullet points
  const renderMessageContent = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold text processing
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      if (line.startsWith("### ")) {
        return <h4 key={i} className="text-base font-bold text-foreground mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatted.replace("### ", "") }} />;
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 list-disc text-xs sm:text-sm text-foreground/90 my-1" dangerouslySetInnerHTML={{ __html: formatted.replace("- ", "") }} />
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={i} className="pl-3 border-l-2 border-emerald-500 my-2 text-xs italic text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted.replace("> ", "") }} />
        );
      }
      return (
        <p key={i} className="text-xs sm:text-sm text-foreground/90 leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              BuildWealth AI Financial Advisor
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Connected live to your real-time transactions, budgets, and savings goals.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear Chat
        </Button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-emerald-500" /> Prompts:
        </span>
        {PROMPT_SUGGESTIONS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 text-xs text-muted-foreground hover:text-emerald-500 transition-all text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Area Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden flex flex-col h-[560px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, index) => {
            const isBot = m.role === "assistant";
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  isBot ? "justify-start" : "justify-end"
                }`}
              >
                {isBot && (
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                    isBot
                      ? "bg-muted/60 border border-border text-foreground"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {isBot ? renderMessageContent(m.text) : <p className="text-sm">{m.text}</p>}
                </div>

                {!isBot && (
                  <div className="h-8 w-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 rounded-2xl bg-muted/60 border border-border flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-medium">Analyzing your finances...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 sm:p-4 border-t border-border bg-background/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask anything about your money, budgets, or investments..."
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisorPage;
