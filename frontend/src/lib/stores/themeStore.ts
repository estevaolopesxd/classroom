import { create } from "zustand";
import type { Theme } from "@/types";

interface ThemeState {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: null,
  setTheme: (theme) => set({ theme }),
}));
