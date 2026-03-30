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
    const isCompleted = session.status === "completed";
    const isOngoing = session.status === "ongoing";
    const needsAction = isCompleted && !session.debriefSummary;

    // Improved robust check for training types
    const typeLower = (session.type || "").toLowerCase();
    const isTrainingType = typeLower.includes("flight") || typeLower.includes("simulator");

    setActiveSession(session);

    if (isOngoing || (isTrainingType && !isCompleted)) {
      navigate("/training");
    } else if (isCompleted || needsAction) {
      navigate("/logbook");
    } else {
      // For upcoming / ground sessions
      const el = document.getElementById("prep-details");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "ongoing") return s.status === "ongoing";
    if (filter === "completed") return s.status === "completed";
    if (filter === "pending") return s.status === "pending" || s.status === "upcoming";
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-bold text-gray-800">Today's Schedule</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Sessions</option>
            <option value="ongoing">Ongoing Only</option>
            <option value="completed">Completed Only</option>
            <option value="pending">Upcoming Only</option>
          </select>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {filteredSessions.length} sessions
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 px-6 py-3 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
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
                const needsAction = isCompleted && !session.debriefSummary;

                return (
                  <button
                    key={session.id}
                    onClick={() => handleAction(session)}
                    className={`grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 w-full text-left px-6 py-5 transition ${isActive
                      ? "bg-blue-50/50 border-l-2 border-blue-700/50 shadow-sm"
                      : "hover:bg-gray-50"
                      }`}
                  >
                    <span className="text-sm text-gray-700 whitespace-nowrap">
                      {session.startTime}-{session.endTime}
                    </span>

                    <div className="flex items-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${session.type === "Ground School"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : session.type === "Simulator"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}
                      >
                        {session.type}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-blue-700 truncate">
                      {session.topic}
                    </span>

                    <span className="text-sm text-gray-600 truncate">
                      {session.trainee}
                    </span>

                    <span className="text-sm text-gray-500 truncate">
                      {session.resourceUsed}
                    </span>

                    <div className="flex items-center">
                      <div
                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isOngoing
                          ? "bg-blue-600 text-white"
                          : needsAction
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : isCompleted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
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
                          session.status
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