import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Button } from "./ui/button.jsx";
import { Bot, X, Sparkles, Send, Mic, MicOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const QUICK_CHIPS = [
  "Can I afford $100 today?",
  "Food spending this month",
  "How to save $200?",
];

const AiChatWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am your real-time AI wealth coach. Ask me about your spending, affordability, or savings goals!",
      actionChips: QUICK_CHIPS,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Speech Recognition Setup
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

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  if (!isAuthenticated) return null;

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
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
      toast.error("AI error: " + err.message);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.text = "Connection latency occurred. Please ask again in a moment.";
          lastMsg.streaming = false;
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[340px] sm:w-[390px] h-[520px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 backdrop-blur-xl">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-xs flex items-center gap-1.5">
                  BuildWealth AI Companion
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                </p>
                <p className="text-[10px] text-white/80">Real-Time Streaming</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors"
              aria-label="Close AI Companion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m, i) => {
              const isBot = m.role === "assistant";
              return (
                <div key={i} className="space-y-1.5">
                  <div
                    className={`p-3 rounded-2xl max-w-[88%] shadow-xs leading-relaxed ${
                      isBot
                        ? "bg-muted/70 text-foreground border border-border"
                        : "bg-emerald-600 text-white ml-auto"
                    }`}
                  >
                    {isBot && !m.text && m.streaming ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground py-0.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                        <span className="flex h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div>
                        {m.text}
                        {m.streaming && (
                          <span className="inline-block w-1.5 h-3 ml-0.5 bg-emerald-500 animate-pulse align-middle" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Chips */}
                  {isBot && m.actionChips && m.actionChips.length > 0 && !m.streaming && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {m.actionChips.slice(0, 3).map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          onClick={() => handleSend(chip)}
                          disabled={loading}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all text-left"
                        >
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

          {/* Input Form with Voice Dictation */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-border flex gap-1.5 bg-background items-center"
          >
            <button
              type="button"
              onClick={toggleVoice}
              disabled={loading}
              title={isListening ? "Listening..." : "Click to speak"}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all ${
                isListening
                  ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                  : "bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={isListening ? "Listening..." : "Ask AI Advisor..."}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <Button
              size="sm"
              type="submit"
              disabled={loading || !input.trim()}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 h-12 px-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all shadow-emerald-600/30 font-semibold text-xs group"
          aria-label="Open AI Financial Companion"
        >
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <span>Ask AI Advisor</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
        </button>
      )}
    </div>
  );
};

export default AiChatWidget;
