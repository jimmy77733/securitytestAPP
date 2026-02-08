import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  cycleTheme: () => ThemeMode;
}

function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
}

function applyTheme(effective: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', effective);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',

      setTheme: (mode) => {
        set({ mode });
        applyTheme(getEffectiveTheme(mode));
      },

      cycleTheme: () => {
        const order: ThemeMode[] = ['system', 'light', 'dark'];
        const current = get().mode;
        const next = order[(order.indexOf(current) + 1) % order.length];
        set({ mode: next });
        applyTheme(getEffectiveTheme(next));
        return next;
      },
    }),
    { name: 'theme-storage' }
  )
);

if (typeof window !== 'undefined') {
  useThemeStore.subscribe((state) => {
    applyTheme(getEffectiveTheme(state.mode));
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().mode === 'system') {
      applyTheme(getEffectiveTheme('system'));
    }
  });
}
