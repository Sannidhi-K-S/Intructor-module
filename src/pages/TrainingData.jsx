import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TrainingData.css";
import CanvasBoard from "./CanvasBoard";
import useAppStore from "../store/useAppStore";

import {
  HiOutlineChevronLeft,
  HiOutlineBars3,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

/* ================= DATA ================= */

const fallbackExercises = [
  { id: 1, name: "Pre-flight IFR Briefing", score: 0, canvasData: null },
  { id: 2, name: "Avionics Setup & GPS Programming", score: 0, canvasData: null },
  { id: 3, name: "Precision ILS Z Rwy 26", score: 0, canvasData: null },
  { id: 4, name: "Missed Approach Procedures", score: 0, canvasData: null },
  { id: 5, name: "Post-flight Systems Check", score: 0, canvasData: null },
];

const scoreColors = {
  1: "bg-red-500 text-white border-red-600",
  2: "bg-orange-400 text-white border-orange-500",
  3: "bg-yellow-300 text-slate-900 border-yellow-400",
  4: "bg-lime-400 text-slate-900 border-lime-500",
  5: "bg-emerald-600 text-white border-emerald-700",
};

/* ================= COMPONENT ================= */

const TrainingData = () => {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const containerRef = useRef(null);
  const latestExercisesRef = useRef([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeExercise, setActiveExercise] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [activeTool, setActiveTool] = useState("pen");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const { activeSession, sessions, loadDashboard, setActiveSession } = useAppStore();

  const INSTRUCTOR_HAS_ACTIVE_SESSION = !!activeSession;
  const ACTIVE_SESSION_TYPE = activeSession?.type || "flight";

  const current = exercises.length > 0 ? exercises[activeExercise] : null;

  /* ================= AUTO-SELECT ONGOING SESSION ================= */
  useEffect(() => {
    if (!activeSession) {
      if (sessions.length === 0) {
        loadDashboard();
      } else {
        const ongoing = sessions.find(s => s.status === "ongoing");
        if (ongoing) {
          setActiveSession(ongoing);
        }
      }
    }
  }, [activeSession, sessions, loadDashboard, setActiveSession]);

  /* ================= SESSION & DB EXERCISES ================= */

  useEffect(() => {
    const initializePage = async () => {
      if (!activeSession) return;
      
      setLoading(true);
      try {
        setSessionId(activeSession.id);
        
        // If the session has a lesson plan with exercises, use those
        if (activeSession.lessonPlan?.exercises?.length > 0) {
          const formattedExercises = activeSession.lessonPlan.exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            type: ex.type,
            score: 0,
            canvasData: null
          }));
          setExercises(formattedExercises);
        } else {
          // Fallback if no exercises are assigned to the lesson plan
          setExercises(fallbackExercises);
        }
      } catch (err) {
        setToastMessage("Failed to load exercises for this session.");
        setExercises(fallbackExercises);
        setTimeout(() => setToastMessage(""), 4500);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [activeSession]);

  useEffect(() => {
    latestExercisesRef.current = exercises;
  }, [exercises]);

  /* ================= SAVE ACTIONS ================= */

  const saveToBackend = async (exercise) => {
    if (!sessionId || !exercise || !exercise.id) return;
    try {
      await fetch("http://localhost:5000/save-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exercise.id,
          session_id: sessionId,
          score: exercise.score || 0,
          canvas_data: exercise.canvasData || null,
        }),
      });
    } catch (err) { console.error("Save error:", err); }
  };

  const setScore = (score) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[activeExercise] = { ...updated[activeExercise], score };
      saveToBackend(updated[activeExercise]);
      return updated;
    });
  };

  const updateCanvasData = (data) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[activeExercise] = { ...updated[activeExercise], canvasData: data };
      return updated;
    });
  };

  const handleExerciseChange = (index) => {
    if (fabricCanvas.current) {
      const data = fabricCanvas.current.toJSON();
      const updatedExercise = { ...exercises[activeExercise], canvasData: data };
      saveToBackend(updatedExercise);
    }
    setActiveExercise(index);
  };

  const handleEndSession = async () => {
    saveToBackend(latestExercisesRef.current?.[activeExercise] || current);
    
    // Save to the new schema
    try {
      await fetch("http://localhost:5000/api/sessions/save-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: sessionId, 
          exercises: latestExercisesRef.current || exercises,
          overallNotes: "Session completed by instructor"
        }),
      });
    } catch (err) {
      console.error("Failed saving to metrics schema", err);
    }

    // Original final grade logic
    fetch("http://localhost:5000/save-final-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });

    navigate(`/reports/${sessionId}`);
  };

  /* ================= UI GUARDS ================= */

  // Strict Guard: Only show the training page if a session is actively selected from Dashboard
  const showCanvas = INSTRUCTOR_HAS_ACTIVE_SESSION;

  if (!showCanvas) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 max-w-lg text-center animate-in zoom-in-95">
          <h2 className="text-2xl font-bold mb-3 text-slate-800">No Training Scheduled</h2>
          <p className="text-slate-500 mb-8">No flight or simulator sessions assigned for today.</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary px-8">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (loading && exercises.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Connecting to Pilot Database...</div>;
  }

  return (
    <div className="training-container container-app section-stack">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl animate-in slide-in-from-top-4">
          ⚠️ {toastMessage}
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <h2 className="text-2xl font-bold mb-4">End Session?</h2>
            <p className="text-slate-600 mb-8">Return to dashboard and calculate final grade?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEndConfirm(false)} className="btn btn-secondary px-6">Cancel</button>
              <button onClick={handleEndSession} className="btn btn-primary bg-red-600 border-red-700 px-6">Confirm End</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="training-header flex justify-between items-start">
        <div>
          <button onClick={() => navigate(-1)} className="back-btn flex items-center gap-1 mb-3 text-slate-500">
            <HiOutlineChevronLeft /> Back
          </button>
          <h1 className="training-title mb-2">
            {activeSession?.lessonPlan?.topic || activeSession?.topic || "Flight Training"}
          </h1>
          <div className="training-meta mt-2 mb-2">
            <span>SESSION ID: {activeSession?.id || "SESS-001"}</span>
            <span className="ml-4">TRAINEE: <strong className="text-gray-800">{activeSession?.trainee}</strong></span>
            <span className="highlight uppercase ml-4">{ACTIVE_SESSION_TYPE} SESSION</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate("/lesson-plan")}>Lesson Plan</button>
          <button className="btn btn-primary" onClick={() => setShowEndConfirm(true)}>End Session</button>
        </div>
      </div>

      {/* EXERCISES & SIDEBAR */}
      <div className="flex justify-between items-center mt-6">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle flex items-center gap-2">
          <HiOutlineBars3 size={24} /> <span className="text-lg font-medium">Exercises</span>
        </button>
        <button className="btn btn-primary">Generate Debrief Summary</button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 mt-4">
        {sidebarOpen && (
          <div className="lg:col-span-3 sidebar">
            {exercises.map((ex, i) => (
              <button key={ex.id} onClick={() => handleExerciseChange(i)} className={`exercise-item ${i === activeExercise ? "active" : ""}`}>
                {i + 1}. {ex.name}
              </button>
            ))}
          </div>
        )}

        <div className={`${sidebarOpen ? "lg:col-span-9" : "lg:col-span-12"} main-card`}>
          <h2 className="exercise-title">{current?.name}</h2>
          <div className="score-section mb-4">
             {[1, 2, 3, 4, 5].map((s) => (
               <button key={s} onClick={() => setScore(s)} className={`score-btn ${current?.score === s ? scoreColors[s] : "bg-white"}`}>
                 {s}
               </button>
             ))}
          </div>
          <CanvasBoard
            key={current?.id}
            canvasRef={canvasRef}
            fabricCanvas={fabricCanvas}
            containerRef={containerRef}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            canvasData={current?.canvasData}
            setCanvasData={updateCanvasData}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainingData;