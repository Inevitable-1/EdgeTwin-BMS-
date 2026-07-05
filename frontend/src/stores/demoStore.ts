import { create } from 'zustand';

interface DemoState {
  enabled: boolean;
  speed: number;
  toggle: () => void;
  setSpeed: (speed: number) => void;
}

export const useDemoStore = create<DemoState>()((set) => ({
  enabled: true,
  speed: 1,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  setSpeed: (speed) => set({ speed }),
}));
