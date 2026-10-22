import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Mic,
  MicOff,
  ArrowRight,
  ReceiptText,
  PiggyBank,
  Compass,
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
      actionChips: [
        "Can I afford a $350 purchase?",
        "How much have I spent on food?",
        "Show my 50/30/20 budget breakdown",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initialize Speech Recognition for Voice Dictation
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error("Microphone access error: " + event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening... Speak your financial question now", { duration: 3000 });
      } catch (err) {
        console.error("Mic start failed:", err);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = { role: "user", text };
    const botPlaceholderIndex = messages.length + 1;

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", text: "", streaming: true, actionChips: [] },
    ]);

    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      await api.streamChatAdvisor(
        text,
        history,
        (chunk, accumulated) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              lastMsg.text = accumulated;
              lastMsg.streaming = true;
            }
            return updated;
          });
        },
        (finalText, actionChips) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              lastMsg.text = finalText;
              lastMsg.streaming = false;
              lastMsg.actionChips = actionChips || [];
            }
            return updated;
          });
        }
      );
    } catch (err) {
      console.error("AI Advisor query error:", err);
      toast.error("AI Advisor query failed: " + err.message);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.text =
            "I experienced a brief communication latency connecting to the financial engine. Please try asking again in a moment.";
          lastMsg.streaming = false;
        }
        return updated;
      });
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
        actionChips: [
          "Can I afford a $350 purchase?",
          "How much have I spent on food?",
          "Show my 50/30/20 budget breakdown",
        ],
      },
    ]);
  };

  // Markdown renderer for headers, bold, alert quotes, bullet points
  const renderMessageContent = (text, isStreaming) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1">
        {lines.map((line, i) => {
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
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <li
                key={i}
                className="ml-4 list-disc text-xs sm:text-sm text-foreground/90 my-1 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-*]\s+/, "") }}
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
              className="text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatted }}
            />
          );
        })}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                AI Financial Advisor
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Streaming
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Powered by live portfolio ledger context and Google Gemini Generative Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="text-xs gap-1.5 h-9 bg-card/80 hover:bg-muted border-border"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset Chat
          </Button>
        </div>
      </div>

      {/* Suggested Starter Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        <span className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-1">
          <Compass className="h-3.5 w-3.5 text-emerald-500" /> Explore:
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

      {/* Main Chat Area Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col h-[620px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m, index) => {
            const isBot = m.role === "assistant";
            return (
              <div
                key={index}
                className={`flex flex-col ${isBot ? "items-start" : "items-end"} gap-1.5`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[90%] sm:max-w-[82%] ${
                    isBot ? "justify-start" : "justify-end flex-row-reverse"
                  }`}
                >
                  {isBot ? (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-border">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-4 shadow-sm relative group ${
                      isBot
                        ? "bg-muted/60 dark:bg-muted/40 border border-border text-foreground"
                        : "bg-emerald-600 text-white shadow-emerald-600/15"
                    }`}
                  >
                    {isBot ? (
                      m.text ? (
                        renderMessageContent(m.text, m.streaming)
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                          <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                          <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                          <span>Streaming real-time financial solution...</span>
                        </div>
                      )
                    ) : (
                      <p className="text-sm font-medium">{m.text}</p>
                    )}

                    {/* Copy Button on Bot Messages */}
                    {isBot && m.text && !m.streaming && (
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
                </div>

                {/* Dynamic Action Chips generated specifically for this answer */}
                {isBot && m.actionChips && m.actionChips.length > 0 && !m.streaming && (
                  <div className="flex flex-wrap gap-1.5 ml-11 mt-1">
                    {m.actionChips.map((chip, chipIdx) => (
                      <button
                        key={chipIdx}
                        onClick={() => handleSend(chip)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all hover:scale-102 active:scale-98 shadow-xs"
                      >
                        <Sparkles className="h-3 w-3" />
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Shortcut Banner */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-500" /> Fast Navigation:
          </span>
          <div className="flex items-center gap-3">
            <Link to="/budgets" className="hover:text-emerald-500 flex items-center gap-1">
              <PiggyBank className="h-3.5 w-3.5" /> Budgets
            </Link>
            <Link to="/transactions" className="hover:text-emerald-500 flex items-center gap-1">
              <ReceiptText className="h-3.5 w-3.5" /> Transactions
            </Link>
          </div>
        </div>

        {/* Input Form with Real-Time Voice Dictation */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/60 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading}
              title={isListening ? "Stop listening" : "Click to speak your question"}
              className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                isListening
                  ? "bg-rose-500 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-500/30"
                  : "bg-muted hover:bg-accent border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={
                isListening
                  ? "Listening to your voice... Speak clearly"
                  : "Ask anything about your money, budgets, or wealth strategies..."
              }
              className={`flex-1 px-4 py-3 text-sm rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                isListening ? "border-rose-500/50 ring-2 ring-rose-500/20" : "border-border"
              }`}
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
