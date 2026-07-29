import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;

  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (value: boolean) => void;

  activeDocumentId: string | null;
  setActiveDocumentId: (id: string | null) => void;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  mobileDrawerOpen: false,
  setMobileDrawerOpen: (value) => set({ mobileDrawerOpen: value }),

  activeDocumentId: null,
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),

  theme: "light",
  setTheme: (theme) => set({ theme }),
}));