import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TrainingData.css";
import CanvasBoard from "./CanvasBoard";
import useAppStore from "../store/useAppStore";

import {
  HiOutlineChevronLeft,
  HiOutlineBars3,
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

/* ================= GRADE ENGINE ================= */

const calculateFinalGrade = (exercises) => {
  if (!exercises || exercises.length === 0) return 0;
  const total = exercises.reduce((sum, ex) => sum + (ex.score || 0), 0);
  const maxTotal = exercises.length * 5; // since max score per exercise = 5
  const percentage = (total / maxTotal) * 100;
  return Math.round(percentage);
};

/* ================= COMPONENT ================= */

const TrainingData = () => {
  const navigate = useNavigate();
  const { sessions, loadDashboard, setActiveSession, activeSession, updateActiveSessionExercise } = useAppStore();

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

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [traineeInfo] = useState({ name: "Trainee Name", id: "TRN-8829" });

  const ACTIVE_SESSION_TYPE = activeSession?.type || "";
  const IS_SUPPORTED_SESSION = ACTIVE_SESSION_TYPE.toLowerCase().includes("flight") || ACTIVE_SESSION_TYPE.toLowerCase().includes("simulator");

  const current = exercises.length > 0 ? exercises[activeExercise] : null;
  const finalGrade = calculateFinalGrade(exercises);

  /* ================= AUTO-SELECT ONGOING SESSION ================= */
  useEffect(() => {
    const checkSessions = async () => {
      if (activeSession) return;

      if (sessions.length === 0) {
        await loadDashboard();
        // If still 0 after loading, show the modal
        const currentSessions = useAppStore.getState().sessions;
        if (currentSessions.length === 0) {
          setShowDemoModal(true);
        } else {
          const ongoing = currentSessions.find(s => s.status === "ongoing");
          if (ongoing) setActiveSession(ongoing);
          else setShowDemoModal(true);
        }
      } else {
        const ongoing = sessions.find(s => s.status === "ongoing");
        if (ongoing) {
          setActiveSession(ongoing);
        } else {
          setShowDemoModal(true);
        }
      }
    };

    checkSessions();
  }, [activeSession, sessions.length, loadDashboard, setActiveSession]);

  /* ================= INIT DATA ================= */
  useEffect(() => {
    if (showDemoModal && !isDemoMode) return;

    const initializePage = async () => {
      setLoading(true);
      try {
        let exData = [];
        // Priority 1: Data from the store (real session)
        if (activeSession?.lessonPlan?.exercises?.length > 0) {
          exData = activeSession.lessonPlan.exercises;
        } else if (!activeSession) {
          // Priority 2: Templates from backend
          const exRes = await fetch("http://localhost:5000/api/sessions/exercises");
          if (exRes.ok) exData = await exRes.json();
        }

        if (!exData || exData.length === 0) {
          exData = fallbackExercises;
        }

        setExercises(exData.map(ex => ({
          id: ex.id,
          name: ex.name || ex.exercise_name,
          type: ex.type || ex.exercise_type,
          score: ex.score || 0,
          canvasData: ex.canvasData || null
        })));

        if (isDemoMode) {
          let demoId = localStorage.getItem("demo_session_id");
           if (!demoId) {
              const res = await fetch("http://localhost:5000/api/sessions/create-session", { method: "POST" });
              const data = await res.json();
              demoId = data?.session_id;
              if (demoId) localStorage.setItem("demo_session_id", demoId);
           }
          if (demoId) setSessionId(Number(demoId));
        } else if (activeSession?.id) {
          setSessionId(Number(activeSession.id));
        }
      } catch (err) {
        setExercises(fallbackExercises);
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [isDemoMode, showDemoModal, activeSession]);

  useEffect(() => {
    latestExercisesRef.current = exercises;
  }, [exercises]);

  /* ================= SAVE ================= */
  const saveToBackend = async (exercise) => {
    if (!sessionId || !exercise?.id || !exercise.canvasData || loading) return;
    console.log("Saving to Backend: session", sessionId, "ex", exercise.id, "data size", JSON.stringify(exercise.canvasData).length);
    try {
      await fetch("http://localhost:5000/api/sessions/save-exercise-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exercise.id,
          session_id: sessionId,
          name: exercise.name,
          type: exercise.type,
          score: exercise.score || 0,
          canvas_data: exercise.canvasData || null,
          notes: exercise.notes || "",
        }),
      });
    } catch (err) {
      console.error("Save error:", err);
    }
  };


  /* ================= SCORE & CANVAS UPDATES ================= */

  const setScore = (score) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[activeExercise].score = score;
      saveToBackend(updated[activeExercise]);
      updateActiveSessionExercise(updated[activeExercise].id, { score });
      return updated;
    });
  };

  const updateCanvasData = (data) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[activeExercise].canvasData = data;
      updateActiveSessionExercise(updated[activeExercise].id, { canvasData: data });
      return updated;
    });
  };


  /* ================= AUTO-SAVE CANVAS ================= */
  useEffect(() => {
    const currentEx = exercises[activeExercise];
    if (!currentEx || loading) return;

    const timer = setTimeout(() => {
      saveToBackend(currentEx);
    }, 1500);

    return () => clearTimeout(timer);
  }, [exercises[activeExercise]?.canvasData]);

  const handleExerciseChange = (index) => {
    if (fabricCanvas.current) {
      const data = fabricCanvas.current.toJSON();
      const updated = { ...exercises[activeExercise], canvasData: data };
      saveToBackend(updated);
    }
    setActiveExercise(index);
  };

  const handleGenerateDebrief = () => {
    if (fabricCanvas.current) {
      const data = fabricCanvas.current.toJSON();
      const updated = { ...exercises[activeExercise], canvasData: data };
      saveToBackend(updated);
    }
    if (sessionId) {
      fetch("http://localhost:5000/save-final-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    }
    navigate("/logbook");
  };

  /* ================= UI RENDERING ================= */
  if (showDemoModal && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">No Active Session</h2>
          <p className="text-slate-500 mb-6">Please select a session from the Dashboard or run a demo evaluation.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate("/")} className="btn-secondary px-6 py-2 rounded-lg border">Dashboard</button>
            <button onClick={() => { setIsDemoMode(true); setShowDemoModal(false); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Run Demo</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Training Module...</div>;
  }

  if (activeSession && !IS_SUPPORTED_SESSION && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full border-t-4 border-amber-500">
          <h2 className="text-2xl font-bold mb-4">No Active Training Classes Found</h2>
          <p className="text-slate-500 mb-6">The module "{ACTIVE_SESSION_TYPE}" does not support evaluation / training canvas.</p>
          <button onClick={() => navigate("/")} className="btn-secondary px-6 py-2 rounded-lg border w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-container container-app section-stack">
      {isDemoMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-blue-600/90 backdrop-blur-sm text-white px-4 py-1 rounded-full shadow-lg animate-in font-bold text-xs border border-white/20">
          🚀 Demo Mode
        </div>
      )}

      {/* HEADER */}
      <div className="training-header flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="back-btn flex items-center gap-1 mb-3 text-slate-500 hover:text-blue-600 transition-colors">
            <HiOutlineChevronLeft /> Back
          </button>
          
          <h1 className="training-title mb-1 font-black text-3xl">
            {activeSession?.session_title || activeSession?.topic || "Advanced Instrument Approaches"}
          </h1>

          <div className="training-meta mt-1 flex items-center gap-4">
            <span>SESSION ID: {activeSession?.id || (isDemoMode ? "DEMO-001" : "SESS-001")}</span>
            <span className="bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {isDemoMode ? "DEMO SESSION" : `${ACTIVE_SESSION_TYPE} SESSION`}
            </span>
          </div>
        </div>

        <div className="text-left md:text-right flex flex-col items-start md:items-end">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            {activeSession?.trainee || traineeInfo.name}
          </h2>
          <div className="training-meta mt-1">
            <span>TRAINEE ID: <span className="font-bold">{activeSession?.traineeId || traineeInfo.id}</span></span>
          </div>
        </div>
      </div>

      {/* TOOLBAR TOGGLE */}
      <div className="flex justify-between items-center mt-6">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle flex items-center gap-2 hover:bg-slate-100 p-2 rounded transition-colors group">
          <HiOutlineBars3 size={24} className="group-hover:text-blue-600" /> 
          <span className="font-semibold text-sm">Exercises</span>
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-6 mt-4">
        {sidebarOpen && (
          <div className="md:col-span-4 lg:col-span-3 sidebar animate-in h-fit border border-slate-200 rounded-xl bg-white shadow-sm overflow-y-auto max-h-[60vh]">
            {exercises.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => handleExerciseChange(i)}
                className={`exercise-item w-full text-left px-4 py-3 border-b last:border-0 ${i === activeExercise ? "active bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50"}`}
              >
                {i + 1}. {ex.name}
              </button>
            ))}
          </div>
        )}

        <div className={`${sidebarOpen ? "md:col-span-8 lg:col-span-9" : "md:col-span-12"} main-card bg-white rounded-xl shadow-lg border border-slate-100 p-4 md:p-6`}>
          <h2 className="text-xl font-bold mb-4 text-slate-800">{current?.name}</h2>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div className="score-section">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScore(s)}
                    className={`score-btn w-10 h-10 rounded-lg flex items-center justify-center font-bold border transition-all ${current?.score === s ? scoreColors[s] : "bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-500"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
                onClick={() => navigate("/lesson-plan")}
              >
                Lesson Plan
              </button>
              
              <div className="flex flex-col items-center bg-blue-50 px-5 py-1.5 rounded-lg border border-blue-100">
                <span className="text-[9px] uppercase tracking-widest text-blue-400 font-black">Final Grade</span>
                <span className="text-xl font-black text-blue-600 leading-none">{finalGrade}%</span>
              </div>
            </div>
          </div>

          <CanvasBoard
            key={`${current?.id}-${!!current?.canvasData}`}
            canvasRef={canvasRef}
            fabricCanvas={fabricCanvas}
            containerRef={containerRef}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            canvasData={current?.canvasData}
            setCanvasData={updateCanvasData}
          />


          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => { if (activeExercise > 0) handleExerciseChange(activeExercise - 1); }}
              disabled={activeExercise === 0}
              className="bg-slate-100 text-slate-500 px-6 py-2 rounded-lg font-bold disabled:opacity-30 hover:bg-slate-200 transition-all"
            >
              ← Previous
            </button>

            {activeExercise === exercises.length - 1 ? (
              <button
                onClick={handleGenerateDebrief}
                className="bg-emerald-600 text-white px-8 py-2 rounded-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all font-black text-sm uppercase tracking-wider"
              >
                Generate Debrief Summary
              </button>
            ) : (
              <button
                onClick={() => { handleExerciseChange(activeExercise + 1); }}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all font-bold"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingData;