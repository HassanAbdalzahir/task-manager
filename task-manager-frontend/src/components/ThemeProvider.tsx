"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDarkMode, setDarkMode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Apply theme to HTML element
  const applyTheme = (darkMode: boolean) => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;

    // Remove dark class first
    root.classList.remove("dark");

    // Add dark class if needed
    if (darkMode) {
      root.classList.add("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize theme on mount - only run once
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const hasDarkClass = root.classList.contains("dark");

    // Only sync if there's a mismatch and we have a valid state
    if (typeof isDarkMode === "boolean" && hasDarkClass !== isDarkMode) {
      if (hasDarkClass) {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    }
    // If no state is set, default to light mode
    else if (typeof isDarkMode === "undefined") {
      root.classList.remove("dark");
      setDarkMode(false);
    }
  }, [mounted]); // Only depend on mounted, not isDarkMode

  // Apply theme when isDarkMode changes - only after mount
  useEffect(() => {
    if (!mounted) return;
    applyTheme(isDarkMode);
  }, [isDarkMode, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
