import React, { useEffect } from "react";
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
    <div className="max-w-[1400px] mx-auto px-6 py-1 space-y-6 min-h-screen bg-gray-50/50">

      {/* 🔥 DASHBOARD HEADER & STATS */}
      <div className="space-y-1">

        <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-5 overflow-x-auto pb-2 scrollbar-none">
          {/* Sessions Today */}
          <div className="min-w-[85px] bg-white p-2 md:p-3 lg:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition-all duration-300 flex flex-col justify-center relative group cursor-default">
            <div className="flex items-center justify-between mb-0.5 md:mb-1.5">
              <span className="text-[8px] md:text-[10px] lg:text-[11px] font-bold text-blue-600 uppercase tracking-tighter md:tracking-wider">Sessions</span>
              <div className="hidden xs:block p-1 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-[16px] lg:h-[16px] text-blue-600" />
              </div>
            </div>
            <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">{sessions.length}</span>
          </div>

          {/* Live Sessions */}
          <div className="min-w-[85px] bg-white p-2 md:p-3 lg:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-red-200 transition-all duration-300 flex flex-col justify-center relative group cursor-default">
            <div className="flex items-center justify-between mb-0.5 md:mb-1.5">
              <span className="text-[8px] md:text-[10px] lg:text-[11px] font-bold text-red-500 uppercase tracking-tighter md:tracking-wider flex items-center gap-0.5">
                Live
                {pendingCounts.live > 0 && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />}
              </span>
              <div className="hidden xs:block p-1 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <Activity className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-[16px] lg:h-[16px] text-red-500" />
              </div>
            </div>
            <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              {pendingCounts.live}
            </span>
          </div>

          {/* Pending Sessions */}
          <div className="min-w-[85px] bg-white p-2 md:p-3 lg:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-amber-200 transition-all duration-300 flex flex-col justify-center relative group cursor-default">
            <div className="flex items-center justify-between mb-0.5 md:mb-1.5">
              <span className="text-[8px] md:text-[10px] lg:text-[11px] font-bold text-amber-500 uppercase tracking-tighter md:tracking-wider">Pending</span>
              <div className="hidden xs:block p-1 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-[16px] lg:h-[16px] text-amber-500" />
              </div>
            </div>
            <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              {pendingCounts.pending}
            </span>
          </div>

          {/* Completed Sessions */}
          <div className="min-w-[85px] bg-white p-2 md:p-3 lg:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-200 transition-all duration-300 flex flex-col justify-center relative group cursor-default">
            <div className="flex items-center justify-between mb-0.5 md:mb-1.5">
              <span className="text-[8px] md:text-[10px] lg:text-[11px] font-bold text-emerald-500 uppercase tracking-tighter md:tracking-wider font-outfit">Done</span>
              <div className="hidden xs:block p-1 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-[16px] lg:h-[16px] text-emerald-500" />
              </div>
            </div>
            <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              {sessions.filter(s => s.status === "completed").length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING SESSIONS (Next Seq) - Styled exactly like Today's List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            Upcoming Session
          </h2>
        </div>

        <div className="overflow-x-auto w-full">
          <div className="min-w-[1000px]">
            {/* Column Titles matched to SessionList */}
            <div className="grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 px-6 py-3 bg-blue-50 border-b border-gray-200 text-sm font-bold uppercase tracking-wide text-gray-700 font-outfit">
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
                    console.log("Activating next session:", nextSession);
                    setActiveSession(nextSession);
                    scrollToPrep();
                  }}
                  // Item style matched to SessionList active or row item
                  className="grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 w-full text-left px-6 py-5 hover:bg-gray-50 transition border-l-2 border-blue-600 bg-blue-50/30 group"
                >
                  <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                    {nextSession.startTime}–{nextSession.endTime}
                  </span>

                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-md w-fit ${modeColor(nextSession.type)} shadow-sm`}>
                    {nextSession.type}
                  </span>

                  <span className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                    {(nextSession.topic || "").replace(/\s*\(\d+m\)$/, "")}
                  </span>

                  <span className="text-sm text-gray-700 font-medium truncate">
                    {nextSession.trainee}
                  </span>

                  <span className="text-sm text-gray-700 font-medium truncate">
                    {nextSession.resourceUsed}
                  </span>

                  <div className="flex justify-end pr-2 items-center">
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                      <Clock size={10} className="text-blue-700" />
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Pending</span>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="p-10 text-center text-gray-400 font-medium flex flex-col items-center gap-2">
                  <Clock size={24} className="text-gray-200" />
                  No upcoming sessions
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