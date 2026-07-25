import { useState } from 'react';

const initialAddons = [
  { id: 1, name: 'SMS Pack', description: '5,000 SMS credits for notifications', price: 29, billing: '/month', category: 'Communication', status: 'Active', subscribers: 312 },
  { id: 2, name: 'Extra Storage', description: 'Additional 50 GB cloud storage', price: 19, billing: '/month', category: 'Infrastructure', status: 'Active', subscribers: 198 },
  { id: 3, name: 'API Access', description: 'REST API with 10k requests/day', price: 49, billing: '/month', category: 'Developer', status: 'Active', subscribers: 87 },
  { id: 4, name: 'White-label', description: 'Custom branding and domain', price: 99, billing: '/month', category: 'Branding', status: 'Active', subscribers: 45 },
  { id: 5, name: 'Priority Support', description: '24/7 dedicated support agent', price: 39, billing: '/month', category: 'Support', status: 'Active', subscribers: 156 },
  { id: 6, name: 'Advanced Analytics', description: 'Custom dashboards and reports', price: 59, billing: '/month', category: 'Analytics', status: 'Inactive', subscribers: 0 },
];

export default function AddonsView({ dark, setToast }) {
  const [addons, setAddons] = useState(initialAddons);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });

  const filtered = addons.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = (addon) => {
    const next = addon.status === 'Active' ? 'Inactive' : 'Active';
    setAddons(addons.map(a => a.id === addon.id ? { ...a, status: next } : a));
    setToast?.({ message: `${addon.name} ${next === 'Active' ? 'enabled' : 'disabled'}`, type: 'success' });
  };

  const openEdit = (addon) => { setForm({ name: addon.name, description: addon.description, price: addon.price, category: addon.category }); setEditing(addon); };

  const handleSave = (e) => {
    e.preventDefault();
    setAddons(addons.map(a => a.id === editing.id ? { ...a, ...form, price: Number(form.price) } : a));
    setToast?.({ message: `${form.name} updated`, type: 'success' });
    setEditing(null);
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Packages</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Addons</span>
        </div>
        <h1 className="text-2xl font-bold">Addon Modules</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage optional add-on modules for subscription plans.</p>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search addons..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Addon</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Subscribers</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3"><p className="font-semibold text-sm">{a.name}</p><p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{a.description}</p></td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? 'bg-[#3c4a46] text-[#bbcac4]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>{a.category}</span></td>
                  <td className="px-6 py-3 text-sm font-semibold">${a.price}{a.billing}</td>
                  <td className="px-6 py-3 text-sm">{a.subscribers}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.status === 'Active' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#9d4224]/10 text-[#9d4224]'}`}>{a.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(a)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">edit</span></button>
                      <button onClick={() => toggleStatus(a)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">{a.status === 'Active' ? 'toggle_on' : 'toggle_off'}</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Edit Addon</h3>
              <button onClick={() => setEditing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Name</label><input className="sa-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Description</label><input className="sa-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Price ($)</label><input type="number" className="sa-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
