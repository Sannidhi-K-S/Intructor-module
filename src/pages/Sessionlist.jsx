import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import {
  HiOutlinePlay,
  HiOutlineClipboardList,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

const SessionList = () => {
  const navigate = useNavigate();
  const { sessions, activeSession, setActiveSession, loadDashboard } = useAppStore();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (sessions.length === 0) {
      loadDashboard();
    }
  }, []);

  const handleAction = (session) => {
    setActiveSession(session);

    if (session.status === "ongoing") {
      // ONLY live sessions go directly to the TrainingData grading panel
      navigate("/training");
    } else if (session.status === "completed") {
      // Navigate to the specific training log for this session
      navigate(`/logbook/${session.id}`);
    } else if (session.status === "action_required") {
      // Action required — view this session's training log
      navigate(`/logbook/${session.id}`);
    } else {
      // Upcoming and all other sessions stay on Dashboard and reveal Prep details
      const el = document.getElementById("session-prep-area");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "ongoing") return s.status === "ongoing";
    if (filter === "completed") return s.status === "completed";
    if (filter === "action_required") return s.status === "action_required";
    if (filter === "pending") return s.status === "pending";
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 gap-4">
        <h2 className="font-bold text-gray-800 text-xl">Today's Schedule</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Sessions</option>
            <option value="ongoing">Ongoing Only</option>
            <option value="completed">Completed Only</option>
            <option value="action_required">Action Required</option>
            <option value="pending">Pending Only</option>
          </select>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {filteredSessions.length} sessions
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[950px]">
          {/* Header Row */}
          <div className="grid grid-cols-[160px_120px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_110px] gap-4 px-6 py-3 bg-slate-50 text-[14px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-100 font-outfit">
            <span>Time</span>
            <span>Mode</span>
            <span>Lesson</span>
            <span>Trainee</span>
            <span>Resource</span>
            <span>Status</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => {
                const isActive = activeSession?.id === session.id;
                const isCompleted = session.status === "completed";
                const isOngoing = session.status === "ongoing";
                const needsAction = session.status === "action_required";

                return (
                  <button
                    key={session.id}
                    onClick={() => handleAction(session)}
                    className={`grid grid-cols-[160px_120px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_110px] gap-4 w-full text-left px-6 py-5 items-center transition ${isActive
                      ? "bg-blue-50/50 border-l-2 border-blue-600 shadow-[inset_0_0_20px_rgba(6,81,237,0.03)]"
                      : "hover:bg-blue-50/40 bg-white"
                      }`}
                  >
                    <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      {session.startTime}-{session.endTime}
                    </span>

                    <div className="flex items-center">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase border ${session.type === "Ground School"
                          ? "bg-blue-50 text-blue-700 border-transparent"
                          : session.type === "Simulator"
                            ? "bg-purple-50 text-purple-700 border-transparent"
                            : "bg-blue-50 text-blue-700 border-transparent"
                          }`}
                      >
                        {session.type}
                      </span>
                    </div>

                    <span className="text-[14px] font-bold text-slate-900 break-words leading-tight group-hover:text-blue-700 transition-colors">
                      {session.topic}
                    </span>

                    <span className="text-[14px] text-slate-600 font-medium break-words leading-tight">
                      {session.trainee}
                    </span>

                    <span className="text-[14px] text-slate-600 font-medium break-words leading-tight">
                      {session.resourceUsed}
                    </span>

                    <div className="flex justify-start items-center">
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded uppercase border ${isOngoing
                          ? "bg-blue-600 text-white"
                          : needsAction
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : isCompleted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                      >
                        {isOngoing ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live
                          </>
                        ) : needsAction ? (
                          <>
                            <HiOutlineExclamationCircle />
                            Review
                          </>
                        ) : (
                          session.status.replace("_", " ")
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-gray-400">
                No sessions found for this filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionList;