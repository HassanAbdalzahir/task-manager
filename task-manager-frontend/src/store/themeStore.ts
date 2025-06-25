import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      toggleDarkMode: () => {
        const currentState = get();
        const newState = !currentState.isDarkMode;
        set({ isDarkMode: newState });
      },
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
      },
    }),
    {
      name: "theme-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDarkMode =
            typeof state.isDarkMode === "boolean" ? state.isDarkMode : false;
        }
      },
    }
  )
);
