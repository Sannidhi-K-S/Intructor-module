import { create } from "zustand";
import { fetchDashboard, fetchHistory } from "../api/sessionApi";

const useAppStore = create((set) => ({
  user: null,
  sessions: [],
  historySessions: [],
  activeSession: null,
  loading: false,

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

  updateSessionData: (sessionId, data) => set((state) => ({
    sessions: state.sessions.map((s) => 
      String(s.id) === String(sessionId) ? { ...s, ...data } : s
    ),
    activeSession: state.activeSession && String(state.activeSession.id) === String(sessionId)
      ? { ...state.activeSession, ...data }
      : state.activeSession,
  })),

  loadDashboard: async () => {
    set({ loading: true });
    try {
      const data = await fetchDashboard();

      set({
        user: data.user,
        sessions: data.sessions,
        loading: false
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      set({ loading: false });
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