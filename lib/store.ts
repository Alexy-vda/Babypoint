import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

interface UserStore {
  user: User | null;
  currentLeagueId: string | null;
  setUser: (user: User | null) => void;
  setCurrentLeagueId: (leagueId: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      currentLeagueId: null,
      setUser: (user) => set({ user }),
      setCurrentLeagueId: (leagueId) => set({ currentLeagueId: leagueId }),
      clearUser: () => set({ user: null, currentLeagueId: null }),
    }),
    {
      name: "babypoint-user-storage",
    }
  )
);
