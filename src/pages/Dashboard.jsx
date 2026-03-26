import React, { useEffect } from "react";
import useAppStore from "../store/useAppStore";
import SessionList from "./Sessionlist";
import SessionPreparationPanel from "./SessionPreparation";
import { Plane, AlertCircle, Clock, FileText, User } from "lucide-react";

/**
 * Instructor Dashboard
 * - Highlights the single Next Sequence session
 * - Lists today's full schedule
 * - Provides quick navigation to live evaluation, logbooks, and prep panels.
 */
const Dashboard = () => {
  const { user, sessions, loadDashboard, setActiveSession } = useAppStore();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Extract and sort upcoming sessions for the "Upcoming Sessions" hero block
  const sortedUpcoming = sessions
    .filter((s) => s.status === "upcoming")
    .sort((a, b) => {
      const parseTime = (t) => {
        const [time, modifier] = t.split(" ");
        let [hours, minutes] = time.split(":");
        if (hours === "12") hours = "00";
        if (modifier === "PM") hours = parseInt(hours, 10) + 12;
        return parseInt(hours) * 60 + parseInt(minutes);
      };
      return parseTime(a.startTime) - parseTime(b.startTime);
    });

  const nextSession = sortedUpcoming[0];

  const pendingCounts = sessions.reduce((acc, s) => {
    if (s.status === "ongoing") acc.live++;
    if (s.status === "completed" && !s.debriefSummary) acc.pending++;
    return acc;
  }, { live: 0, pending: 0 });

  const scrollToPrep = () => {
    setTimeout(() => {
      document
        .getElementById("session-prep-area")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const modeColor = (type) => {
    if (type === "Simulator") return "bg-purple-50 text-purple-700";
    if (type === "Class") return "bg-amber-50 text-amber-700";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 min-h-screen bg-slate-50">

      {/* 1. INSTRUCTOR PROFILE HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 text-xl font-bold border border-slate-200 shadow-sm">
            {user?.name?.split(' ').map(n => n[0]).join('') || "IN"}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {user?.name || "Instructor"}
            </h1>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              {user?.role || "Senior Flight Instructor"} • Flight Standards Unit
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 bg-red-50/50 border border-red-100 rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-700">{pendingCounts.live} Live Now</span>
          </div>
          <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 rounded-lg px-4 py-2">
            <AlertCircle size={18} className="text-amber-600" />
            <span className="text-sm font-bold text-slate-700">{pendingCounts.pending} Action Required</span>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING SESSIONS (Next Seq) - Styled exactly like Today's List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Upcoming Sessions
          </h2>
        </div>

        {/* Column Titles matched to SessionList */}
        <div className="grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <span>Time</span>
          <span>Mode</span>
          <span>Lesson</span>
          <span>Trainee</span>
          <span>Resource</span>
          <span>Status</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {nextSession ? (
            <button 
              onClick={() => {
                console.log("Activating next session:", nextSession);
                setActiveSession(nextSession);
                scrollToPrep();
              }}
              // Item style matched to SessionList active or row item
              className="grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 w-full text-left px-6 py-5 hover:bg-slate-50 transition border-l-2 border-blue-500 bg-blue-50/10 group"
            >
              <span className="text-sm text-slate-700 font-medium whitespace-nowrap">
                {nextSession.startTime}–{nextSession.endTime}
              </span>

              <span className={`text-sm font-semibold px-3 py-1.5 rounded-md w-fit ${modeColor(nextSession.type)} shadow-sm`}>
                {nextSession.type}
              </span>

              <span className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {(nextSession.topic || "").replace(/\s*\(\d+m\)$/, "")}
              </span>

              <span className="text-sm text-slate-700 font-medium truncate">
                {nextSession.trainee}
              </span>

              <span className="text-sm text-slate-700 font-medium truncate">
                {nextSession.resourceUsed}
              </span>

              <div className="flex justify-end pr-2 items-center">
                <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                  <Clock size={10} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Pending</span>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-10 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
              <Clock size={24} className="text-slate-200" />
              There are no more upcoming sessions for today
            </div>
          )}
        </div>
      </div>

      {/* 3. TODAY'S DAILY SCHEDULE & INTERACTIVE WORKSPACE */}
      <div className="space-y-8">
        {/* Full list of all sessions today */}
        <SessionList onSessionSelect={scrollToPrep} />
        
        {/* Preparation Workspace (Active session detail loader) */}
        <div id="session-prep-area" className="scroll-m-8">
          <SessionPreparationPanel />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;