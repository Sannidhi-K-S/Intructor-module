import { create } from "zustand";
import { fetchDashboard, fetchHistory } from "../api/sessionApi";

const useAppStore = create((set) => ({
  user: null,
  sessions: [],
  historySessions: [],
  activeSession: null,

  setActiveSession: (session) => set({ activeSession: session }),

  updateActiveSessionExercise: (exerciseId, data) => set((state) => {
    if (!state.activeSession?.lessonPlan?.exercises) return state;
    
    const updatedExercises = state.activeSession.lessonPlan.exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, ...data } : ex
    );
    
    return {
      activeSession: {
        ...state.activeSession,
        lessonPlan: {
          ...state.activeSession.lessonPlan,
          exercises: updatedExercises
        }
      }
    };
  }),

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