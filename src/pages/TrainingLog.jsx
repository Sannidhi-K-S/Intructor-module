import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import TrainingAPIService from '../services/trainingAPIService';
import { jsPDF } from 'jspdf';
import {
    HiOutlineArrowDownTray,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle
} from 'react-icons/hi2';

const TrainingLog = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { sessions, updateSessionData, loadDashboard, loading: storeLoading } = useAppStore();

    const [additionalRemark, setAdditionalRemark] = useState('');
    const [generatedDebrief, setGeneratedDebrief] = useState(null);
    const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
    const [isSavingDebrief, setIsSavingDebrief] = useState(false);
    const [debriefError, setDebriefError] = useState(null);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);

    React.useEffect(() => {
        if (sessions.length === 0) {
            loadDashboard();
        }
    }, [sessions.length, loadDashboard]);

    const session = sessionId
        ? sessions.find((s) => String(s.id) === String(sessionId))
        : null;

    const markAsComplete = async () => {
        if (!session) return;
        setIsMarkingComplete(true);
        try {
            const result = await TrainingAPIService.markSessionComplete(session.id, additionalRemark);
            if (result.success) {
                updateSessionData(session.id, {
                    status: 'completed',
                    sessionOutcome: 'completed',
                    additionalRemarks: additionalRemark
                });
                alert('Session marked as complete successfully!');
            }
        } catch (error) {
            console.error('Error marking complete:', error);
            alert('Failed to mark session as complete.');
        } finally {
            setIsMarkingComplete(false);
        }
    };

    const downloadPDF = (s) => {
        if (!s) return;
        const exercises = (s.lessonPlan?.exercises || s.lessonplan?.exercise || []).map(ex => ({
            name: ex.name || ex.exercise_name,
            type: ex.type || ex.exercise_type,
            score: ex.score || 0,
            notes: ex.notes || ''
        }));
        const avgScore = exercises.length > 0
            ? exercises.reduce((acc, ex) => acc + (ex.score || 0), 0) / exercises.length
            : 0;

        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Operational Training Report', 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Mission ID: ${s.id} | Date: ${s.date ? new Date(s.date).toLocaleDateString() : 'Unknown Date'}`, 20, 30);
        doc.setDrawColor(200);
        doc.line(20, 35, 190, 35);
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Mission Overview', 20, 45);
        doc.setFontSize(11);
        doc.text(`Trainee: ${s.trainee}`, 20, 55);
        doc.text(`Topic: ${s.topic}`, 20, 62);
        doc.text(`Mission Type: ${s.type}`, 20, 69);
        doc.text(`Resource: ${s.resourceUsed}`, 20, 76);
        doc.text(`Outcome: ${s.sessionOutcome?.toUpperCase() || 'COMPLETED'}`, 20, 83);
        doc.text(`Average Score: ${avgScore.toFixed(1)}/5.0`, 20, 90);
        doc.setFontSize(14);
        doc.text('Detailed Exercise Grading', 20, 105);
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
        if (generatedDebrief?.overallNarrative?.executiveSummary) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.text('AI-Generated Instructor Debrief Summary', 20, y);
            y += 10;
            doc.setFontSize(10);
            const aiSummary = doc.splitTextToSize(generatedDebrief.overallNarrative.executiveSummary, 170);
            doc.text(aiSummary, 20, y);
        }
        doc.save(`Mission_Report_${s.trainee.replace(' ', '_')}_${s.id}.pdf`);
    };

    const generateDebriefSummary = async () => {
        if (!session) return;
        setIsGeneratingDebrief(true);
        setDebriefError(null);
        try {
            const result = await TrainingAPIService.getDebriefSummary(session.id);
            if (result.success) {
                setGeneratedDebrief(result.data);
            } else {
                setDebriefError(result.message || 'Failed to generate debrief summary');
            }
        } catch (error) {
            console.error('Error generating debrief:', error);
            setDebriefError('Failed to generate debrief summary.');
        } finally {
            setIsGeneratingDebrief(false);
        }
    };

    const saveDebriefSummary = async () => {
        if (!session || !generatedDebrief) return;
        setIsSavingDebrief(true);
        setDebriefError(null);
        try {
            const result = await TrainingAPIService.saveDebriefSummary(session.id, {
                debriefSummary: generatedDebrief.overallNarrative?.executiveSummary || '',
                additionalRemarks: additionalRemark
            });
            if (result.success) {
                updateSessionData(session.id, {
                    debriefSummary: generatedDebrief.overallNarrative?.executiveSummary || '',
                    additionalRemarks: additionalRemark
                });
                alert('Debrief summary saved successfully!');
            }
        } catch (error) {
            console.error('Error saving debrief:', error);
        } finally {
            setIsSavingDebrief(false);
        }
    };

    // ── Loading state ──────────────────────────────────────────────────────────
    if (storeLoading) {
        return (
            <div className="max-w-7xl mx-auto p-10 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold">Loading Report Details...</h2>
            </div>
        );
    }

    // ── Not found guard ────────────────────────────────────────────────────────
    if (!session) {
        return (
            <div className="max-w-7xl mx-auto p-10 text-center">
                <HiOutlineExclamationCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Report Not Found or Not Available</h2>
                <p className="text-slate-500 mt-2">
                    Evaluation reports are generated after the grading session is completed.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // ── Derived data ───────────────────────────────────────────────────────────
    const sessionExercises = (session.lessonPlan?.exercises || session.lessonplan?.exercise || []).map(ex => ({
        id: ex.id,
        name: ex.name || ex.exercise_name,
        type: ex.type || ex.exercise_type,
        score: ex.score || 0,
        notes: ex.notes || ''
    }));

    const averageScore = sessionExercises.length > 0
        ? sessionExercises.reduce((acc, ex) => acc + (ex.score || 0), 0) / sessionExercises.length
        : 0;

    // ── Main render ────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="glass-card bg-white p-8">

                {/* Header */}
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-bold">Training Report: {session.topic}</h2>
                    <div className="text-right">
                        <p className="text-lg font-bold">Trainee: {session.trainee}</p>
                        <p className="text-sm text-slate-500">{session.startTime} - {session.endTime}</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase">Avg Score</p>
                        <p className="text-xl font-bold">{averageScore.toFixed(1)}/5.0</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase">Mission</p>
                        <p className="font-bold">{session.type}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase">Resource</p>
                        <p className="font-bold truncate">{session.resourceUsed}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${session.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</p>
                        <p className={`font-bold capitalize ${session.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {session.status ? session.status.replace('_', ' ') : 'Pending'}
                        </p>
                    </div>
                </div>

                {/* Debrief Summary */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Debrief Summary</h3>
                        <button
                            onClick={generateDebriefSummary}
                            disabled={isGeneratingDebrief}
                            className="px-4 py-2 bg-blue-600 text-white rounded font-bold disabled:opacity-50"
                        >
                            {isGeneratingDebrief ? 'Generating...' : 'Generate AI Summary'}
                        </button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border">
                        {generatedDebrief ? (
                            <div className="prose max-w-none">
                                <p>{generatedDebrief.overallNarrative?.executiveSummary}</p>
                                <button
                                    onClick={saveDebriefSummary}
                                    disabled={isSavingDebrief}
                                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                                >
                                    {isSavingDebrief ? 'Saving...' : 'Save Debrief'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No summary generated yet.</p>
                        )}
                        {session.debriefSummary && !generatedDebrief && (
                            <div className="mt-4 p-4 border-t" dangerouslySetInnerHTML={{ __html: session.debriefSummary }} />
                        )}
                        {debriefError && <p className="text-red-500 mt-2 text-sm">{debriefError}</p>}
                    </div>
                </section>

                {/* Additional Remarks */}
                <section className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Additional Remarks</h3>
                    <textarea
                        value={additionalRemark}
                        onChange={(e) => setAdditionalRemark(e.target.value)}
                        placeholder="Add any additional observations or notes here..."
                        className="w-full h-32 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                    />
                </section>

                {/* Exercise Grades */}
                <section>
                    <h3 className="text-xl font-bold mb-4">Exercise Grades</h3>
                    {sessionExercises.length === 0 ? (
                        <p className="text-slate-400 italic">No exercise grades recorded yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {sessionExercises.map((ex, i) => (
                                <div key={ex.id || i} className="p-4 border rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{ex.name}</p>
                                        <p className="text-sm text-slate-500">{ex.type}</p>
                                    </div>
                                    <p className="text-xl font-bold">{ex.score}/5.0</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 border rounded font-bold hover:bg-slate-50"
                    >
                        Close
                    </button>
                    {session.status !== 'completed' && (
                        <button
                            onClick={markAsComplete}
                            disabled={isMarkingComplete}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition disabled:opacity-50"
                        >
                            <HiOutlineCheckCircle className="w-5 h-5" />
                            {isMarkingComplete ? 'Marking...' : 'Mark as Complete'}
                        </button>
                    )}
                    <button
                        onClick={() => downloadPDF(session)}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition"
                    >
                        <HiOutlineArrowDownTray className="w-5 h-5" />
                        Download PDF
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TrainingLog;
