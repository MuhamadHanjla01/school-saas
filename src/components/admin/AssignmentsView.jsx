import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function AssignmentsView({ dark }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: null, title: '', description: '', dueDate: '', classId: '', subjectId: '', teacherId: '' });
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [resClasses, resSubjects, resTeachers] = await Promise.all([
          axios.get('https://school-backend-70ny.onrender.com/api/classes'),
          axios.get('https://school-backend-70ny.onrender.com/api/subjects'),
          axios.get('https://school-backend-70ny.onrender.com/api/teachers')
        ]);
        setClasses(resClasses.data.classes || []);
        setSubjects(resSubjects.data.subjects || []);
        setTeachers(resTeachers.data.teachers || []);
      } catch (err) {
        console.error('Failed to fetch prerequisites', err);
      }
    };
    fetchInitial();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/assignments');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openAddModal = () => {
    setForm({ id: null, title: '', description: '', dueDate: '', classId: '', subjectId: '', teacherId: '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(`https://school-backend-70ny.onrender.com/api/assignments/${form.id}`, form);
        setToast({ message: 'Assignment updated successfully', type: 'success' });
      } else {
        await axios.post('https://school-backend-70ny.onrender.com/api/assignments', form);
        setToast({ message: 'Assignment created successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchAssignments();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to save assignment', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await axios.delete(`https://school-backend-70ny.onrender.com/api/assignments/${id}`);
      setToast({ message: 'Assignment deleted', type: 'success' });
      fetchAssignments();
    } catch (err) {
      setToast({ message: 'Failed to delete assignment', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = assignments.filter(a => 
    a.title.toLowerCase().includes(q) || 
    (a.class?.name && a.class.name.toLowerCase().includes(q)) ||
    (a.subject?.name && a.subject.name.toLowerCase().includes(q))
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Assignment Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Create and track student assignments and homework.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search assignments..." />
          </div>
          <button onClick={openAddModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Create Assignment
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Teacher</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-outline">Loading assignments...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-outline">No assignments found.</td></tr>
              ) : filtered.map((a, i) => (
                <tr key={a.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-semibold">{a.title}</td>
                  <td className="py-3 px-4">{a.class?.name || '—'}</td>
                  <td className="py-3 px-4">{a.subject?.name || '—'}</td>
                  <td className="py-3 px-4">{a.teacher?.name || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">{formatDate(a.dueDate)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'Active' ? 'bg-primary/10 text-primary' : a.status === 'Draft' ? 'bg-outline/10 text-outline' : 'bg-secondary/10 text-secondary'}`}>{a.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(a.id)} className="text-error text-[11px] font-semibold hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal title={form.id ? 'Edit Assignment' : 'Create Assignment'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Title</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="admin-input w-full" placeholder="e.g. Chapter 4 Exercises" />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Class</label>
                <select required value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="admin-select w-full">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Subject</label>
                <select required value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="admin-select w-full">
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Assigning Teacher</label>
                <select required value={form.teacherId} onChange={e => setForm({...form, teacherId: e.target.value})} className="admin-select w-full">
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Due Date</label>
                <input required type="datetime-local" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="admin-input w-full" />
              </div>
            </div>

            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Description / Instructions</label>
              <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="admin-input w-full h-24" placeholder="Assignment instructions..." />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">{form.id ? 'Save Changes' : 'Create Assignment'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
