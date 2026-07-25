import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function SubjectsView({ dark }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', code: '', description: '' });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setForm({ id: null, name: '', code: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (sub) => {
    setForm({ id: sub.id, name: sub.name, code: sub.code, description: sub.description || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (form.id) {
        await axios.put(`http://localhost:3000/api/subjects/${form.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Subject updated successfully', type: 'success' });
      } else {
        await axios.post('http://localhost:3000/api/subjects', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Subject added successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to save subject', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Subject deleted', type: 'success' });
      fetchSubjects();
    } catch (err) {
      setToast({ message: 'Failed to delete subject', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = subjects.filter(s => 
    s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
  );

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Subjects</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage academic subjects and curriculum.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search subjects..." />
          </div>
          <button onClick={openAddModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add Subject
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4 w-32">Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-outline">Loading subjects...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-outline">No subjects found.</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-mono font-semibold">{s.code}</td>
                  <td className="py-3 px-4 font-semibold">{s.name}</td>
                  <td className={`py-3 px-4 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{s.description || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEditModal(s)} className="text-primary text-[11px] font-semibold hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-error text-[11px] font-semibold hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal title={form.id ? 'Edit Subject' : 'Add Subject'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Subject Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="admin-input w-full" placeholder="e.g. Advanced Mathematics" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Subject Code</label>
                <input required type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="admin-input w-full uppercase" placeholder="MATH201" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Description (Optional)</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="admin-input w-full h-24" placeholder="Brief description of the subject..." />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">{form.id ? 'Save Changes' : 'Add Subject'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
