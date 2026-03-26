import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TrainingData.css";
import CanvasBoard from "./CanvasBoard";
import useAppStore from "../store/useAppStore";
import SessionPreparationPanel from "./SessionPreparation";

import {
  HiOutlineChevronLeft,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineBookOpen,
} from "react-icons/hi2";

const scoreColors = {
  1: "bg-red-500 text-white border-red-600",
  2: "bg-orange-400 text-white border-orange-500",
  3: "bg-yellow-300 text-slate-900 border-yellow-400",
  4: "bg-lime-400 text-slate-900 border-lime-500",
  5: "bg-emerald-600 text-white border-emerald-700",
};

/* ================= GRADE ENGINE ================= */
const calculateFinalGrade = (exercises) => {
  const scoreMap = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
  let total = 0;
  let count = 0;
  exercises.forEach((ex) => {
    if (ex.score > 0) {
      total += scoreMap[ex.score];
      count++;
    }
  });
  return count === 0 ? 0 : Math.round(total / count);
};

const getGradeLabel = (grade) => {
  if (grade >= 90) return "Excellent";
  if (grade >= 75) return "Good";
  if (grade >= 60) return "Average";
  if (grade >= 40) return "Weak";
  return "Poor";
};

/* ================= COMPONENT ================= */
const TrainingData = () => {
  const navigate = useNavigate();
  const { activeSession } = useAppStore();

  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const containerRef = useRef(null);
  const saveTimeout = useRef(null);
  const latestExercisesRef = useRef([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeExercise, setActiveExercise] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [activeTool, setActiveTool] = useState("pen");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLessonPlanView, setShowLessonPlanView] = useState(false);

  // 🧠 Initialize exercises from activeSession or database
  useEffect(() => {
    if (activeSession?.lessonPlan?.exercises) {
      const formatted = activeSession.lessonPlan.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        type: ex.type,
        score: ex.score || 0,
        canvasData: null
      }));
      setExercises(formatted);
    }
  }, [activeSession]);

  const current = exercises[activeExercise];
  const finalGrade = calculateFinalGrade(exercises);

  /* ================= SESSION ================= */
  useEffect(() => {
    if (activeSession?.id) {
      setSessionId(activeSession.id);
    } else {
      const existing = localStorage.getItem("session_id");
      if (existing) setSessionId(Number(existing));
    }
  }, [activeSession]);

  useEffect(() => {
    latestExercisesRef.current = exercises;
  }, [exercises]);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!sessionId || !current) return;

    const fetchData = async () => {
      if (current.canvasData !== null) return;

      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/exercise/${current.id}/${sessionId}`);
        const data = await res.json();

        if (data) {
          setExercises((prev) => {
            const updated = [...prev];
            updated[activeExercise] = {
              ...updated[activeExercise],
              score: data.score || 0,
              canvasData: typeof data.canvas_data === "string" ? JSON.parse(data.canvas_data) : data.canvas_data,
            };
            return updated;
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeExercise, sessionId, current]);

  /* ================= SAVE ================= */
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
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* ================= FINAL GRADE SAVE ================= */
  useEffect(() => {
    if (!sessionId || exercises.length === 0) return;

    fetch("http://localhost:5000/save-final-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(console.error);
  }, [exercises, sessionId]);

  /* ================= ACTIONS ================= */
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

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (latestExercisesRef.current) {
        saveToBackend(latestExercisesRef.current[activeExercise]);
      }
    }, 500);
  };

  const handleExerciseChange = (index) => {
    if (fabricCanvas.current) {
      const data = fabricCanvas.current.toJSON();
      setExercises((prev) => {
        const updated = [...prev];
        updated[activeExercise] = { ...updated[activeExercise], canvasData: data };
        saveToBackend(updated[activeExercise]);
        return updated;
      });
    }
    setActiveExercise(index);
  };

  const [isEnding, setIsEnding] = useState(false);
  const [showDebriefButton, setShowDebriefButton] = useState(false);

  const handleEndSession = async () => {
    setIsEnding(true);
    if (current) saveToBackend(current);
    try {
      await fetch("http://localhost:5000/save-final-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      setTimeout(() => {
        setIsEnding(false);
        setShowDebriefButton(true);
      }, 2500);
    } catch (err) {
      console.error(err);
      setIsEnding(false);
      navigate("/");
    }
  };

  if (showLessonPlanView) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setShowLessonPlanView(false)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-bold transition">
            <HiOutlineArrowLeft /> Back to Evaluation
          </button>
        </div>
        
        <SessionPreparationPanel mode="view-only" />
      </div>
    );
  }

  return (
    <div className="training-container container-app section-stack relative">
      {isEnding && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Generating AI Debrief</h2>
          <p className="text-slate-400 font-medium">Analyzing performance metrics and behavioral patterns...</p>
        </div>
      )}

      {showDebriefButton && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
            <HiOutlineSparkles className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-4">Evaluation Complete!</h2>
          <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
            The session has been successfully evaluated. The AI-generated debrief summary and performance analytics are now ready for review.
          </p>
          <button 
            onClick={() => navigate(`/logbook/${sessionId}`)}
            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xl font-bold shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
          >
            <HiOutlineArrowRight /> View Training Log & Export
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="training-header flex justify-between items-start">
        <div>
          <button onClick={() => navigate("/")} className="back-btn">
            <HiOutlineChevronLeft /> Back to Dashboard
          </button>
          <h1 className="training-title">
            {activeSession?.topic || "Loading Sequence..."}
          </h1>
          <div className="training-meta">
            <span>SESSION ID: {sessionId || "SESS-XXX"}</span>
            <span className="highlight uppercase">{activeSession?.type || "Evaluation"}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowLessonPlanView(true)} className="btn btn-secondary flex items-center gap-2">
            <HiOutlineBookOpen /> Lesson Plan
          </button>
          <button onClick={handleEndSession} className="btn btn-primary">End Session</button>
          <div className="final-grade-box text-center">
            <h3>Final Grade</h3>
            <p className="text-2xl font-bold">{finalGrade}%</p>
            <p className="text-sm text-slate-500">{getGradeLabel(finalGrade)}</p>
          </div>
        </div>
      </div>

      {/* SIDEBAR TOGGLE */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
        <HiOutlineBars3 /> {sidebarOpen ? "Hide Tasks" : "Show Tasks"}
      </button>

      <div className="grid lg:grid-cols-12 gap-6 mt-4">
        {sidebarOpen && (
          <div className="lg:col-span-3 sidebar">
            {exercises.map((ex, i) => (
              <button
                key={ex.id || i}
                onClick={() => handleExerciseChange(i)}
                className={`exercise-item ${i === activeExercise ? "active" : ""}`}
              >
                {i + 1}. {ex.name}
              </button>
            ))}
            {exercises.length === 0 && <p className="p-4 text-slate-400 italic">No exercises found.</p>}
          </div>
        )}

        <div className={`${sidebarOpen ? "lg:col-span-9" : "lg:col-span-12"} main-card`}>
          {current ? (
            <>
              <h2 className="exercise-title">
                {activeExercise + 1}. {current.name}
              </h2>
              <div className="score-section">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScore(current.score === s ? 0 : s)}
                    className={`score-btn ${current.score === s ? scoreColors[s] : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="canvas-container">
                {loading ? (
                  <div className="flex justify-center items-center min-h-[60vh] text-slate-500">Loading Canvas...</div>
                ) : (
                  <CanvasBoard
                    canvasRef={canvasRef}
                    fabricCanvas={fabricCanvas}
                    containerRef={containerRef}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    canvasData={current.canvasData}
                    setCanvasData={updateCanvasData}
                  />
                )}
              </div>
            </>
          ) : (
             <div className="flex justify-center items-center h-[60vh] text-slate-400 italic">
               Select an exercise from the task list.
             </div>
          )}
        </div>
      </div>

      {/* NAV */}
      <div className="nav-buttons">
        <button
          disabled={activeExercise === 0}
          onClick={() => handleExerciseChange(activeExercise - 1)}
          className="btn btn-secondary"
        >
          <HiOutlineArrowLeft /> Prev
        </button>
        <button
          onClick={() => {
            if (activeExercise === exercises.length - 1) {
              handleEndSession();
            } else {
              handleExerciseChange(activeExercise + 1);
            }
          }}
          className="btn btn-primary"
        >
          {activeExercise === exercises.length - 1 ? "End Session" : "Next Skill"}
        </button>
      </div>
    </div>
  );
};

export default TrainingData;