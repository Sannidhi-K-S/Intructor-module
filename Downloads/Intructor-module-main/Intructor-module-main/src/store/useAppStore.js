import { create } from "zustand";
import { fetchDashboard, fetchHistory } from "../api/sessionApi";

const useAppStore = create((set) => ({
  user: null,
  sessions: [],
  historySessions: [],
  activeSession: null,

  setActiveSession: (session) => set({ activeSession: session }),

  loadDashboard: async () => {
    try {
      const data = await fetchDashboard();

      set({
        user: data.user,
        sessions: data.sessions,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  },

  loadHistory: async () => {
    try {
      const data = await fetchHistory();
      set({ historySessions: data });
    } catch (err) {
      console.error("History error:", err);
    }
  },
}));

export default useAppStore;