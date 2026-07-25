import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function GradebookView({ dark }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [reportCardData, setReportCardData] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('https://school-backend-70ny.onrender.com/api/students');
        setStudents(res.data.students || []);
      } catch (err) {
        console.error('Failed to fetch students', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleGenerateReportCard = async (studentId) => {
    try {
      setToast({ message: 'Generating report card...', type: 'success' });
      const res = await axios.get(`https://school-backend-70ny.onrender.com/api/exams/report-card/${studentId}`);
      setReportCardData(res.data);
      setReportModalOpen(true);
      setToast(null);
    } catch (err) {
      setToast({ message: 'Failed to generate report card', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Gradebook & Report Cards</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Generate and view student report cards.</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search students..." />
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4 w-32">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-outline">Loading students...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-outline">No students found.</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-mono font-semibold">{s.studentId}</td>
                  <td className="py-3 px-4 font-semibold">{s.name}</td>
                  <td className="py-3 px-4">{s.class?.name || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleGenerateReportCard(s.id)} className="admin-btn-press text-primary text-[11px] font-semibold hover:underline border px-3 py-1.5 rounded-lg border-primary/20 hover:bg-primary/5">Generate Report Card</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {reportModalOpen && reportCardData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
          <div className={`relative w-full max-w-3xl max-h-full flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 ${dark ? 'bg-[#1a1c1e] text-[#f0f0f3]' : 'bg-white text-on-surface'}`}>
            <div className={`flex justify-between items-center p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/40'}`}>
              <h3 className="font-bold text-lg">Report Card</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${dark ? 'hover:bg-[#2f3133] text-[#bbcac4]' : 'hover:bg-surface-container text-outline'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                </button>
                <button onClick={() => setReportModalOpen(false)} className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${dark ? 'hover:bg-[#2f3133] text-[#bbcac4]' : 'hover:bg-surface-container text-outline'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6 admin-scrollbar" id="report-card-print">
              <div className={`border-2 rounded-xl p-8 max-w-2xl mx-auto ${dark ? 'border-[#3c4a46] bg-[#2f3133]' : 'border-outline-variant/50 bg-white'}`}>
                <div className="text-center border-b pb-6 mb-6">
                  <h1 className="text-2xl font-black text-primary">iNiLabs School</h1>
                  <p className="text-sm uppercase tracking-widest mt-1 opacity-70">Academic Report Card</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                  <div>
                    <span className="opacity-70 text-[11px] uppercase tracking-wider block">Student Name</span>
                    <strong className="text-lg">{reportCardData.student.name}</strong>
                  </div>
                  <div className="text-right">
                    <span className="opacity-70 text-[11px] uppercase tracking-wider block">Student ID</span>
                    <strong className="text-lg font-mono">{reportCardData.student.studentId}</strong>
                  </div>
                  <div>
                    <span className="opacity-70 text-[11px] uppercase tracking-wider block">Class</span>
                    <strong>{reportCardData.student.class?.name || '—'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="opacity-70 text-[11px] uppercase tracking-wider block">Academic Year</span>
                    <strong>2024-2025</strong>
                  </div>
                </div>
                
                <h4 className="font-bold mb-3 border-b pb-1">Examination Results</h4>
                {reportCardData.results.length === 0 ? (
                  <p className="text-center text-outline py-8">No examination results available yet.</p>
                ) : (
                  <table className="w-full text-left border-collapse mb-8">
                    <thead>
                      <tr className={`text-[11px] uppercase tracking-wider border-b ${dark ? 'border-[#4a5854]' : 'border-outline-variant/50'}`}>
                        <th className="py-2">Subject</th>
                        <th className="py-2">Exam</th>
                        <th className="py-2 text-right">Marks</th>
                        <th className="py-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCardData.results.map((r, i) => (
                        <tr key={r.id || i} className={`border-b ${dark ? 'border-[#4a5854]/50' : 'border-outline-variant/30'}`}>
                          <td className="py-3 font-semibold">{r.subject.name}</td>
                          <td className="py-3 text-[12px] opacity-80">{r.exam.name}</td>
                          <td className="py-3 text-right font-mono">{r.marks} / {r.maxMarks || 100}</td>
                          <td className="py-3 text-center font-bold text-primary">{r.grade || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="mt-12 flex justify-between items-end pt-12 border-t border-dashed">
                  <div className="text-center w-40">
                    <div className="border-b border-black dark:border-white mb-2"></div>
                    <span className="text-[11px] uppercase tracking-wider opacity-70">Class Teacher</span>
                  </div>
                  <div className="text-center w-40">
                    <div className="border-b border-black dark:border-white mb-2"></div>
                    <span className="text-[11px] uppercase tracking-wider opacity-70">Principal</span>
                  </div>
                </div>
              </div>
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #report-card-print, #report-card-print * { visibility: visible; }
                  #report-card-print { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 0; overflow: visible; background: white; color: black; }
                  .fixed { position: absolute; }
                }
              `}</style>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
