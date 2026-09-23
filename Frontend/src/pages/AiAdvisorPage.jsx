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
  Copy,
  Check,
  Zap,
  TrendingUp,
  PieChart,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const CATEGORIZED_PROMPTS = [
  { label: "💡 Affordability", query: "Can I afford to make a $300 purchase this week?" },
  { label: "📊 50/30/20 Plan", query: "Calculate a personalized 50/30/20 budget for my income" },
  { label: "🍔 Food & Dining", query: "How much did I spend on food and dining this month?" },
  { label: "💰 Cut Expenses", query: "How can I cut my monthly expenses by $250?" },
  { label: "🚀 Index Funds", query: "Explain index funds and compound interest in simple terms" },
  { label: "🛡️ Emergency Fund", query: "How much should I keep in my emergency reserve?" },
];

const AiAdvisorPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || "$";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello ${user?.name || "there"}! I am **BuildWealth AI**, your real-time wealth advisor and personal financial strategist.

I have synchronized with your live transactions, budgets, and savings goals. Ask me anything about your money, spending affordability, or wealth-building strategies!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

      // Add assistant message
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch (err) {
      toast.error("AI Advisor query failed: " + err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I experienced a temporary network latency connecting to the financial engine. Please try asking again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("AI advice copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: `Chat session reset. What financial topic would you like to explore?`,
      },
    ]);
  };

  // Markdown renderer for headers, bold, alert quotes, bullet points
  const renderMessageContent = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      if (line.startsWith("### ")) {
        return (
          <h4
            key={i}
            className="text-base font-bold text-foreground mt-3 mb-1.5 pb-1 border-b border-border/40"
            dangerouslySetInnerHTML={{ __html: formatted.replace("### ", "") }}
          />
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li
            key={i}
            className="ml-4 list-disc text-xs sm:text-sm text-foreground/90 my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace("- ", "") }}
          />
        );
      }
      if (line.startsWith("> [!TIP]") || line.startsWith("> [!WARNING]")) {
        const isTip = line.includes("TIP");
        return (
          <div
            key={i}
            className={`my-2 p-2.5 rounded-lg border text-xs font-semibold ${
              isTip
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            }`}
          >
            {isTip ? "💡 Pro Tip" : "⚠️ Caution Alert"}
          </div>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={i}
            className="pl-3 border-l-2 border-emerald-500 my-2 text-xs italic text-muted-foreground bg-muted/20 py-1 rounded-r"
            dangerouslySetInnerHTML={{ __html: formatted.replace("> ", "") }}
          />
        );
      }
      if (!line.trim()) {
        return <div key={i} className="h-1.5" />;
      }
      return (
        <p
          key={i}
          className="text-xs sm:text-sm text-foreground/90 leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                BuildWealth AI Real-Time Advisor
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Powered by deep financial intelligence • Contextually linked to your live transactions
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear Chat
        </Button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        <span className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Prompts:
        </span>
        {CATEGORIZED_PROMPTS.map((item, i) => (
          <button
            key={i}
            onClick={() => handleSend(item.query)}
            disabled={loading}
            className="shrink-0 px-3.5 py-1.5 rounded-full border border-border bg-card/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-xs font-medium text-muted-foreground hover:text-emerald-500 transition-all text-left shadow-sm active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Area Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden flex flex-col h-[580px]">
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
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm relative group ${
                    isBot
                      ? "bg-muted/60 dark:bg-muted/40 border border-border text-foreground"
                      : "bg-emerald-600 text-white shadow-emerald-600/15"
                  }`}
                >
                  {isBot ? renderMessageContent(m.text) : <p className="text-sm font-medium">{m.text}</p>}

                  {/* Copy Button on Bot Messages */}
                  {isBot && (
                    <button
                      onClick={() => handleCopy(m.text, index)}
                      title="Copy advice"
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-card/80 hover:bg-card border border-border text-muted-foreground hover:text-foreground"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {!isBot && (
                  <div className="h-8 w-8 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-border">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 rounded-2xl bg-muted/60 border border-border flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-medium">Analyzing live finances & calculating recommendations...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/60 backdrop-blur-sm">
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
              placeholder="Ask anything about your money, budgets, or wealth strategies..."
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
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
