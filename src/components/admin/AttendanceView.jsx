import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function AttendanceView({ dark }) {
  const [filter, setFilter] = useState('All');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // studentId -> status
  const [toast, setToast] = useState(null);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/attendance/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleOpenModal = async () => {
    setModalOpen(true);
    if (classes.length === 0) {
      try {
        const res = await axios.get('https://school-backend-70ny.onrender.com/api/classes');
        setClasses(res.data.classes);
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    }
  };

  const handleClassSelect = async (classId) => {
    setSelectedClass(classId);
    if (!classId) {
      setStudents([]);
      return;
    }
    try {
      const res = await axios.get(`https://school-backend-70ny.onrender.com/api/classes/${classId}`);
      const studs = res.data.class.students || [];
      setStudents(studs);
      
      // Default everyone to present
      const defaultData = {};
      studs.forEach(s => {
        defaultData[s.id] = 'Present';
      });
      setAttendanceData(defaultData);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClass || students.length === 0) {
      setToast({ message: 'Select a class with students first', type: 'error' });
      return;
    }
    
    const records = Object.keys(attendanceData).map(studentId => ({
      studentId,
      status: attendanceData[studentId]
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://school-backend-70ny.onrender.com/api/attendance', {
        records,
        date: selectedDate,
        classId: selectedClass
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Attendance marked successfully', type: 'success' });
      setModalOpen(false);
      fetchAttendance(); // refresh summary
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to mark attendance', type: 'error' });
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-outline">Loading attendance data...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-error">Failed to load attendance data.</div>;
  }

  const { overall, summary, weeklyTrend } = data;

  const filteredSummary = summary.filter(row => {
    if (filter === 'All') return true;
    if (filter === 'Grade 9') return row.class.startsWith('9');
    if (filter === 'Grade 10') return row.class.startsWith('10');
    if (filter === 'Grade 11') return row.class.startsWith('11');
    if (filter === 'Grade 12') return row.class.startsWith('12');
    return true;
  });

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px]">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Attendance</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Today's attendance overview across all classes.</p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="admin-select h-10 px-3">
            <option>All</option>
            <option>Grade 9</option>
            <option>Grade 10</option>
            <option>Grade 11</option>
            <option>Grade 12</option>
          </select>
          <button onClick={handleOpenModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fact_check</span>
            Mark Attendance
          </button>
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 admin-section-animate" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Overall Rate', value: overall.rate, icon: 'trending_up', color: '#006b5c' },
          { label: 'Total Present', value: String(overall.present), icon: 'check_circle', color: '#006b5c' },
          { label: 'Total Absent', value: String(overall.absent), icon: 'cancel', color: '#ba1a1a' },
          { label: 'Late Arrivals', value: String(overall.late), icon: 'schedule', color: '#9d4224' },
        ].map((s, i) => (
          <div key={s.label} className={`admin-card p-3.5 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-surface-container-high'}`}
            style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-[10px] uppercase tracking-[0.08em] font-semibold ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{s.label}</p>
                <h3 className="text-lg font-bold mt-1">{s.value}</h3>
              </div>
              <div className="p-2 rounded-xl" style={{ background: `${s.color}12`, color: s.color }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Class-wise Table */}
        <section className={`xl:col-span-2 admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
          <div className="p-4 pb-2">
            <h4 className="text-[15px] font-semibold">Class-wise Attendance</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
                <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4">Present</th>
                  <th className="py-2.5 px-4">Absent</th>
                  <th className="py-2.5 px-4">Late</th>
                  <th className="py-2.5 px-4">Rate</th>
                  <th className="py-2.5 px-4">Progress</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {filteredSummary.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-outline">No attendance data found for this grade.</td></tr>
                ) : filteredSummary.map((row, i) => (
                  <tr key={row.class} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                    style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="py-2.5 px-4 font-semibold">Class {row.class}</td>
                    <td className="py-2.5 px-4 text-primary font-bold">{row.present}</td>
                    <td className="py-2.5 px-4 text-error font-bold">{row.absent}</td>
                    <td className="py-2.5 px-4 text-tertiary font-bold">{row.late}</td>
                    <td className="py-2.5 px-4 font-bold">{row.rate}</td>
                    <td className="py-2.5 px-4">
                      <div className={`w-full max-w-[100px] rounded-full h-1.5 ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container'}`}>
                        <div className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full" style={{ width: row.rate }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Weekly Trend */}
        <section className={`admin-card p-4 rounded-xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
          <h4 className="text-[15px] font-semibold mb-4">Weekly Trend</h4>
          <div className="space-y-4">
            {weeklyTrend.length === 0 ? (
              <p className="text-[12px] text-outline text-center">No trend data available.</p>
            ) : weeklyTrend.map((d, i) => (
              <div key={d.day} className="admin-row-enter" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold">{d.day}</span>
                  <span className="text-[11px] font-bold text-primary">{d.rate}%</span>
                </div>
                <div className={`w-full rounded-full h-2 ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container'}`}>
                  <div className={`h-full rounded-full transition-all duration-700 ${d.rate >= 95 ? 'bg-primary' : d.rate >= 92 ? 'bg-primary-container' : 'bg-tertiary-container'}`}
                    style={{ width: `${d.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mark Attendance Modal */}
      {modalOpen && (
        <Modal title="Mark Attendance" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSaveAttendance} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Class</label>
                <select required value={selectedClass} onChange={e => handleClassSelect(e.target.value)} className="admin-select w-full">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Date</label>
                <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="admin-input w-full" />
              </div>
            </div>

            {selectedClass && students.length === 0 && (
              <p className="text-[12px] text-error">No students found in this class.</p>
            )}

            {students.length > 0 && (
              <div className="mt-4 border rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto admin-scrollbar">
                <table className="w-full text-left">
                  <thead className={`sticky top-0 ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container-low'}`}>
                    <tr className="text-[11px] uppercase tracking-wider text-outline">
                      <th className="p-2 pl-4">Student</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className={`border-t ${dark ? 'border-[#3c4a46]/50' : 'border-outline-variant/30'}`}>
                        <td className="p-2 pl-4 text-[13px] font-semibold">{s.name} <span className="text-[10px] text-outline ml-2">{s.studentId}</span></td>
                        <td className="p-2">
                          <div className="flex justify-center gap-2">
                            {['Present', 'Absent', 'Late'].map(status => (
                              <label key={status} className={`flex items-center gap-1 cursor-pointer text-[12px] ${attendanceData[s.id] === status ? (status === 'Present' ? 'text-primary font-bold' : status === 'Absent' ? 'text-error font-bold' : 'text-tertiary font-bold') : 'text-outline'}`}>
                                <input 
                                  type="radio" 
                                  name={`status-${s.id}`} 
                                  value={status}
                                  checked={attendanceData[s.id] === status}
                                  onChange={() => setAttendanceData(prev => ({...prev, [s.id]: status}))}
                                  className="hidden"
                                />
                                <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${attendanceData[s.id] === status ? (status === 'Present' ? 'border-primary bg-primary' : status === 'Absent' ? 'border-error bg-error' : 'border-tertiary bg-tertiary') : 'border-outline'}`}>
                                </span>
                                {status}
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">
                Save Attendance
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
