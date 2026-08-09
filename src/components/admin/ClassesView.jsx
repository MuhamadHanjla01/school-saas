import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function ClassesView({ dark }) {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', room: '', classTeacherId: '' });

  const fetchClasses = async () => {
    try {
      const res = await axios.get('https://erpzo-backend.onrender.com/api/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('https://erpzo-backend.onrender.com/api/teachers');
      setTeachers(res.data.teachers);
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchClasses(), fetchTeachers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({ name: cls.name, room: cls.room, classTeacherId: cls.teacherId || '' });
    } else {
      setEditingClass(null);
      setFormData({ name: '', room: '', classTeacherId: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await axios.put(`https://erpzo-backend.onrender.com/api/classes/${editingClass.id}`, formData);
        setToast({ message: 'Class updated successfully', type: 'success' });
      } else {
        await axios.post('https://erpzo-backend.onrender.com/api/classes', formData);
        setToast({ message: 'Class created successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchClasses();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Operation failed', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = classes.filter(c => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q));

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px]">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Classes & Sections</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage class sections, teacher assignments, and subjects.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Add Class
        </button>
      </section>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl w-full max-w-md" placeholder="Search classes or teachers..." />
      </div>

      {loading ? (
        <div className="py-8 text-center text-outline">Loading classes...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-outline">No classes found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cls, i) => (
            <div key={cls.id || cls.name} className={`admin-card admin-row-enter p-5 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}
              style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[16px] font-bold">{cls.name}</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${dark ? 'bg-[#3c4a46] text-[#bbcac4]' : 'bg-surface-container-low text-on-surface-variant'}`}>{cls.room}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>person</span>
                <span className="text-[12px] font-medium">{cls.teacher}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>group</span>
                <span className={`text-[12px] ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{cls.students} Students</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cls.subjects && cls.subjects.map(sub => (
                  <span key={sub} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${dark ? 'bg-primary/10 text-primary-container' : 'bg-primary/5 text-primary'}`}>{sub}</span>
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t flex justify-end ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/30'}`}>
                <button onClick={() => handleOpenModal(cls)} className="text-primary text-[11px] font-semibold hover:underline mr-3">Edit</button>
                <button className="text-outline text-[11px] font-semibold hover:underline">Timetable</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editingClass ? "Edit Class" : "Add Class"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Class Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="admin-input w-full" placeholder="e.g. 10-A" />
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Room</label>
              <input required type="text" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="admin-input w-full" placeholder="e.g. Room 101" />
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Class Teacher</label>
              <select value={formData.classTeacherId} onChange={e => setFormData({ ...formData, classTeacherId: e.target.value })} className="admin-select w-full">
                <option value="">-- Unassigned --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                ))}
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">
                {editingClass ? 'Save Changes' : 'Add Class'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
