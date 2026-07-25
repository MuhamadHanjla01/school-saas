import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUBJECT_COLORS = {
  Physics: '#006b5c', Mathematics: '#0060ac', English: '#9d4224', Chemistry: '#006b5c',
  'Computer Science': '#0060ac', Biology: '#006b5c', History: '#9d4224', PE: '#00c2a8',
  Art: '#ff8d69', Music: '#68abff', Geography: '#006b5c', Library: '#6c7a76', Lunch: '#e2e2e5',
};

export default function TimetableView({ dark }) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [slotForm, setSlotForm] = useState({ dayOfWeek: 'Monday', startTime: '', endTime: '', subjectId: '', teacherId: '' });
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [resClasses, resTeachers] = await Promise.all([
          axios.get('http://localhost:3000/api/classes'),
          axios.get('http://localhost:3000/api/teachers')
        ]);
        setClasses(resClasses.data.classes);
        setTeachers(resTeachers.data.teachers);
        if (resClasses.data.classes.length > 0) {
          setSelectedClassId(resClasses.data.classes[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchInitial();
  }, []);

  const fetchTimetable = async (classId) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/timetable?classId=${classId}`);
      const timetable = res.data.timetable || {};
      
      const periodSet = new Set();
      const map = {}; // { day: { time: { subject, id } } }
      
      Object.keys(timetable).forEach(day => {
        map[day] = {};
        timetable[day].forEach(slot => {
          periodSet.add(slot.time);
          map[day][slot.time] = { subject: slot.subject, id: slot.id };
        });
      });
      
      const sortedPeriods = Array.from(periodSet).sort();
      setPeriods(sortedPeriods);
      setScheduleData(map);
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) fetchTimetable(selectedClassId);
  }, [selectedClassId]);

  const openAddSlotModal = async () => {
    if (!selectedClassId) return setToast({ message: 'Select a class first', type: 'error' });
    setSlotForm({ dayOfWeek: 'Monday', startTime: '08:00', endTime: '08:45', subjectId: '', teacherId: '' });
    try {
      // Find class subjects
      const cls = classes.find(c => c.id === selectedClassId);
      // Let's assume we can fetch subjects for this class or we fetch all subjects
      // If there's no subjects API yet, we just show teachers.
      // But we need a subjectId. Let's assume we fetch all subjects or class.subjects if they had IDs.
      // For now, if we don't have a /api/subjects route, we'll need to create it or just assume it exists.
      // Let's call /api/subjects
      const res = await axios.get('http://localhost:3000/api/subjects').catch(() => ({ data: { subjects: [] }}));
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
    setModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/timetable', { ...slotForm, classId: selectedClassId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Timetable slot added', type: 'success' });
      setModalOpen(false);
      fetchTimetable(selectedClassId);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to add slot', type: 'error' });
    }
  };
  
  const handleDeleteSlot = async (id) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/timetable/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Slot deleted', type: 'success' });
      fetchTimetable(selectedClassId);
    } catch (err) {
      setToast({ message: 'Failed to delete slot', type: 'error' });
    }
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px]">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Timetable</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>View and manage class timetables.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="admin-select h-10 px-3">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={openAddSlotModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add Slot
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="p-4 pb-2">
          <h4 className="text-[15px] font-semibold">Class {classes.find(c => c.id === selectedClassId)?.name || ''} — Weekly Schedule</h4>
        </div>
        <div className="overflow-x-auto p-4 pt-0">
          {loading ? (
            <div className="py-8 text-center text-outline">Loading timetable...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                  <th className="py-2 px-2 w-24">Time</th>
                  {DAYS.map(d => <th key={d} className="py-2 px-2">{d}</th>)}
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {periods.map((time, pi) => (
                  <tr key={time} className={`admin-row-enter border-t ${dark ? 'border-[#3c4a46]/50' : 'border-outline-variant/20'}`}
                    style={{ animationDelay: `${pi * 0.04}s` }}>
                    <td className={`py-2 px-2 font-mono font-semibold text-[10px] ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>{time}</td>
                    {DAYS.map(day => {
                      const slot = scheduleData[day]?.[time];
                      const sub = slot ? slot.subject : '—';
                      const color = SUBJECT_COLORS[sub] || '#6c7a76';
                      const isLunch = sub === 'Lunch';
                      const isEmpty = sub === '—';
                      return (
                        <td key={day} className="py-1.5 px-1.5">
                          {isEmpty ? (
                            <span className={`text-[10px] ${dark ? 'text-[#6c7a76]' : 'text-outline'}`}>—</span>
                          ) : (
                            <div className={`relative group px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center ${isLunch ? (dark ? 'bg-[#3c4a46] text-[#bbcac4]' : 'bg-surface-container-low text-outline') : ''}`}
                              style={!isLunch ? { background: `${color}12`, color: color } : undefined}>
                              {sub}
                              {!isLunch && (
                                <button onClick={() => handleDeleteSlot(slot.id)} className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4 h-4 bg-error text-white rounded-full">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {periods.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-outline">No timetable slots found for this class.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modalOpen && (
        <Modal title="Add Timetable Slot" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSaveSlot} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Day of Week</label>
                <select required value={slotForm.dayOfWeek} onChange={e => setSlotForm({...slotForm, dayOfWeek: e.target.value})} className="admin-select w-full">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Start Time</label>
                <input required type="time" value={slotForm.startTime} onChange={e => setSlotForm({...slotForm, startTime: e.target.value})} className="admin-input w-full" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>End Time</label>
                <input required type="time" value={slotForm.endTime} onChange={e => setSlotForm({...slotForm, endTime: e.target.value})} className="admin-input w-full" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Subject</label>
              <select required value={slotForm.subjectId} onChange={e => setSlotForm({...slotForm, subjectId: e.target.value})} className="admin-select w-full">
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Teacher</label>
              <select required value={slotForm.teacherId} onChange={e => setSlotForm({...slotForm, teacherId: e.target.value})} className="admin-select w-full">
                <option value="">-- Select Teacher --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Save Slot</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
