import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Clock,
  GraduationCap,
  CheckCircle2,
  FileText,
  Zap,
  StickyNote,
  ClipboardList,
  Target,
  Award,
  Plane
} from "lucide-react";
import useAppStore from "../store/useAppStore";

const SessionPreparationPanel = ({ mode }) => {
  console.log("Rendering SessionPreparationPanel", useAppStore.getState().activeSession);
  const { activeSession } = useAppStore();
  const navigate = useNavigate();

  // 🧠 Check if it's too early to start (Disable button if now < startTime)
  const isTooEarly = React.useMemo(() => {
    if (!activeSession?.startTime || typeof activeSession.startTime !== 'string' || !activeSession.startTime.includes(" ")) return false;
    
    try {
      const now = new Date();
      const [time, modifier] = activeSession.startTime.split(" ");
      let [hours, minutes] = time.split(":");
      
      if (hours === "12") hours = "00";
      if (modifier === "PM") hours = (parseInt(hours, 10) % 12) + 12;
      
      const sessionStartTime = new Date();
      sessionStartTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      return now < sessionStartTime;
    } catch (e) {
      console.error("Time parsing error:", e);
      return false;
    }
  }, [activeSession]);

  if (!activeSession) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
        <p className="text-gray-400 font-medium whitespace-nowrap">
          Select a session to view preparation details
        </p>
      </div>
    );
  }

  const { lessonPlan } = activeSession;
  const isViewOnly = mode === "view-only";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Lesson Topic
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {lessonPlan?.topic || activeSession.topic}
            </h1>
          </div>
        </div>

        {!isViewOnly && (
          <div className="flex items-center gap-3">
            {activeSession.status === 'ongoing' && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
            <button
              onClick={() => navigate("/training")}
              disabled={isTooEarly}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition shadow-md ${
                isTooEarly
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95"
              }`}
            >
              <Zap size={18} fill={isTooEarly ? "none" : "currentColor"} className={isTooEarly ? "text-gray-300" : ""} />
              {activeSession.status === 'ongoing' ? 'Continue Training' : 'Start Training'}
            </button>
          </div>
        )}
      </div>

      {/* SESSION META */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8 py-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <User size={18} className="text-blue-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Trainee</p>
            <p className="font-bold text-gray-800 text-sm">{activeSession.trainee}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap size={18} className="text-indigo-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Mode</p>
            <p className="font-bold text-gray-800 text-sm">{activeSession.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Plane size={18} className="text-emerald-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Resource</p>
            <p className="font-bold text-gray-800 text-sm">{activeSession.resourceUsed}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-amber-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Schedule</p>
            <p className="font-bold text-gray-800 text-sm">{activeSession.startTime} - {activeSession.endTime}</p>
          </div>
        </div>
      </div>

      {/* CONTENT WORKSPACE */}
      <div className="grid grid-cols-12 gap-8 p-8 bg-white min-h-[400px]">
        {/* LEFT COLUMN: GUIDELINES */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              <Target size={16} className="text-blue-600" /> Objectives
            </h3>
            <ul className="space-y-3">
              {(lessonPlan?.objectives || []).map((obj, i) => (
                <li key={i} className="text-sm text-gray-600 font-medium pl-2 border-l-2 border-gray-200 italic">
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              <StickyNote size={16} className="text-amber-500" /> Instructor Notes
            </h3>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-gray-700 font-medium leading-relaxed italic">
              {lessonPlan?.instructorNotes || "No specific briefing notes provided."}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              <Award size={16} className="text-emerald-600" /> Expected Outcome
            </h3>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm font-bold text-emerald-900 italic">
              {lessonPlan?.expectedOutcome || "Demonstration of standard proficiency."}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXERCISE LIST */}
        <div className="col-span-12 lg:col-span-8">
          <h2 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-6">
            <ClipboardList size={20} className="text-blue-600" /> Curriculum Exercises
          </h2>

          <div className="space-y-3">
            {(lessonPlan?.exercises || []).map((ex, i) => (
              <div
                key={ex.id || i}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-900 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                      {ex.name}
                    </p>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">
                      Evaluation Task • {ex.type || "Performance"}
                    </p>
                  </div>
                </div>

                {ex.completed ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Finished
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-100/50 text-blue-600 text-[10px] font-black uppercase rounded-lg">
                    Not Started
                  </span>
                )}
              </div>
            ))}
            {(!lessonPlan?.exercises || lessonPlan.exercises.length === 0) && (
               <p className="text-center p-8 text-gray-400 italic">No exercises listed for this sequence.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPreparationPanel;