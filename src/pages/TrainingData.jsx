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

  const [traineeInfo] = useState({ name: "Trainee Name", id: "TRN-8829" });
  const [showLessonPlan, setShowLessonPlan] = useState(false);

  const ACTIVE_SESSION_TYPE = activeSession?.training_type || activeSession?.type || "";
  const IS_SUPPORTED_SESSION = ACTIVE_SESSION_TYPE.toLowerCase().includes("flight") || ACTIVE_SESSION_TYPE.toLowerCase().includes("simulator");

  const current = exercises.length > 0 ? exercises[activeExercise] : null;
  const finalGrade = calculateFinalGrade(exercises);

  /* ================= AUTO-SELECT ONGOING SESSION ================= */
  useEffect(() => {
    const checkSessions = async () => {
      // 1. Try to restore from localStorage if current store is empty
      const savedId = localStorage.getItem("last_active_session_id");

      if (!activeSession) {
        if (sessions.length === 0) await loadDashboard();
        const currentSessions = useAppStore.getState().sessions;

        // 2. Prioritize the saved ID from refresh
        const restored = savedId ? currentSessions.find(s => String(s.id) === savedId) : null;
        if (restored) {
          setActiveSession(restored);
        } else {
          // 3. Fallback to first ongoing
          const ongoing = currentSessions.find(s => s.status === "ongoing" || s.isActive);
          if (ongoing) setActiveSession(ongoing);
        }
      } else if (activeSession.id) {
        // 4. Update localStorage whenever activeSession changes
        localStorage.setItem("last_active_session_id", String(activeSession.id));
      }
    };
    checkSessions();
  }, [activeSession, sessions.length, loadDashboard, setActiveSession]);

  /* ================= INIT DATA ================= */
  useEffect(() => {
    const initializePage = async () => {
      if (!activeSession) return;
      setLoading(true);
      try {
        let exData = [];
        // Check if session has exercises in the lesson plan
        if (activeSession?.lessonPlan?.exercises?.length > 0) {
          exData = activeSession.lessonPlan.exercises;
        } else if (activeSession?.lessonplan?.exercise?.length > 0) {
          exData = activeSession.lessonplan.exercise;
        } else {
          // Fetch existing training data if it exists
          const res = await fetch(`http://localhost:5000/api/sessions/training-data/session/${activeSession.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.sessionexercise) exData = data.sessionexercise;
          }
        }

        if (!exData || exData.length === 0) {
          exData = fallbackExercises;
        }

        setExercises(exData.map(ex => ({
          id: ex.id || ex.exercise_id,
          name: ex.name || ex.exercise_name,
          type: ex.type || ex.exercise_type,
          score: ex.score || 0,
          canvasData: ex.canvas_data ? JSON.parse(ex.canvas_data) : (ex.canvasData || null),
          notes: ex.notes || ""
        })));

        setSessionId(Number(activeSession.id));
      } catch (err) {
        setExercises(fallbackExercises);
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [activeSession]);

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
    navigate(`/logbook/${sessionId}`);
  };

  /* ================= UI RENDERING ================= */
  if (activeSession && !IS_SUPPORTED_SESSION) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full border-t-4 border-amber-500">
          <h2 className="text-2xl font-bold mb-4">Training Canvas Disabled</h2>
          <p className="text-slate-500 mb-6">Evaluations and canvas annotations are only available for <strong>Flight Training</strong> and <strong>Simulator</strong> sessions. This session is labeled as "{ACTIVE_SESSION_TYPE.replace("_", " ")}".</p>
          <button onClick={() => navigate("/")} className="btn-secondary px-6 py-2 rounded-lg border w-full font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!activeSession && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full border-t-4 border-amber-500">
          <h2 className="text-2xl font-bold mb-4">No Active Session Found</h2>
          <p className="text-slate-500 mb-6">Please select an ongoing session from your Dashboard to start training.</p>
          <button onClick={() => navigate("/")} className="btn-secondary px-6 py-2 rounded-lg border w-full font-bold">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (activeSession && activeSession.status !== 'ongoing' && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full border-t-4 border-amber-500">
          <h2 className="text-2xl font-bold mb-4">Session Not Live</h2>
          <p className="text-slate-500 mb-6"> Training evaluations can only be recorded for live (ongoing) sessions.</p>
          <button onClick={() => navigate("/")} className="btn-secondary px-6 py-2 rounded-lg border w-full font-bold text-slate-700 bg-slate-100 hover:bg-slate-200">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-container container-app section-stack">

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
              {ACTIVE_SESSION_TYPE} SESSION
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

        <div
          key={activeExercise}
          className={`${sidebarOpen ? "md:col-span-8 lg:col-span-9" : "md:col-span-12"} main-card bg-white rounded-xl shadow-lg border border-slate-100 p-4 md:p-6 animate-in slide-in-from-right-4 fade-in duration-500`}
        >
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
                onClick={() => setShowLessonPlan(true)}
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
      {/* LESSON PLAN MODAL */}
      {showLessonPlan && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLessonPlan(false)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Review Lesson Plan</h3>
              <button
                onClick={() => setShowLessonPlan(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all text-slate-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-8">
              <section>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 block">Primary Topic</label>
                <p className="text-2xl font-bold text-slate-900 leading-tight">{activeSession?.lessonplan?.topic || activeSession?.lessonPlan?.topic || "Fundamentals of Flight"}</p>
              </section>

              <section className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Expected Outcome</label>
                  <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                    "{activeSession?.lessonplan?.expectedOutcome || activeSession?.lessonPlan?.expectedOutcome || "Trainee should demonstrate situational awareness and precise control inputs during all phases of the exercise."}"
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Instructor Notes</label>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {activeSession?.lessonplan?.instructorNotes || activeSession?.lessonPlan?.instructorNotes || "No specific briefing notes provided for this session."}
                  </p>
                </div>
              </section>

              <section>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Defined Objectives</label>
                    <div className="space-y-3">
                      {(activeSession?.lessonplan?.lessonobjective || activeSession?.lessonPlan?.objectives || []).length > 0 ? (
                        (activeSession?.lessonplan?.lessonobjective || activeSession?.lessonPlan?.objectives).map((obj, i) => (
                          <div key={i} className="flex items-start gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                            <p className="text-sm text-slate-700 font-medium">{obj.text || obj}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-sm italic py-4">No specific objectives listed.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Curriculum Exercises</label>
                    <div className="space-y-3">
                      {(activeSession?.lessonplan?.exercise || activeSession?.lessonPlan?.exercises || []).length > 0 ? (
                        (activeSession?.lessonplan?.exercise || activeSession?.lessonPlan?.exercises).map((ex, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{ex.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{ex.type || "Evaluation Task"}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">NOT STARTED</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-sm italic py-4">No exercises defined for this plan.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end">
              <button
                onClick={() => setShowLessonPlan(false)}
                className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Continue Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingData;