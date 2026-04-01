import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import SessionList from "./Sessionlist";
import SessionPreparationPanel from "./SessionPreparation";
import { Plane, AlertCircle, Clock, FileText, User, Calendar, Activity, CheckCircle } from "lucide-react";
import ErrorBoundary from "../ErrorBoundary";

/**
 * Instructor Dashboard
 * - Highlights the single Next Sequence session
 * - Lists today's full schedule
 * - Provides quick navigation to live evaluation, logbooks, and prep panels.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, sessions, loadDashboard, setActiveSession } = useAppStore();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Extract and sort upcoming sessions for the "Upcoming Sessions" hero block
  const sortedUpcoming = sessions
    .filter((s) => s.status === "pending")
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
    if (s.status === "action_required") acc.actionRequired++;
    if (s.status === "pending") acc.upcoming++;
    return acc;
  }, { live: 0, actionRequired: 0, upcoming: 0 });

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
    <div className="max-w-[1400px] mx-auto px-6 py-1 space-y-6 min-h-screen bg-gray-50/50">

      {/* 🔥 DASHBOARD HEADER & STATS */}
      <div className="space-y-1">

        {/* SMALL, PERFECTLY ALIGNED INDIVIDUAL SAAS METRIC CARDS */}
        <div className="flex flex-wrap lg:flex-nowrap gap-3 md:gap-4 w-full justify-between items-center mb-6">

          {/* Total Sessions Card */}
          <div className="flex-1 w-full min-w-[140px] bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest font-outfit mb-0.5">Total</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{sessions.length}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
          </div>

          {/* Upcoming Sessions Card */}
          <div className="flex-1 w-full min-w-[140px] bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest font-outfit mb-0.5">Pending</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{pendingCounts.upcoming}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
          </div>

          {/* Live Sessions Card */}
          <div className="flex-1 w-full min-w-[140px] bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest font-outfit flex items-center gap-1.5 mb-0.5">
                Live
                {pendingCounts.live > 0 && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                )}
              </span>
              <span className={`text-2xl font-extrabold tracking-tight ${pendingCounts.live > 0 ? "text-red-600" : "text-slate-900"}`}>
                {pendingCounts.live}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
            </div>
          </div>

          {/* Action Required Card */}
          <div className="flex-1 w-full min-w-[140px] bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest font-outfit mb-0.5 whitespace-nowrap">Action</span>
              <span className={`text-2xl font-extrabold tracking-tight ${pendingCounts.actionRequired > 0 ? "text-amber-600" : "text-slate-900"}`}>
                {pendingCounts.actionRequired}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
            </div>
          </div>

          {/* Completed Sessions Card */}
          <div className="flex-1 w-full min-w-[140px] bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest font-outfit mb-0.5">Done</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {sessions.filter(s => s.status === "completed").length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            </div>
          </div>

        </div>
      </div>

      {/* 2. UPCOMING SESSIONS (Next Seq) - Styled exactly like Today's List */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            Upcoming Session
          </h2>
        </div>

        <div className="overflow-x-auto w-full">
          <div className="min-w-[950px]">
            {/* Column Titles matched to SessionList - ALWAYS VISIBLE ALIGNMENT */}
            <div className="grid grid-cols-[160px_120px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_110px] gap-4 px-6 py-3 bg-slate-50 border-b border-gray-100 text-[14px] font-bold uppercase tracking-wider text-slate-500 font-outfit">
              <span>Time</span>
              <span>Mode</span>
              <span>Lesson</span>
              <span>Trainee</span>
              <span>Resource</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-gray-100">
              {nextSession ? (
                <button
                  onClick={() => {
                    setActiveSession(nextSession);
                    // Upcoming sessions ALWAYS show the preparation panel
                    const el = document.getElementById("session-prep-area");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="grid grid-cols-[160px_120px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_110px] gap-4 w-full text-left px-6 py-5 hover:bg-blue-50/40 transition border-l-2 border-blue-600 bg-white group items-center"
                >
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    {nextSession.startTime}–{nextSession.endTime}
                  </span>

                  <div className="flex items-center">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase border ${modeColor(nextSession.type)}`}>
                      {nextSession.type}
                    </span>
                  </div>

                  <span className="text-[14px] font-bold text-slate-900 break-words leading-tight group-hover:text-blue-700 transition-colors">
                    {(nextSession.topic || "").replace(/\s*\(\d+m\)$/, "")}
                  </span>

                  <span className="text-[14px] text-slate-600 font-medium break-words leading-tight">
                    {nextSession.trainee}
                  </span>

                  <span className="text-[14px] text-slate-600 font-medium break-words leading-tight">
                    {nextSession.resourceUsed}
                  </span>

                  <div className="flex justify-start items-center">
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded border border-blue-100/50">
                      <Clock size={12} className="text-blue-700" />
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">Pending</span>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="px-6 py-10 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                  <Clock size={22} className="text-slate-300" />
                  <span className="text-[14px] font-medium text-slate-500">No upcoming sessions right now</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S DAILY SCHEDULE & INTERACTIVE WORKSPACE */}
      <div className="space-y-8">
        {/* Full list of all sessions today */}
        <SessionList onSessionSelect={scrollToPrep} />

        {/* Preparation Workspace (Active session detail loader) */}
        <div id="session-prep-area" className="scroll-m-8">
          <ErrorBoundary>
            <SessionPreparationPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;