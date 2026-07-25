import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function ExamsView({ dark }) {
  const [tab, setTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [resultsSummary, setResultsSummary] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [modalType, setModalType] = useState(null);
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [examForm, setExamForm] = useState({ name: '', type: 'Internal', startDate: '', endDate: '', status: 'Scheduled', classIds: [] });
  
  const [marksForm, setMarksForm] = useState({ classId: '', subjectId: '' });
  const [marksData, setMarksData] = useState({}); // studentId -> {marks, maxMarks, grade}

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/exams');
      setExams(res.data.exams);
      if (res.data.exams.length > 0) {
        setSelectedExam(res.data.exams[0]);
        fetchResultsSummary(res.data.exams[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch exams', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResultsSummary = async (examId) => {
    try {
      const resultsRes = await axios.get(`http://localhost:3000/api/exams/${examId}/results`);
      setResultsSummary(resultsRes.data.summary || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const openScheduleModal = async () => {
    setModalType('scheduleExam');
    setExamForm({ name: '', type: 'Internal', startDate: '', endDate: '', status: 'Scheduled', classIds: [] });
    try {
      const res = await axios.get('http://localhost:3000/api/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const openEnterMarksModal = async (exam) => {
    setSelectedExam(exam);
    setModalType('enterMarks');
    setMarksForm({ classId: '', subjectId: '' });
    setStudents([]);
    try {
      const [resC, resS] = await Promise.all([
        axios.get('http://localhost:3000/api/classes'),
        axios.get('http://localhost:3000/api/subjects') // Wait, subjects endpoint might not exist yet, we'll fetch from class or just handle it if it doesn't exist
      ]);
      setClasses(resC.data.classes);
      // For subjects we can extract from the selected class later.
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChangeForMarks = async (classId) => {
    setMarksForm({ ...marksForm, classId });
    if (!classId) return setStudents([]);
    try {
      const res = await axios.get(`http://localhost:3000/api/classes/${classId}`);
      const studs = res.data.class.students || [];
      setStudents(studs);
      
      const subjs = res.data.class.subjects || [];
      setSubjects(subjs);

      const defaultData = {};
      studs.forEach(s => {
        defaultData[s.id] = { marks: '', maxMarks: 100, grade: '' };
      });
      setMarksData(defaultData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/exams', examForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Exam scheduled', type: 'success' });
      setModalType(null);
      fetchExams();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to schedule exam', type: 'error' });
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedExam || !marksForm.subjectId) {
      return setToast({ message: 'Select an exam and subject', type: 'error' });
    }
    const marksArr = Object.keys(marksData).map(studentId => ({
      studentId,
      subjectId: marksForm.subjectId,
      marks: parseFloat(marksData[studentId].marks) || 0,
      maxMarks: parseFloat(marksData[studentId].maxMarks) || 100,
      grade: marksData[studentId].grade
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3000/api/exams/${selectedExam.id}/results`, { marks: marksArr }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Marks saved successfully', type: 'success' });
      setModalType(null);
      fetchResultsSummary(selectedExam.id);
    } catch (err) {
      setToast({ message: 'Failed to save marks', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px]">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Examinations</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage exam schedules and view results.</p>
        </div>
        <button onClick={openScheduleModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Schedule Exam
        </button>
      </section>

      {/* Tabs */}
      <div className="flex gap-1">
        {['exams', 'results'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${tab === t ? 'admin-gradient-primary text-white shadow-md' : dark ? 'bg-[#2f3133] text-[#bbcac4] hover:bg-[#3c4a46]' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>
            {t === 'exams' ? 'Exam Schedule' : 'Results & Reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-outline">Loading data...</div>
      ) : (
        <>
          {tab === 'exams' && (
            <div className="space-y-3">
              {exams.length === 0 ? (
                <div className="py-8 text-center text-outline">No exams found.</div>
              ) : exams.map((ex, i) => (
                <div key={ex.id} className={`admin-card admin-row-enter p-4 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[14px] font-bold">{ex.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ex.status === 'Upcoming' ? 'bg-tertiary/10 text-tertiary' : ex.status === 'Scheduled' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>{ex.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span className={`flex items-center gap-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span>
                          {formatDate(ex.startDate)} — {formatDate(ex.endDate)}
                        </span>
                        <span className={`flex items-center gap-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>school</span>
                          {ex.classes || 'All Classes'}
                        </span>
                        <span className={`flex items-center gap-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>category</span>
                          {ex.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEnterMarksModal(ex)} className="text-secondary text-[11px] font-semibold hover:underline border px-2 py-1 rounded-md">Enter Marks</button>
                      <button className="text-primary text-[11px] font-semibold hover:underline border px-2 py-1 rounded-md">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'results' && (
            <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <div className="p-4 pb-2">
                <h4 className="text-[15px] font-semibold">{selectedExam?.name || 'Latest Exam'} - Results Summary</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
                    <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Avg Score</th>
                      <th className="py-3 px-4">Topper</th>
                      <th className="py-3 px-4">Pass Rate</th>
                      <th className="py-3 px-4">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {resultsSummary.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-outline">No results published for this exam.</td></tr>
                    ) : resultsSummary.map((r, i) => (
                      <tr key={r.class} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                        style={{ animationDelay: `${i * 0.04}s` }}>
                        <td className="py-3 px-4 font-semibold">Class {r.class}</td>
                        <td className="py-3 px-4 font-bold">{r.avgScore}%</td>
                        <td className="py-3 px-4">{r.toppers}</td>
                        <td className="py-3 px-4 font-bold text-primary">{r.passRate}</td>
                        <td className="py-3 px-4">
                          <div className={`w-full max-w-[100px] rounded-full h-1.5 ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container'}`}>
                            <div className={`h-full rounded-full ${r.avgScore >= 80 ? 'bg-primary' : r.avgScore >= 70 ? 'bg-primary-container' : 'bg-tertiary-container'}`} style={{ width: `${r.avgScore}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Modals */}
      {modalType === 'scheduleExam' && (
        <Modal title="Schedule Exam" onClose={() => setModalType(null)}>
          <form onSubmit={handleSaveExam} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Exam Name</label>
              <input required type="text" value={examForm.name} onChange={e => setExamForm({...examForm, name: e.target.value})} className="admin-input w-full" placeholder="e.g. Mid-Term 2024" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Type</label>
                <select required value={examForm.type} onChange={e => setExamForm({...examForm, type: e.target.value})} className="admin-select w-full">
                  <option value="Internal">Internal</option>
                  <option value="Board">Board</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Status</label>
                <select required value={examForm.status} onChange={e => setExamForm({...examForm, status: e.target.value})} className="admin-select w-full">
                  <option value="Scheduled">Scheduled</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Start Date</label>
                <input required type="date" value={examForm.startDate} onChange={e => setExamForm({...examForm, startDate: e.target.value})} className="admin-input w-full" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>End Date</label>
                <input required type="date" value={examForm.endDate} onChange={e => setExamForm({...examForm, endDate: e.target.value})} className="admin-input w-full" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Select Classes (Hold Ctrl to multi-select)</label>
              <select multiple value={examForm.classIds} onChange={e => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setExamForm({...examForm, classIds: values});
              }} className="admin-select w-full h-32">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalType(null)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Schedule Exam</button>
            </div>
          </form>
        </Modal>
      )}

      {modalType === 'enterMarks' && (
        <Modal title={`Enter Marks - ${selectedExam?.name}`} onClose={() => setModalType(null)}>
          <form onSubmit={handleSaveMarks} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Class</label>
                <select required value={marksForm.classId} onChange={e => handleClassChangeForMarks(e.target.value)} className="admin-select w-full">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Subject</label>
                <select required value={marksForm.subjectId} onChange={e => setMarksForm({...marksForm, subjectId: e.target.value})} className="admin-select w-full">
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {marksForm.classId && students.length === 0 && (
              <p className="text-[12px] text-error">No students found in this class.</p>
            )}

            {students.length > 0 && marksForm.subjectId && (
              <div className="mt-4 border rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto admin-scrollbar">
                <table className="w-full text-left">
                  <thead className={`sticky top-0 z-10 ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container-low'}`}>
                    <tr className="text-[11px] uppercase tracking-wider text-outline">
                      <th className="p-2 pl-4">Student</th>
                      <th className="p-2 w-24">Marks</th>
                      <th className="p-2 w-24">Max Marks</th>
                      <th className="p-2 w-24">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className={`border-t ${dark ? 'border-[#3c4a46]/50' : 'border-outline-variant/30'}`}>
                        <td className="p-2 pl-4 text-[13px] font-semibold">{s.name} <span className="text-[10px] text-outline ml-1">{s.studentId}</span></td>
                        <td className="p-2">
                          <input type="number" step="0.5" value={marksData[s.id]?.marks} onChange={e => setMarksData({...marksData, [s.id]: {...marksData[s.id], marks: e.target.value}})} className="admin-input w-full p-1" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={marksData[s.id]?.maxMarks} onChange={e => setMarksData({...marksData, [s.id]: {...marksData[s.id], maxMarks: e.target.value}})} className="admin-input w-full p-1" />
                        </td>
                        <td className="p-2">
                          <input type="text" maxLength="2" value={marksData[s.id]?.grade} onChange={e => setMarksData({...marksData, [s.id]: {...marksData[s.id], grade: e.target.value.toUpperCase()}})} className="admin-input w-full p-1 uppercase" placeholder="A+" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalType(null)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Save Marks</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
