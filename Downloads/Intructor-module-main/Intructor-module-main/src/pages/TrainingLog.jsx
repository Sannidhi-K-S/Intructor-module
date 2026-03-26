import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import TrainingAPIService from '../services/trainingAPIService';
import { jsPDF } from 'jspdf';
import {
    HiOutlineArrowDownTray,
    HiOutlineStar,
    HiOutlineMapPin,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineIdentification,
    HiOutlineSparkles,
    HiOutlineDocumentText,
    HiOutlineExclamationCircle
} from 'react-icons/hi2';

const TrainingLog = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { sessions, updateExercise, updateSessionData } = useAppStore();
    const [additionalRemark, setAdditionalRemark] = useState('');
    const [generatedDebrief, setGeneratedDebrief] = useState(null);
    const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
    const [isSavingDebrief, setIsSavingDebrief] = useState(false);
    const [debriefError, setDebriefError] = useState(null);

    const session = sessionId
        ? sessions.find((s) => String(s.id) === String(sessionId))
        : sessions[0];

    const downloadPDF = (s) => {
        if (!s) return;
        const exercises = s.lessonPlan?.exercises || [];
        const averageScore = exercises.length > 0 
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
        doc.text(`Average Score: ${averageScore.toFixed(1)}/5.0`, 20, 90);

        doc.setFontSize(14);
        doc.text('Detailed Exercise Grading', 20, 105);

        let y = 115;
        exercises.forEach((ex, i) => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
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
            if (y > 230) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            doc.text('AI-Generated Instructor Debrief Summary', 20, y);
            y += 10;
            doc.setFontSize(10);
            const aiSummary = doc.splitTextToSize(generatedDebrief.overallNarrative.executiveSummary, 170);
            doc.text(aiSummary, 20, y);
            y += (aiSummary.length * 5) + 5;
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
                setAdditionalRemark(result.data.overallNarrative?.executiveSummary || '');
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

    if (!session) {
        return (
            <div className="max-w-7xl mx-auto p-10 text-center">
                <h2 className="text-xl font-bold">Training Log Not Found</h2>
                <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 border rounded">Back to Dashboard</button>
            </div>
        );
    }

    const sessionExercises = session.lessonPlan?.exercises || [];
    const averageScore = sessionExercises.length > 0 
        ? sessionExercises.reduce((acc, ex) => acc + (ex.score || 0), 0) / sessionExercises.length 
        : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="glass-card bg-white p-8">
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-bold">Training Report: {session.topic}</h2>
                    <div className="text-right">
                        <p className="text-lg font-bold">Trainee: {session.trainee}</p>
                        <p className="text-sm text-slate-500">{session.startTime} - {session.endTime}</p>
                    </div>
                </div>

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
                    <div className={`p-4 rounded-xl ${session.debriefSummary ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <p className="text-xs font-bold uppercase">Status</p>
                        <p className="font-bold">{session.debriefSummary ? 'Completed' : 'Action Required'}</p>
                    </div>
                </div>

                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Debrief Summary</h3>
                        <button 
                            onClick={generateDebriefSummary} 
                            disabled={isGeneratingDebrief}
                            className="px-4 py-2 bg-blue-600 text-white rounded font-bold"
                        >
                            {isGeneratingDebrief ? 'Generating...' : 'Generate AI Summary'}
                        </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border">
                        {generatedDebrief ? (
                            <div className="prose max-w-none">
                                <p>{generatedDebrief.overallNarrative?.executiveSummary}</p>
                                <button onClick={saveDebriefSummary} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Save</button>
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No summary generated yet.</p>
                        )}
                        {session.debriefSummary && !generatedDebrief && (
                            <div className="mt-4 p-4 border-t" dangerouslySetInnerHTML={{ __html: session.debriefSummary }} />
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-bold mb-4">Exercise Grades</h3>
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
                </section>

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={() => navigate('/')} className="px-6 py-2 border rounded">Close</button>
                    <button onClick={() => downloadPDF(session)} className="px-6 py-2 bg-slate-900 text-white rounded font-bold">Download PDF</button>
                </div>
            </div>
        </div>
    );
};

export default TrainingLog;
