"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "assistant", content: "Hi! I'm your AI assistant. Ask me to write descriptions, generate SEO titles, suggest categories, or summarize data." }
  ]);

  const sendQuery = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite-professional", text: userMsg }),
      });
      const d = await r.json();
      setMessages(m => [...m, { role: "assistant", content: d.result || "I couldn't process that. Try rephrasing." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="white"/>
          <path d="M12 18L12.5 20.5L13 22L12 21L11 22L11.5 20.5L12 18Z" fill="white"/>
        </svg>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[9999] w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3" style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
              <div className="flex items-center gap-2 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="white"/>
                </svg>
                <span className="font-bold text-sm">AI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-950">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                    m.role === "user" 
                      ? "bg-purple-600 text-white rounded-br-none" 
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-none border border-slate-200 dark:border-slate-700"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendQuery()}
                placeholder="Ask AI..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border bg-background"
              />
              <button onClick={sendQuery} className="p-1.5 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
