"use client";

import { useThemeStore } from "@/store/themeStore";

export default function DarkModeTest() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <div className="text-sm">
        <div className="font-bold text-gray-900 dark:text-white">
          Dark Mode Test
        </div>
        <div className="text-gray-600 dark:text-gray-300">
          isDarkMode: {isDarkMode ? "true" : "false"}
        </div>
        <div className="text-gray-600 dark:text-gray-300">
          HTML has dark class:{" "}
          {typeof window !== "undefined" &&
          window.document.documentElement.classList.contains("dark")
            ? "yes"
            : "no"}
        </div>
      </div>
    </div>
  );
}
