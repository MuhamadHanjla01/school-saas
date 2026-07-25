import { useState } from 'react';
import { Modal, Toast } from './AdminUI';

const INITIAL_RECORDS = [
  { id: 'HR-001', student: 'S1029 (Aarav Sharma)', bloodGroup: 'B+', allergies: 'Peanuts', lastCheckup: '2024-03-12', notes: 'Asthma inhaler required before sports.' },
  { id: 'HR-002', student: 'S1102 (Emma Watson)', bloodGroup: 'O+', allergies: 'None', lastCheckup: '2024-01-05', notes: 'Fit for all activities.' },
  { id: 'HR-003', student: 'S1055 (Michael Chang)', bloodGroup: 'A-', allergies: 'Dust', lastCheckup: '2024-05-20', notes: 'Mild eczema.' },
];

export default function HealthRecordsView({ dark }) {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: null, student: '', bloodGroup: 'A+', allergies: 'None', lastCheckup: '', notes: '' });

  const openAddModal = () => {
    setForm({ id: null, student: '', bloodGroup: 'A+', allergies: 'None', lastCheckup: new Date().toISOString().split('T')[0], notes: '' });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (form.id) {
      setRecords(records.map(r => r.id === form.id ? { ...r, ...form } : r));
      setToast({ message: 'Record updated successfully', type: 'success' });
    } else {
      const newRecord = {
        id: `HR-00${records.length + 1}`,
        ...form
      };
      setRecords([...records, newRecord]);
      setToast({ message: 'Record added successfully', type: 'success' });
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this health record?')) return;
    setRecords(records.filter(r => r.id !== id));
    setToast({ message: 'Record deleted', type: 'success' });
  };

  const q = search.toLowerCase();
  const filtered = records.filter(r => 
    r.student.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
  );

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Health Records</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage student medical history and checkups.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search students..." />
          </div>
          <button onClick={openAddModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>medical_services</span>
            Add Record
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4 w-24">Record ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">Blood Group</th>
                <th className="py-3 px-4">Allergies</th>
                <th className="py-3 px-4">Last Checkup</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-outline">No records found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-mono font-semibold">{r.id}</td>
                  <td className="py-3 px-4 font-bold">{r.student}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-error text-white font-bold rounded-lg shadow-sm">{r.bloodGroup}</span>
                  </td>
                  <td className="py-3 px-4">{r.allergies}</td>
                  <td className="py-3 px-4">{r.lastCheckup}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => { setForm(r); setModalOpen(true); }} className="text-primary text-[11px] font-semibold hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-error text-[11px] font-semibold hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal title={form.id ? 'Edit Health Record' : 'Add Health Record'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Student (ID or Name)</label>
              <input required type="text" value={form.student} onChange={e => setForm({...form, student: e.target.value})} className="admin-input w-full" placeholder="e.g. S1025 (John Doe)" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Blood Group</label>
                <select required value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className="admin-select w-full">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Last Checkup</label>
                <input required type="date" value={form.lastCheckup} onChange={e => setForm({...form, lastCheckup: e.target.value})} className="admin-input w-full" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Allergies</label>
              <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} className="admin-input w-full" placeholder="e.g. Peanuts, None" />
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="admin-input w-full h-20" placeholder="Any special medical conditions..." />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">{form.id ? 'Save Changes' : 'Add Record'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
