import { useState } from 'react';

const initialTransactions = [
  { id: 'TXN-001', school: 'Oakridge Academy', amount: 299, method: 'Credit Card', date: 'Oct 24, 2024', status: 'Completed', invoice: 'INV-2024-001' },
  { id: 'TXN-002', school: 'Maplewood Prep', amount: 149, method: 'Bank Transfer', date: 'Oct 23, 2024', status: 'Completed', invoice: 'INV-2024-002' },
  { id: 'TXN-003', school: 'Sunrise Valley High', amount: 49, method: 'Credit Card', date: 'Oct 22, 2024', status: 'Pending', invoice: 'INV-2024-003' },
  { id: 'TXN-004', school: "St. Jude's Boarding", amount: 49, method: 'UPI', date: 'Oct 21, 2024', status: 'Failed', invoice: 'INV-2024-004' },
  { id: 'TXN-005', school: 'Pine Hill Academy', amount: 149, method: 'Credit Card', date: 'Oct 20, 2024', status: 'Completed', invoice: 'INV-2024-005' },
  { id: 'TXN-006', school: 'Heritage School', amount: 49, method: 'Bank Transfer', date: 'Oct 19, 2024', status: 'Refunded', invoice: 'INV-2024-006' },
  { id: 'TXN-007', school: "St. Mary's International", amount: 299, method: 'Credit Card', date: 'Oct 18, 2024', status: 'Completed', invoice: 'INV-2024-007' },
  { id: 'TXN-008', school: 'Greenwood Academy', amount: 149, method: 'Wallet', date: 'Oct 17, 2024', status: 'Completed', invoice: 'INV-2024-008' },
  { id: 'TXN-009', school: 'Lakeside Grammar', amount: 299, method: 'Credit Card', date: 'Oct 16, 2024', status: 'Completed', invoice: 'INV-2024-009' },
  { id: 'TXN-010', school: 'Riverside Academy', amount: 149, method: 'Bank Transfer', date: 'Oct 15, 2024', status: 'Pending', invoice: 'INV-2024-010' },
];

const statusColors = { Completed: 'bg-[#006b5c]/10 text-[#006b5c]', Pending: 'bg-[#0060ac]/10 text-[#0060ac]', Failed: 'bg-[#ba1a1a]/10 text-[#ba1a1a]', Refunded: 'bg-[#9d4224]/10 text-[#9d4224]' };

export default function TransactionsView({ dark, setToast }) {
  const [transactions] = useState(initialTransactions);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewing, setViewing] = useState(null);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = t.school.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = transactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Packages</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Transactions</span>
          </div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Payment history and transaction records.</p>
        </div>
        <button onClick={() => setToast?.({ message: 'Transactions exported as CSV', type: 'success' })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
          <span className="material-symbols-outlined text-[18px]">download</span> Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: 'account_balance', color: '#006b5c' },
          { label: 'This Month', value: `$${totalRevenue.toLocaleString()}`, icon: 'calendar_month', color: '#0060ac' },
          { label: 'Pending', value: transactions.filter(t => t.status === 'Pending').length, icon: 'hourglass_top', color: '#9d4224' },
          { label: 'Refunds', value: transactions.filter(t => t.status === 'Refunded').length, icon: 'undo', color: '#ba1a1a' }
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
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sa-select">
            <option>All</option><option>Completed</option><option>Pending</option><option>Failed</option><option>Refunded</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Transaction ID</th><th className="px-6 py-3">School</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 text-sm font-mono font-medium">{t.id}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{t.school}</td>
                  <td className="px-6 py-3 text-sm font-bold">${t.amount}</td>
                  <td className="px-6 py-3 text-sm">{t.method}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{t.date}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[t.status]}`}>{t.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => setViewing(t)} className="text-[#006b5c] font-semibold text-xs hover:underline">View Receipt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 text-sm border-t ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#e2e2e5] text-[#6c7a76]'}`}>
          Showing {filtered.length} of {transactions.length} transactions
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Receipt — {viewing.id}</h3>
              <button onClick={() => setViewing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-3">
              {[['Invoice', viewing.invoice], ['School', viewing.school], ['Amount', `$${viewing.amount}`], ['Method', viewing.method], ['Date', viewing.date], ['Status', viewing.status]].map(([k, v]) => (
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
