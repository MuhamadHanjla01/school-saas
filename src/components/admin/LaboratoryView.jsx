import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function LaboratoryView({ dark }) {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: null, item: '', category: 'Physics', quantity: 1, status: 'Good Condition' });

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/laboratory`, { withCredentials: true });
      setInventory(res.data);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to fetch inventory', type: 'error' });
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAddModal = () => {
    setForm({ id: null, name: '', category: 'Physics', quantity: 1, status: 'Good Condition' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/laboratory`, form, { withCredentials: true });
      setToast({ message: form.id ? 'Item updated successfully' : 'Item added successfully', type: 'success' });
      setModalOpen(false);
      fetchInventory();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to save item', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/laboratory/${id}`, { withCredentials: true });
      setToast({ message: 'Item deleted', type: 'success' });
      fetchInventory();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to delete item', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = inventory.filter(r => 
    r.name?.toLowerCase().includes(q) || r.itemId?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q)
  );

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Laboratory Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage lab equipment, chemicals, and inventory.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search inventory..." />
          </div>
          <button onClick={openAddModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>science</span>
            Add Item
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4 w-24">Item ID</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Lab / Category</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-outline">No items found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-mono font-semibold">{r.itemId}</td>
                  <td className="py-3 px-4 font-bold">{r.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${dark ? 'bg-[#2f3133] text-[#bbcac4]' : 'bg-surface-container-high text-on-surface'}`}>{r.category}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold">{r.quantity}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-semibold ${r.status.includes('Low') || r.status.includes('Needs') ? 'text-error' : 'text-primary'}`}>{r.status}</span>
                  </td>
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
        <Modal title={form.id ? 'Edit Lab Item' : 'Add Lab Item'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Item Name</label>
              <input required type="text" value={form.name || form.item || ''} onChange={e => setForm({...form, name: e.target.value})} className="admin-input w-full" placeholder="e.g. Bunsen Burner" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Category</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-select w-full">
                  {['Physics', 'Chemistry', 'Biology', 'Computer Science', 'Chemicals', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Quantity</label>
                <input required type="number" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} className="admin-input w-full" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Condition / Status</label>
              <input required type="text" value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="admin-input w-full" placeholder="e.g. Good Condition, Low Stock" />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">{form.id ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
