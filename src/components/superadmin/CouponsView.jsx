import { useState } from 'react';

const initialCoupons = [
  { id: 1, code: 'WELCOME20', discount: 20, type: 'Percentage', validFrom: 'Jan 1, 2024', validTo: 'Dec 31, 2024', used: 145, limit: 500, status: 'Active' },
  { id: 2, code: 'EDUFIRST50', discount: 50, type: 'Fixed ($)', validFrom: 'Mar 1, 2024', validTo: 'Jun 30, 2024', used: 89, limit: 200, status: 'Active' },
  { id: 3, code: 'GROWTH15', discount: 15, type: 'Percentage', validFrom: 'Apr 1, 2024', validTo: 'Sep 30, 2024', used: 67, limit: 100, status: 'Active' },
  { id: 4, code: 'LAUNCH100', discount: 100, type: 'Fixed ($)', validFrom: 'Jan 1, 2024', validTo: 'Mar 31, 2024', used: 200, limit: 200, status: 'Expired' },
  { id: 5, code: 'REFER10', discount: 10, type: 'Percentage', validFrom: 'Jun 1, 2024', validTo: 'Dec 31, 2024', used: 34, limit: 1000, status: 'Active' },
];

export default function CouponsView({ dark, setToast }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', type: 'Percentage', validFrom: '', validTo: '', limit: '' });

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setCoupons([{ id: Date.now(), ...form, discount: Number(form.discount), limit: Number(form.limit), used: 0, status: 'Active' }, ...coupons]);
    setToast?.({ message: `Coupon ${form.code} created`, type: 'success' });
    setShowModal(false);
    setForm({ code: '', discount: '', type: 'Percentage', validFrom: '', validTo: '', limit: '' });
  };

  const toggleStatus = (coupon) => {
    const next = coupon.status === 'Active' ? 'Inactive' : 'Active';
    setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, status: next } : c));
    setToast?.({ message: `${coupon.code} ${next === 'Active' ? 'activated' : 'deactivated'}`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Packages</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Coupons & Discounts</span>
          </div>
          <h1 className="text-2xl font-bold">Coupons & Discounts</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Create and manage promotional discount codes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span> Create Coupon
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Code</th><th className="px-6 py-3">Discount</th><th className="px-6 py-3">Validity</th><th className="px-6 py-3">Usage</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3"><span className="font-mono font-bold text-sm bg-[#006b5c]/10 text-[#006b5c] px-2.5 py-1 rounded-lg">{c.code}</span></td>
                  <td className="px-6 py-3 text-sm font-semibold">{c.type === 'Percentage' ? `${c.discount}%` : `$${c.discount}`}</td>
                  <td className={`px-6 py-3 text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{c.validFrom} — {c.validTo}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.used}/{c.limit}</span>
                      <div className={`w-16 h-1.5 rounded-full ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}>
                        <div className="bg-[#006b5c] h-1.5 rounded-full" style={{ width: `${(c.used / c.limit) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.status === 'Active' ? 'bg-[#006b5c]/10 text-[#006b5c]' : c.status === 'Expired' ? 'bg-[#6c7a76]/10 text-[#6c7a76]' : 'bg-[#9d4224]/10 text-[#9d4224]'}`}>{c.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => toggleStatus(c)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
                      {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Create Coupon</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Coupon Code</label><input className="sa-input font-mono uppercase" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="e.g. SUMMER25" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold mb-1.5">Discount</label><input type="number" className="sa-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} required /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Type</label><select className="sa-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Percentage</option><option>Fixed ($)</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold mb-1.5">Valid From</label><input type="date" className="sa-input" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} /></div>
                <div><label className="block text-sm font-semibold mb-1.5">Valid To</label><input type="date" className="sa-input" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-semibold mb-1.5">Usage Limit</label><input type="number" className="sa-input" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} placeholder="500" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
