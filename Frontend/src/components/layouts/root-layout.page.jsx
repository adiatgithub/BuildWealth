import React from "react";
import Header from "../header.jsx";
import { Outlet, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { Wallet, ShieldCheck, Sparkles } from "lucide-react";

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-500">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-border/40 bg-card/40 backdrop-blur-sm py-8 mt-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">BuildWealth.AI</span>
            <span className="text-xs text-muted-foreground ml-2">
              © {new Date().getFullYear()} Intelligent Personal Wealth System
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-Bit Bank Grade Encryption
            </span>
            <span className="flex items-center gap-1.5 text-cyan-500">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Advanced AI
            </span>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default RootLayout;