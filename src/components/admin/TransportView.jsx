import { useState } from 'react';
import { Modal, Toast } from './AdminUI';

const INITIAL_ROUTES = [
  { id: 'R01', name: 'Downtown Express', bus: 'Bus-104', driver: 'John Smith', capacity: 40, enrolled: 35, fee: 150 },
  { id: 'R02', name: 'Westside Loop', bus: 'Bus-108', driver: 'Robert Doe', capacity: 30, enrolled: 30, fee: 120 },
  { id: 'R03', name: 'North Hills Route', bus: 'Bus-112', driver: 'William Clark', capacity: 50, enrolled: 22, fee: 180 },
];

export default function TransportView({ dark }) {
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: null, name: '', bus: '', driver: '', capacity: 40, fee: 150 });

  const openAddModal = () => {
    setForm({ id: null, name: '', bus: '', driver: '', capacity: 40, fee: 150 });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (form.id) {
      setRoutes(routes.map(r => r.id === form.id ? { ...r, ...form } : r));
      setToast({ message: 'Route updated successfully', type: 'success' });
    } else {
      const newRoute = {
        id: `R0${routes.length + 1}`,
        ...form,
        enrolled: 0
      };
      setRoutes([...routes, newRoute]);
      setToast({ message: 'Route added successfully', type: 'success' });
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this route?')) return;
    setRoutes(routes.filter(r => r.id !== id));
    setToast({ message: 'Route deleted', type: 'success' });
  };

  const q = search.toLowerCase();
  const filtered = routes.filter(r => 
    r.name.toLowerCase().includes(q) || r.bus.toLowerCase().includes(q) || r.driver.toLowerCase().includes(q)
  );

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Transport Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage school buses, routes, and drivers.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search routes..." />
          </div>
          <button onClick={openAddModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>directions_bus</span>
            Add Route
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4">Route Name</th>
                <th className="py-3 px-4">Bus & Driver</th>
                <th className="py-3 px-4 text-center">Capacity</th>
                <th className="py-3 px-4 text-center">Monthly Fee</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-outline">No routes found.</td></tr>
              ) : filtered.map((r, i) => {
                const full = r.enrolled >= r.capacity;
                const util = Math.round((r.enrolled / r.capacity) * 100);
                return (
                  <tr key={r.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                    style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="py-3 px-4">
                      <div className="font-bold flex items-center gap-2">
                        {r.name}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-black ${full ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                          {full ? 'FULL' : 'OPEN'}
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{r.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{r.bus}</div>
                      <div className={`text-[10px] ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{r.driver}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono">{r.enrolled} / {r.capacity}</div>
                      <div className="w-full bg-outline-variant/30 h-1.5 mt-1 rounded-full overflow-hidden">
                        <div className={`h-full ${full ? 'bg-error' : util > 80 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${util}%` }}></div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">${r.fee}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => { setForm(r); setModalOpen(true); }} className="text-primary text-[11px] font-semibold hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDelete(r.id)} className="text-error text-[11px] font-semibold hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal title={form.id ? 'Edit Route' : 'Add Route'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Route Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="admin-input w-full" placeholder="e.g. North Hills Route" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Bus Number</label>
                <input required type="text" value={form.bus} onChange={e => setForm({...form, bus: e.target.value})} className="admin-input w-full" placeholder="e.g. Bus-112" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Driver Name</label>
                <input required type="text" value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} className="admin-input w-full" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Capacity (Seats)</label>
                <input required type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} className="admin-input w-full" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Monthly Fee ($)</label>
                <input required type="number" value={form.fee} onChange={e => setForm({...form, fee: parseInt(e.target.value)})} className="admin-input w-full" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">{form.id ? 'Save Changes' : 'Add Route'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
