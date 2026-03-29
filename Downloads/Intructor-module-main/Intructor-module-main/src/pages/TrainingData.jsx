import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TrainingData.css";
import CanvasBoard from "./CanvasBoard";

import {
  HiOutlineChevronLeft,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
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
  const [toastMessage, setToastMessage] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // FUTURE ARCHITECTURE MOCK: These will come from your global Dashboard/Auth state later
  const INSTRUCTOR_HAS_ACTIVE_SESSION = true; 
  const ACTIVE_SESSION_TYPE = "flight"; // can be "flight", "simulator", or "class"

  const current = exercises.length > 0 ? exercises[activeExercise] : null;
  const finalGrade = calculateFinalGrade(exercises);

  /* ================= SESSION ================= */

  /* ================= SESSION & DB EXERCISES ================= */

  useEffect(() => {
    let currentSessionId = localStorage.getItem("session_id");

    const initializePage = async () => {
      try {
        setLoading(true);

        const exRes = await fetch("http://localhost:5000/exercises");
        if (!exRes.ok) throw new Error("DB Connection Error");

        const exData = await exRes.json();
        
        if (!exData || exData.length === 0) {
          throw new Error("No exercises found in DB");
        }

        const formattedExercises = exData.map(ex => ({
          id: ex.id,
          name: ex.name,
          score: 0,
          canvasData: null
        }));
        
        setExercises(formattedExercises);

        if (currentSessionId) {
          setSessionId(Number(currentSessionId));
        } else {
          try {
            const sessRes = await fetch("http://localhost:5000/create-session", { method: "POST" });
            const sessData = await sessRes.json();
            if (sessData && sessData.session_id) {
              setSessionId(sessData.session_id);
              localStorage.setItem("session_id", sessData.session_id);
            }
          } catch(err) {}
        }
      } catch (err) {
        console.error("Init Error:", err);
        setToastMessage("Still not connected to DB - using demo data.");
        setExercises(fallbackExercises);
        setTimeout(() => setToastMessage(""), 4500);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

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
        const res = await fetch(
          `http://localhost:5000/exercise/${current.id}/${sessionId}`
        );

        const data = await res.json();

        if (data) {
          setExercises((prev) => {
            const updated = [...prev];
            updated[activeExercise] = {
              ...updated[activeExercise],
              score: data.score || 0,
              canvasData:
                typeof data.canvas_data === "string"
                  ? JSON.parse(data.canvas_data)
                  : data.canvas_data,
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
  }, [activeExercise, sessionId]);

  /* ================= SAVE ================= */

  const saveToBackend = async (exercise) => {
    if (!sessionId || !exercise || !exercise.id) return;

    try {
      await fetch("http://localhost:5000/save-exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    if (!sessionId) return;

    fetch("http://localhost:5000/save-final-grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(console.error);
  }, [exercises, sessionId]);

  /* ================= ACTIONS ================= */

  const setScore = (score) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[activeExercise] = {
        ...updated[activeExercise],
        score,
      };

      saveToBackend(updated[activeExercise]);
      return updated;
    });
  };

  const updateCanvasData = (data) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[activeExercise] = {
        ...updated[activeExercise],
        canvasData: data,
      };
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
        updated[activeExercise] = {
          ...updated[activeExercise],
          canvasData: data,
        };
        saveToBackend(updated[activeExercise]);
        return updated;
      });
    }

    setActiveExercise(index);
  };

  const handleEndSession = () => {
    saveToBackend(latestExercisesRef.current?.[activeExercise] || current);

    fetch("http://localhost:5000/save-final-grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });

    navigate("/");
  };

  /* ================= UI ================= */

  if (!INSTRUCTOR_HAS_ACTIVE_SESSION || (ACTIVE_SESSION_TYPE !== "flight" && ACTIVE_SESSION_TYPE !== "simulator")) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineBars3 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">No Training Scheduled</h2>
          <p className="text-slate-500 mb-8">
            You do not currently have an active <strong>Flight</strong> or <strong>Simulator</strong> session assigned for today. Class sessions do not utilize the live training canvas.
          </p>
          <button onClick={() => navigate(-1)} className="btn btn-primary px-8">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Training Session from Database...</div>;
  }

  return (
    <div className="training-container container-app section-stack">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-lg shadow-xl font-medium flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
          <span>⚠️</span> {toastMessage}
        </div>
      )}

      {/* CONFIRM END SESSION MODAL */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 fade-in">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">End Session?</h2>
            <p className="text-slate-600 mb-8">
              Are you sure you want to end this training session? You will be returned to the dashboard and your final grade will be calculated.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="btn btn-secondary px-6"
              >
                Cancel 
              </button>
              <button
                onClick={handleEndSession}
                className="btn btn-primary bg-red-600 border-red-700 hover:bg-red-700 px-6"
              >
                Confirm End
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="training-header flex justify-between items-start">
        <div>
          <button onClick={() => navigate(-1)} className="back-btn flex items-center gap-1 mb-3 text-slate-500 hover:text-slate-800">
            <HiOutlineChevronLeft /> Back
          </button>

          <h1 className="training-title mb-2">
            Advanced Instrument Approaches
          </h1>

          <div className="training-meta mt-2 mb-2">
            <span>SESSION ID: SESS-001</span>
            <span className="highlight">FLIGHT SESSION</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate("/lesson-plan")}>Lesson Plan</button>
          <button className="btn btn-primary" onClick={() => setShowEndConfirm(true)}>End Session</button>

          <div className="final-grade-box text-center">
            <h3>Final Grade</h3>
            <p className="text-2xl font-bold">{finalGrade}%</p>
            <p className="text-sm text-slate-500">
              {getGradeLabel(finalGrade)}
            </p>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle flex items-center gap-2"
        >
          <HiOutlineBars3 size={24} /> <span className="text-lg font-medium">Exercises</span>
        </button>

        <button className="btn btn-primary" onClick={() => {}}>
          Generate Debrief Summary
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 mt-4">
        {sidebarOpen && (
          <div className="lg:col-span-3 sidebar">
            {exercises.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => handleExerciseChange(i)}
                className={`exercise-item ${i === activeExercise ? "active" : ""
                  }`}
              >
                {i + 1}. {ex.name}
              </button>
            ))}
          </div>
        )}

        <div
          className={`${sidebarOpen ? "lg:col-span-9" : "lg:col-span-12"
            } main-card`}
        >
          <h2 className="exercise-title">
            {activeExercise + 1}. {current.name}
          </h2>

          {/* SCORE */}
          <div className="score-section">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() =>
                  setScore(current.score === s ? 0 : s)
                }
                className={`score-btn ${current.score === s ? scoreColors[s] : ""
                  }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* CANVAS */}
          <div className="canvas-container">
            {loading ? (
              <div className="flex justify-center items-center min-h-[60vh] text-slate-500">
                Loading...
              </div>
            ) : (
              <CanvasBoard
                key={current.id}
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
              setShowEndConfirm(true);
            } else {
              handleExerciseChange(activeExercise + 1);
            }
          }}
          className="btn btn-primary"
        >
          {activeExercise === exercises.length - 1
            ? "End Session"
            : "Next"}
        </button>
      </div>
    </div>
  );
};

export default TrainingData;