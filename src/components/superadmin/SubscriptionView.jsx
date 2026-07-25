import { useState } from 'react';

const initialSubs = [
  { id: 1, school: "St. Mary's International", plan: 'Enterprise', price: '$299/mo', start: 'Jan 1, 2024', renewal: 'Jan 1, 2025', status: 'Active' },
  { id: 2, school: 'Greenwood Academy', plan: 'Growth', price: '$149/mo', start: 'Mar 15, 2024', renewal: 'Mar 15, 2025', status: 'Active' },
  { id: 3, school: 'Oakridge Academy', plan: 'Enterprise', price: '$299/mo', start: 'Sep 1, 2023', renewal: 'Sep 1, 2024', status: 'Expiring' },
  { id: 4, school: 'Maplewood Prep', plan: 'Growth', price: '$149/mo', start: 'Jun 1, 2024', renewal: 'Jun 1, 2025', status: 'Active' },
  { id: 5, school: 'Sunrise Valley High', plan: 'Trial', price: 'Free', start: 'Oct 20, 2024', renewal: 'Nov 3, 2024', status: 'Trial' },
  { id: 6, school: "St. Jude's Boarding", plan: 'Starter', price: '$49/mo', start: 'Feb 1, 2024', renewal: 'Feb 1, 2025', status: 'Suspended' },
  { id: 7, school: 'Pine Hill Academy', plan: 'Growth', price: '$149/mo', start: 'Apr 1, 2024', renewal: 'Apr 1, 2025', status: 'Active' },
  { id: 8, school: 'Heritage School', plan: 'Starter', price: '$49/mo', start: 'May 10, 2024', renewal: 'May 10, 2025', status: 'Expired' },
];

const statusColors = { Active: 'bg-[#006b5c]/10 text-[#006b5c]', Expiring: 'bg-[#9d4224]/10 text-[#9d4224]', Trial: 'bg-[#0060ac]/10 text-[#0060ac]', Suspended: 'bg-[#ba1a1a]/10 text-[#ba1a1a]', Expired: 'bg-[#6c7a76]/10 text-[#6c7a76]' };

export default function SubscriptionView({ dark, setToast }) {
  const [subs, setSubs] = useState(initialSubs);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewing, setViewing] = useState(null);

  const filtered = subs.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.school.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCancel = (sub) => {
    if (!window.confirm(`Cancel subscription for ${sub.school}?`)) return;
    setSubs(subs.map(s => s.id === sub.id ? { ...s, status: 'Expired' } : s));
    setToast?.({ message: `Subscription for ${sub.school} cancelled`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Packages</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Subscription</span>
        </div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Track and manage active school subscriptions.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Active', value: subs.filter(s => s.status === 'Active').length, icon: 'check_circle', color: '#006b5c' },
          { label: 'Trial', value: subs.filter(s => s.status === 'Trial').length, icon: 'hourglass_top', color: '#0060ac' },
          { label: 'Expiring', value: subs.filter(s => s.status === 'Expiring').length, icon: 'warning', color: '#9d4224' },
          { label: 'Expired', value: subs.filter(s => ['Expired', 'Suspended'].includes(s.status)).length, icon: 'cancel', color: '#ba1a1a' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}>
              <span className="material-symbols-outlined">{kpi.icon}</span>
            </div>
            <div>
              <p className={`text-[10px] font-bold tracking-wider uppercase ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p>
              <h3 className="text-xl font-bold">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subscriptions..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sa-select">
            <option>All</option><option>Active</option><option>Trial</option><option>Expiring</option><option>Suspended</option><option>Expired</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">School</th><th className="px-6 py-3">Plan</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Renewal</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{s.school}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}>{s.plan}</span></td>
                  <td className="px-6 py-3 text-sm font-medium">{s.price}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{s.renewal}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[s.status]}`}>{s.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewing(s)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                      {s.status === 'Active' && <button onClick={() => handleCancel(s)} className="p-1.5 rounded-lg hover:bg-[#ffdad6]/40 text-[#ba1a1a]"><span className="material-symbols-outlined text-[18px]">cancel</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 text-sm border-t ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#e2e2e5] text-[#6c7a76]'}`}>
          Showing {filtered.length} of {subs.length} subscriptions
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Subscription Details</h3>
              <button onClick={() => setViewing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-3">
              {[['School', viewing.school], ['Plan', viewing.plan], ['Price', viewing.price], ['Start Date', viewing.start], ['Renewal Date', viewing.renewal], ['Status', viewing.status]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className={dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}>{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
