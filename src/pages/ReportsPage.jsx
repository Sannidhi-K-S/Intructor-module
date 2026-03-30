import React, { useState, useEffect } from 'react';
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
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

const ReportsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [additionalRemark, setAdditionalRemark] = useState('');
  const [generatedDebrief, setGeneratedDebrief] = useState(null);
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
  const [isSavingDebrief, setIsSavingDebrief] = useState(false);
  const [debriefError, setDebriefError] = useState(null);

  const { updateSessionData } = useAppStore();

  useEffect(() => {
    const fetchSessionReport = async () => {
      if (!sessionId) return;
      try {
        const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/report`);
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        }
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessionReport();
  }, [sessionId]);

  const downloadPDF = (s) => {
    if (!s) return;

    const exercises = s.lessonPlan?.exercises || [];
    const averageScore = exercises.length > 0 ? exercises.reduce((acc, ex) => acc + (ex.score || 0), 0) / exercises.length : 0;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Operational Training Report', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Mission ID: ' + s.id + ' | Date: ' + (s.date ? new Date(s.date).toLocaleDateString() : 'Unknown Date'), 20, 30);

    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Mission Overview', 20, 45);
    doc.setFontSize(11);
    doc.text('Trainee: ' + s.trainee, 20, 55);
    doc.text('Topic: ' + s.topic, 20, 62);
    doc.text('Mission Type: ' + s.type, 20, 69);
    doc.text('Resource: ' + s.resourceUsed, 20, 76);
    doc.text('Outcome: ' + (s.sessionOutcome ? s.sessionOutcome.toUpperCase() : 'COMPLETED'), 20, 83);
    doc.text('Average Score: ' + averageScore.toFixed(1) + '/5.0', 20, 90);

    doc.setFontSize(14);
    doc.text('Detailed Exercise Grading', 20, 105);

    let y = 115;
    exercises.forEach((ex, i) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.text((i + 1) + '. ' + ex.name + ' (' + ex.type + ')', 25, y);
      doc.text('Score: ' + (ex.score || 0) + '/5', 160, y);
      y += 8;

      if (ex.notes) {
        doc.setFontSize(9);
        doc.setTextColor(80);
        const splitNotes = doc.splitTextToSize(ex.notes.replace(/<[^>]*>/g, ''), 150);
        doc.text(splitNotes, 30, y);
        y += splitNotes.length * 6 + 4;
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
      y += aiSummary.length * 5 + 5;

      if (generatedDebrief.performance) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.text('Performance Analysis:', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.text('Level: ' + generatedDebrief.performance.performanceLevel, 25, y);
        y += 5;
        doc.text('Average Score: ' + (generatedDebrief.performance.averageScore || 0) + '/5.0', 25, y);
        y += 5;
        doc.text('Consistency: ' + generatedDebrief.performance.consistency, 25, y);
        y += 8;
      }

      if (generatedDebrief.recommendations?.length > 0) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text('Key Recommendations:', 20, y);
        y += 8;
        doc.setFontSize(10);
        generatedDebrief.recommendations.slice(0, 3).forEach((rec) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text('• ' + rec.category + ': ' + rec.text, 25, y);
          y += 6;
        });
        y += 5;
      }
    } else if (s.debriefSummary) {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text('Instructor Debrief Summary', 20, y);
      y += 10;
      doc.setFontSize(10);
      const summary = doc.splitTextToSize(s.debriefSummary.replace(/<[^>]*>/g, ''), 170);
      doc.text(summary, 20, y);
      y += summary.length * 5 + 5;
    }

    if (additionalRemark.trim()) {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text('Additional Remark', 20, y);
      y += 10;
      doc.setFontSize(10);
      const remark = doc.splitTextToSize(additionalRemark, 170);
      doc.text(remark, 20, y);
    }

    doc.save('Mission_Report_' + s.trainee.replace(/\s+/g, '_') + '_' + s.id + '.pdf');
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
      setDebriefError('Failed to generate debrief summary. Please check your connection.');
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
        additionalRemarks: additionalRemark,
      });

      if (result.success) {
        updateSessionData(session.id, {
          debriefSummary: generatedDebrief.overallNarrative?.executiveSummary || '',
          additionalRemarks: additionalRemark,
        });
        alert('Debrief summary saved successfully!');
      } else {
        setDebriefError(result.message || 'Failed to save debrief summary');
      }
    } catch (error) {
      console.error('Error saving debrief:', error);
      setDebriefError('Failed to save debrief summary. Please try again.');
    } finally {
      setIsSavingDebrief(false);
    }
  };

  if (isLoading) {
    return (
      <div className='max-w-7xl mx-auto p-10 text-center'>
        <p className='text-slate-500 mt-2 font-medium'>Fetching training report from database...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className='max-w-7xl mx-auto p-10 text-center'>
        <h2 className='text-xl font-bold'>Report Not Found</h2>
        <p className='text-slate-500 mt-2'>No training report available for this mission.</p>
        <button onClick={() => navigate('/reports')} className='mt-6 px-6 py-2 border rounded'>Back to Reports</button>
      </div>
    );
  }

  const sessionExercises = session.lessonPlan?.exercises || [];
  const averageScore = sessionExercises.length > 0 ? sessionExercises.reduce((acc, ex) => acc + (ex.score || 0), 0) / sessionExercises.length : 0;

  return (
    <div className='max-w-7xl mx-auto space-y-6'>
      <div className='glass-card w-full max-h-[85vh] overflow-hidden flex flex-col bg-white'>
        <div className='p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center'>
              <HiOutlineIdentification className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-slate-900'>Training Report</h2>
              <p className='text-[12px] text-slate-500 font-medium'>{session.id} · {session.trainee}</p>
            </div>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-8 space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='p-4 bg-slate-50 rounded-xl border border-slate-200'>
              <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>Performance</p>
              <p className='text-xl font-bold text-slate-900'>{averageScore.toFixed(1)}<span className='text-slate-300'>/5.0</span></p>
            </div>
            <div className='p-4 bg-slate-50 rounded-xl border border-slate-200'>
              <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>Mission Type</p>
              <p className='text-[13px] font-bold text-slate-900'>{session.type}</p>
            </div>
            <div className='p-4 bg-slate-50 rounded-xl border border-slate-200'>
              <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>Resource</p>
              <p className='text-[13px] font-bold text-slate-900 truncate' title={session.resourceUsed}>{session.resourceUsed || 'N/A'}</p>
            </div>
            <div className={`p-4 rounded-xl border ${session.sessionOutcome === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${session.sessionOutcome === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>Outcome</p>
              <p className={`text-[13px] font-bold uppercase ${session.sessionOutcome === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>{session.sessionOutcome || 'Completed'}</p>
            </div>
          </div>

          <section>
            <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-6'>
              <h3 className='text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2'><HiOutlineChatBubbleBottomCenterText className='w-4 h-4' /> Instructor Debrief Summary</h3>
              <button onClick={generateDebriefSummary} disabled={isGeneratingDebrief} className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 transition'><HiOutlineSparkles className='w-4 h-4' /> {isGeneratingDebrief ? 'Generating...' : 'Generate AI Summary'}</button>
            </div>

            {debriefError && <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>{debriefError}</div>}

            <div className='bg-slate-50 p-6 rounded-xl border border-slate-100'>
              {generatedDebrief ? (
                <div className='space-y-6'>
                  <h4 className='text-sm font-bold text-slate-900 mb-2'>Executive Summary</h4>
                  <p className='text-sm text-slate-700 leading-relaxed'>{generatedDebrief.overallNarrative?.executiveSummary}</p>

                  {generatedDebrief.performance && (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-slate-200'>
                      <div className='text-center'>
                        <p className='text-xs font-bold text-slate-500 uppercase mb-1'>Performance Level</p>
                        <p className='text-lg font-bold text-slate-900'>{generatedDebrief.performance.performanceLevel}</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-xs font-bold text-slate-500 uppercase mb-1'>Average Score</p>
                        <p className='text-lg font-bold text-slate-900'>{generatedDebrief.performance.averageScore}/5.0</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-xs font-bold text-slate-500 uppercase mb-1'>Consistency</p>
                        <p className='text-lg font-bold text-slate-900'>{generatedDebrief.performance.consistency}</p>
                      </div>
                    </div>
                  )}

                  {generatedDebrief.recommendations?.length > 0 && (
                    <div>
                      <h4 className='text-sm font-bold text-blue-900 mb-2'>Key Recommendations</h4>
                      <div className='space-y-2'>
                        {generatedDebrief.recommendations.map((rec, idx) => (
                          <div key={idx} className='p-3 rounded-lg border bg-blue-50 border-blue-200'>
                            <p className='text-sm font-semibold text-slate-900'>{rec.category}</p>
                            <p className='text-sm text-slate-700'>{rec.text}</p>
                            <p className='text-xs text-slate-500 mt-1'>Priority: {rec.priority || 'Standard'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='flex justify-end pt-4 border-t border-slate-200'>
                    <button onClick={saveDebriefSummary} disabled={isSavingDebrief} className='px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 hover:bg-green-700 transition'>
                      {isSavingDebrief ? 'Saving...' : 'Save Debrief Summary'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className='text-slate-500 italic'>No summary generated yet.</p>
              )}

              {!generatedDebrief && session.debriefSummary && (
                <div className='mt-4 p-4 border-t' dangerouslySetInnerHTML={{ __html: session.debriefSummary }} />
              )}
            </div>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-4'>Exercise Grades</h3>
            <div className='space-y-4'>
              {sessionExercises.map((ex, i) => (
                <div key={ex.id || i} className='p-4 border rounded-xl flex justify-between items-center'>
                  <div>
                    <p className='font-bold'>{ex.name}</p>
                    <p className='text-sm text-slate-500'>{ex.type}</p>
                  </div>
                  <p className='text-xl font-bold'>{ex.score}/5.0</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className='p-4 border-t border-slate-200 flex justify-end gap-4 bg-slate-50'>
          <button onClick={() => navigate('/reports')} className='px-6 py-2 border rounded'>Back to Reports</button>
          <button onClick={() => downloadPDF(session)} className='px-6 py-2 bg-slate-900 text-white rounded font-bold'>Download PDF</button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;