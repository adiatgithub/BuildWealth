import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export const ThemeToggle = ({ className = "" }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-xl border border-border bg-muted/40 animate-pulse ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
      className={`relative h-9 w-9 rounded-xl border border-border bg-card/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-accent hover:border-emerald-500/40 transition-all hover:scale-105 active:scale-95 shadow-sm group ${className}`}
    >
      <div className="relative h-4 w-4">
        <Sun
          className={`h-4 w-4 text-amber-500 transition-all duration-300 absolute inset-0 ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`h-4 w-4 text-emerald-400 transition-all duration-300 absolute inset-0 ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
