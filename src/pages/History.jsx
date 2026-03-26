import React, { useState, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { jsPDF } from 'jspdf';
import {
    HiOutlineDocumentText,
    HiOutlineArrowDownTray,
    HiOutlineCheckCircle,
    HiOutlineXMark,
    HiOutlineStar,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineIdentification,
    HiOutlineMapPin,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineCalendar,
    HiOutlineListBullet,
    HiOutlineFunnel,
    HiOutlineMagnifyingGlass
} from 'react-icons/hi2';

const DebriefSummary = ({ session, onClose }) => {
    const exercises = session.lessonPlan?.exercises || [];
    const averageScore = exercises.length > 0
        ? exercises.reduce((acc, ex) => acc + (ex.score || 0), 0) / exercises.length
        : 0;

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Operational Training Report", 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${session.date ? new Date(session.date).toLocaleDateString() : 'Unknown Date'}`, 20, 30);

        doc.setDrawColor(200);
        doc.line(20, 35, 190, 35);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Mission Overview", 20, 45);
        doc.setFontSize(11);
        doc.text(`Trainee: ${session.trainee}`, 20, 55);
        doc.text(`Topic: ${session.topic}`, 20, 62);
        doc.text(`Mission Type: ${session.type}`, 20, 69);
        doc.text(`Resource: ${session.resourceUsed}`, 20, 76);
        doc.text(`Outcome: ${session.sessionOutcome?.toUpperCase() || 'COMPLETED'}`, 20, 83);
        doc.text(`Average Score: ${averageScore.toFixed(1)}/5.0`, 20, 90);

        doc.setFontSize(14);
        doc.text("Detailed Exercise Grading", 20, 105);

        let y = 115;
        exercises.forEach((ex, i) => {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.text(`${i + 1}. ${ex.name} (${ex.type})`, 25, y);
            doc.text(`Score: ${ex.score}/5`, 160, y);
            y += 8;
            if (ex.notes) {
                doc.setFontSize(9);
                doc.setTextColor(80);
                const splitNotes = doc.splitTextToSize(ex.notes.replace(/<[^>]*>/g, ''), 150);
                doc.text(splitNotes, 30, y);
                y += (splitNotes.length * 6) + 4;
            }
            doc.setTextColor(0);
            y += 4;
        });

        if (session.debriefSummary) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.text("Instructor Debrief Summary", 20, y);
            y += 10;
            doc.setFontSize(10);
            const summary = doc.splitTextToSize(session.debriefSummary.replace(/<[^>]*>/g, ''), 170);
            doc.text(summary, 20, y);
        }

        doc.save(`Mission_Report_${session.trainee.replace(' ', '_')}_${session.id}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm">
            <div className="glass-card w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-white">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
                            <HiOutlineIdentification className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">Training Report</h2>
                            <p className="text-[12px] text-slate-500 font-medium">{session.trainee}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                            <p className="text-xl font-bold text-slate-900">{averageScore.toFixed(1)}<span className="text-slate-300">/5.0</span></p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Type</p>
                            <p className="text-[13px] font-bold text-slate-900">{session.type}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resource</p>
                            <p className="text-[13px] font-bold text-slate-900 truncate" title={session.resourceUsed}>{session.resourceUsed || 'N/A'}</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${session.sessionOutcome === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${session.sessionOutcome === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>Outcome</p>
                            <p className={`text-[13px] font-bold uppercase ${session.sessionOutcome === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>{session.sessionOutcome || 'Completed'}</p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
                                <HiOutlineChatBubbleBottomCenterText className="w-4 h-4" /> Instructor Debrief Summary
                            </h3>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div
                                    className="text-[14px] text-slate-700 prose prose-slate max-w-none prose-p:leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: session.debriefSummary || '<p className="italic text-slate-400">No summary provided for this mission.</p>' }}
                                />
                                {session.additionalRemarks && (
                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-2">Operational Remarks</h4>
                                        <p className="text-[13px] text-slate-600 italic">"{session.additionalRemarks}"</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6">Exercise Evaluation Data</h3>
                            <div className="space-y-4">
                                {exercises.map((ex, i) => (
                                    <div key={ex.id || i} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">EX {i + 1}</span>
                                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{ex.type}</span>
                                                </div>
                                                <h4 className="text-[15px] font-bold text-slate-900 leading-tight">{ex.name}</h4>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, j) => (
                                                    <HiOutlineStar key={j} className={`w-4 h-4 ${j < ex.score ? 'text-slate-900 fill-slate-900' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {ex.notes && (
                                            <div
                                                className="text-[13px] text-slate-500 prose prose-slate max-w-none prose-p:leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100"
                                                dangerouslySetInnerHTML={{ __html: ex.notes }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">Close Report</button>
                    <button onClick={downloadPDF} className="px-6 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold text-sm shadow-sm hover:bg-slate-800 transition">
                        <HiOutlineArrowDownTray className="w-4 h-4" /> Download Records (PDF)
                    </button>
                </div>
            </div>
        </div>
    );
};

const History = () => {
    const { historySessions, loadHistory } = useAppStore();
    const [selectedSession, setSelectedSession] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [typeFilter, setTypeFilter] = useState('All');
    const [timeFilter, setTimeFilter] = useState('Last 1 Month');
    const [searchQuery, setSearchQuery] = useState('');

    const [currentDate, setCurrentDate] = useState(new Date());
    const [noDataPopup, setNoDataPopup] = useState(false);
    const [daySessionsPopup, setDaySessionsPopup] = useState(null);
    const [popupDateStr, setPopupDateStr] = useState("");

    // Tooltip state
    const [hoveredDay, setHoveredDay] = useState(null);

    React.useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    const handleDateClick = (daySessions, dateStr) => {
        setPopupDateStr(dateStr);
        if (daySessions.length === 0) {
            setNoDataPopup(true);
        } else {
            setDaySessionsPopup(daySessions);
        }
    };

    const types = ['All', 'Flight', 'Simulator', 'Class'];
    const times = ['All Time', 'Last 3 Days', 'Last 1 Week', 'Last 1 Month'];

    const filteredSessions = useMemo(() => {
        const now = new Date();
        return (historySessions || []).filter(session => {
            // Search Query Filter (Trainee or Topic)
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchTrainee = session.trainee?.toLowerCase().includes(searchLower);
                const matchTopic = session.topic?.toLowerCase().includes(searchLower);
                if (!matchTrainee && !matchTopic) return false;
            }

            // Type Filter
            if (typeFilter !== 'All' && !session.type?.includes(typeFilter)) return false;

            // Time Filter
            if (timeFilter !== 'All Time' && session.date) {
                const sessionDate = new Date(session.date);
                const diffDays = (now - sessionDate) / (1000 * 60 * 60 * 24);
                if (timeFilter === 'Last 3 Days' && diffDays > 3) return false;
                if (timeFilter === 'Last 1 Week' && diffDays > 7) return false;
                if (timeFilter === 'Last 1 Month' && diffDays > 30) return false;
            }
            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [historySessions, typeFilter, timeFilter, searchQuery]);

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const years = [];
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 1; i++) {
            years.push(i);
        }

        let days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 border border-slate-100 bg-slate-50/10"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = dateObj.toLocaleDateString();
            const daySessions = filteredSessions.filter(s => s.date && new Date(s.date).toLocaleDateString() === dateStr);

            days.push(
                <div
                    key={d}
                    onClick={() => handleDateClick(daySessions, dateStr)}
                    onMouseEnter={() => setHoveredDay({ d, sessions: daySessions })}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="p-2 border border-slate-200 min-h-[110px] bg-white transition-all hover:bg-slate-50 group flex flex-col cursor-pointer relative"
                >
                    <span className="text-[12px] font-bold text-slate-400 group-hover:text-slate-900 mb-2">{d}</span>

                    {/* Tooltip implementation */}
                    {hoveredDay?.d === d && daySessions.length > 0 && (
                        <div className="absolute top-10 left-10 z-[50] w-64 bg-slate-900 text-white rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-none">
                            <p className="text-[10px] uppercase font-black tracking-widest text-blue-400 mb-3 border-b border-slate-800 pb-2">{dateStr}</p>
                            <div className="space-y-3">
                                {daySessions.map(s => (
                                    <div key={s.id} className="border-l-2 border-slate-700 pl-3">
                                        <p className="text-[11px] font-bold leading-tight mb-1 truncate">{s.topic}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">Trainee: {s.trainee}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-hidden">
                        {daySessions.map(s => (
                            <div
                                key={s.id}
                                className={`w-3 h-3 rounded-full border border-white shadow-sm ${s.type?.includes('Flight') ? 'bg-blue-400' :
                                    s.type?.includes('Simulator') ? 'bg-purple-400' :
                                        'bg-amber-400'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="glass-card p-6 border border-slate-200 animate-in fade-in duration-300">
                <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <select
                                value={month}
                                onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                                className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-lg px-3 py-1.5 outline-none hover:border-slate-300"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                                className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-lg px-3 py-1.5 outline-none hover:border-slate-300"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                            <button onClick={prevMonth} className="px-3 py-1 text-slate-500 hover:text-slate-900 font-black">&larr;</button>
                            <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 text-slate-500 hover:text-slate-900">Today</button>
                            <button onClick={nextMonth} className="px-3 py-1 text-slate-500 hover:text-slate-900 font-black">&rarr;</button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-slate-100 p-3 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            {day}
                        </div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* SEARCH & FILTERS HEADER */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <HiOutlineCalendar className="text-blue-600" /> Session History
                    </h1>

                    <div className="flex items-center p-1 bg-slate-100/50 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center justify-center w-10 h-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <HiOutlineListBullet className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center justify-center w-10 h-8 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <HiOutlineCalendar className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[300px]">
                        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by trainee name or session topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex bg-slate-100/50 rounded-lg border border-slate-200 p-1">
                        {types.map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider ${typeFilter === type ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Time Filter */}
                    <div className="relative h-[38px] min-w-[160px]">
                        <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="w-full h-full pl-10 pr-8 bg-slate-100/50 border border-slate-200 rounded-lg text-[11px] font-bold uppercase tracking-wider text-slate-700 outline-none cursor-pointer appearance-none"
                        >
                            {times.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' ? renderCalendar() : (
                <div className="glass-card overflow-hidden border border-slate-200 animate-in fade-in duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trainee </th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Topic</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Records</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSessions.map(session => (
                                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-[12px] text-white shadow-sm">
                                                    {session.trainee?.split(' ').map(n => n[0]).join('') || "U"}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-slate-900 leading-tight">{session.trainee}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[14px] font-bold text-slate-700 leading-tight mb-1">{session.topic}</p>
                                            <div className="flex items-center gap-2">
                                                <HiOutlineCalendar size={12} className="text-slate-300" />
                                                <p className="text-[11px] text-slate-500 font-medium">{session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${session.type?.includes('Flight') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                session.type?.includes('Simulator') ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {session.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                                                </div>
                                                <span className="text-[13px] font-black text-slate-900">85%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedSession(session)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                            >
                                                Reports <HiOutlineArrowTopRightOnSquare size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSessions.length === 0 && (
                            <div className="p-16 text-center text-slate-400 font-medium bg-slate-50/30">
                                <HiOutlineMagnifyingGlass className="w-10 h-10 mx-auto mb-4 text-slate-200" />
                                <p className="text-lg text-slate-500 font-bold mb-1">No matches found</p>
                                <p className="text-sm">Try adjusting your filters or search terms.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedSession && (
                <DebriefSummary session={selectedSession} onClose={() => setSelectedSession(null)} />
            )}

            {noDataPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm" onClick={() => setNoDataPopup(false)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3 text-amber-500">
                            <HiOutlineCalendar className="w-6 h-6" />
                            <h3 className="font-bold text-lg text-slate-900">Empty Logbook</h3>
                        </div>
                        <p className="text-slate-500 text-sm mb-6">No historical training sessions found for {popupDateStr}.</p>
                        <button onClick={() => setNoDataPopup(false)} className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition">Close</button>
                    </div>
                </div>
            )}

            {daySessionsPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm" onClick={() => setDaySessionsPopup(null)}>
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Records for {popupDateStr}</h3>
                            <button onClick={() => setDaySessionsPopup(null)} className="p-1 hover:bg-slate-200 rounded-md text-slate-500"><HiOutlineXMark size={20} /></button>
                        </div>
                        <div className="overflow-y-auto p-4 flex flex-col gap-3">
                            {daySessionsPopup.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setDaySessionsPopup(null); setSelectedSession(s); }}
                                    className="text-left flex items-start justify-between p-4 bg-white border border-slate-200 hover:border-blue-500 rounded-xl transition-all shadow-sm group"
                                >
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{s.topic}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500">{s.trainee}</span>
                                        </div>
                                    </div>
                                    <HiOutlineArrowTopRightOnSquare className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
