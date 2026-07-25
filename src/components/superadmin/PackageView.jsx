import { useState } from 'react';

const initialPackages = [
  { id: 1, name: 'Starter', price: 49, billing: '/month', students: 500, storage: '10 GB', features: ['Attendance', 'Fee Collection', 'Student Management', 'Parent Portal'], status: 'Active', schools: 245 },
  { id: 2, name: 'Growth', price: 149, billing: '/month', students: 2000, storage: '50 GB', features: ['All Starter features', 'HR Management', 'Transport', 'Library', 'Exam Management'], status: 'Active', schools: 580, popular: true },
  { id: 3, name: 'Enterprise', price: 299, billing: '/month', students: 'Unlimited', storage: '200 GB', features: ['All Growth features', 'API Access', 'White-label', 'Priority Support', 'Custom Integrations', 'Multi-branch'], status: 'Active', schools: 155 },
  { id: 4, name: 'Trial', price: 0, billing: '14 days', students: 100, storage: '2 GB', features: ['Attendance', 'Student Management', 'Basic Reports'], status: 'Active', schools: 89 },
];

export default function PackageView({ dark, setToast }) {
  const [packages, setPackages] = useState(initialPackages);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', students: '', storage: '' });

  const openEdit = (pkg) => { setForm({ name: pkg.name, price: pkg.price, students: pkg.students, storage: pkg.storage }); setEditing(pkg); };

  const handleSave = (e) => {
    e.preventDefault();
    setPackages(packages.map(p => p.id === editing.id ? { ...p, name: form.name, price: Number(form.price), students: form.students, storage: form.storage } : p));
    setToast?.({ message: `${form.name} package updated`, type: 'success' });
    setEditing(null);
  };

  const toggleStatus = (pkg) => {
    const next = pkg.status === 'Active' ? 'Inactive' : 'Active';
    setPackages(packages.map(p => p.id === pkg.id ? { ...p, status: next } : p));
    setToast?.({ message: `${pkg.name} ${next === 'Active' ? 'activated' : 'deactivated'}`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span>Packages</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#006b5c] font-medium">Package</span>
          </div>
          <h1 className="text-2xl font-bold">Subscription Packages</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage pricing plans and feature sets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {packages.map(pkg => (
          <div key={pkg.id} className={`rounded-2xl border p-5 flex flex-col relative transition-all hover:shadow-md ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'} ${pkg.popular ? 'ring-2 ring-[#006b5c]' : ''}`}>
            {pkg.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#006b5c] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>}
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold">{pkg.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pkg.status === 'Active' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#9d4224]/10 text-[#9d4224]'}`}>{pkg.status}</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">${pkg.price}</span>
              <span className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{pkg.billing}</span>
            </div>
            <div className={`text-xs space-y-1 mb-4 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
              <p><span className="font-semibold text-[#006b5c]">{pkg.students}</span> students</p>
              <p><span className="font-semibold text-[#006b5c]">{pkg.storage}</span> storage</p>
              <p><span className="font-semibold text-[#006b5c]">{pkg.schools}</span> active schools</p>
            </div>
            <ul className="flex-1 space-y-1.5 mb-4">
              {pkg.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-[#006b5c] text-[14px]">check</span>{f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => openEdit(pkg)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>Edit</button>
              <button onClick={() => toggleStatus(pkg)} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${pkg.status === 'Active' ? 'bg-[#9d4224]/10 text-[#9d4224] hover:bg-[#9d4224]/20' : 'bg-[#006b5c]/10 text-[#006b5c] hover:bg-[#006b5c]/20'}`}>
                {pkg.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Edit {editing.name} Package</h3>
              <button onClick={() => setEditing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Package Name</label><input className="sa-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Price ($)</label><input type="number" className="sa-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Student Limit</label><input className="sa-input" value={form.students} onChange={e => setForm({ ...form, students: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Storage</label><input className="sa-input" value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} /></div>
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
