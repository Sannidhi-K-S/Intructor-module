import React from "react";
import useAppStore from "../store/useAppStore";
import { CheckCircle2, AlertCircle, PlayCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SessionList = ({ onSessionSelect }) => {
  const { sessions, activeSession, setActiveSession } = useAppStore();
  const navigate = useNavigate();

  // Sort by time
  const sortedSessions = [...sessions].sort((a, b) => {
    const parseTime = (t) => {
      const [time, modifier] = t.split(" ");
      let [hours, minutes] = time.split(":");
      if (hours === "12") hours = "00";
      if (modifier === "PM") hours = parseInt(hours, 10) + 12;
      return parseInt(hours) * 60 + parseInt(minutes);
    };
    return parseTime(a.startTime) - parseTime(b.startTime);
  });

  const getStatusDisplay = (session) => {
    const isCompleted = session.status === "completed";
    const isOngoing = session.status === "ongoing";
    const isUpcoming = session.status === "upcoming";
    const needsAction = isCompleted && !session.debriefSummary;

    if (needsAction) {
      return (
        <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-full border border-amber-100" title="Action Required">
          <AlertCircle size={10} className="text-amber-600" />
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Action Required</span>
        </div>
      );
    }
    if (isCompleted) {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100" title="Completed">
          <CheckCircle2 size={10} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Completed</span>
        </div>
      );
    }
    if (isOngoing) {
      return (
        <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full border border-red-100" title="Live">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight">Live</span>
        </div>
      );
    }
    if (isUpcoming) {
      return (
        <div className="flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded-full border border-blue-100" title="Pending">
          <Clock size={10} className="text-blue-700/80" />
          <span className="text-[10px] font-bold text-blue-700/80 uppercase tracking-tight">Pending</span>
        </div>
      );
    }
    return null;
  };

  const handleAction = (session) => {
    const isCompleted = session.status === "completed";
    const isOngoing = session.status === "ongoing";
    const needsAction = isCompleted && !session.debriefSummary;

    setActiveSession(session);

    if (isOngoing) {
      // Live session → go to training data grading
      navigate("/training");
    } else if (isCompleted || needsAction) {
      // Completed / Action Required → go to logbook
      navigate(`/logbook/${session.id}`);
    } else {
      // Pending / Upcoming → open prep panel
      onSessionSelect?.();
    }
  };

  const modeColor = (type) => {
    if (type === "Simulator") return "bg-purple-50 text-purple-700";
    if (type === "Class") return "bg-amber-50 text-amber-700";
    return "bg-blue-50/50 text-blue-700/80";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">
          Today's Schedule
        </h2>
        <span className="text-sm text-gray-500">
          {sortedSessions.length} sessions
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px]">
          {/* Column Titles Updated for larger status labels */}
          <div className="grid grid-cols-[170px_150px_2.5fr_1.5fr_1.5fr_120px] gap-4 px-6 py-3 bg-blue-50/50 border-b border-gray-200 text-sm font-bold uppercase tracking-wide text-gray-700 font-outfit">
            <span>Time</span>
            <span>Mode</span>
            <span>Lesson</span>
            <span>Trainee</span>
            <span>Resource</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedSessions.length === 0 && (
              <div className="p-6 text-center text-gray-400">
                No sessions available for today
              </div>
            )}

            {sortedSessions.map((session) => {
              const isActive = activeSession?.id === session.id;

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
                    {session.startTime}–{session.endTime}
                  </span>

                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-md w-fit ${modeColor(session.type)}`}>
                    {session.type}
                  </span>

                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {(session.topic || "").replace(/\s*\(\d+m\)$/, "")}
                  </span>

                  <span className="text-sm text-gray-700 truncate">
                    {session.trainee}
                  </span>

                  <span className="text-sm text-gray-700 truncate">
                    {session.resourceUsed}
                  </span>

                  <div className="flex justify-end pr-2 items-center h-full">
                    {getStatusDisplay(session)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionList;