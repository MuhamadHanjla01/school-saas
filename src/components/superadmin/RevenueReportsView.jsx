import { useState } from 'react';

const monthlyData = [
  { month: 'Jan 2024', newRevenue: 12400, renewals: 38200, churned: 2100, net: 48500 },
  { month: 'Feb 2024', newRevenue: 15800, renewals: 39100, churned: 1800, net: 53100 },
  { month: 'Mar 2024', newRevenue: 18200, renewals: 40500, churned: 2400, net: 56300 },
  { month: 'Apr 2024', newRevenue: 14600, renewals: 41200, churned: 1500, net: 54300 },
  { month: 'May 2024', newRevenue: 22100, renewals: 42800, churned: 3200, net: 61700 },
  { month: 'Jun 2024', newRevenue: 19800, renewals: 43500, churned: 2800, net: 60500 },
  { month: 'Jul 2024', newRevenue: 25400, renewals: 44200, churned: 1900, net: 67700 },
  { month: 'Aug 2024', newRevenue: 28900, renewals: 45800, churned: 2100, net: 72600 },
  { month: 'Sep 2024', newRevenue: 31200, renewals: 46500, churned: 2500, net: 75200 },
  { month: 'Oct 2024', newRevenue: 27800, renewals: 47200, churned: 1800, net: 73200 },
  { month: 'Nov 2024', newRevenue: 33500, renewals: 48100, churned: 2200, net: 79400 },
  { month: 'Dec 2024', newRevenue: 35200, renewals: 49500, churned: 1600, net: 83100 },
];

export default function RevenueReportsView({ dark, setToast }) {
  const [data] = useState(monthlyData);
  const totalRevenue = data.reduce((sum, d) => sum + d.net, 0);
  const totalNew = data.reduce((sum, d) => sum + d.newRevenue, 0);
  const totalChurned = data.reduce((sum, d) => sum + d.churned, 0);

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Analytics</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Revenue Reports</span>
          </div>
          <h1 className="text-2xl font-bold">Revenue Reports</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Monthly revenue breakdown and growth tracking.</p>
        </div>
        <button onClick={() => setToast?.({ message: 'Revenue report exported', type: 'success' })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
          <span className="material-symbols-outlined text-[18px]">download</span> Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}k`, icon: 'account_balance', color: '#006b5c' },
          { label: 'MRR', value: `$${(data[data.length - 1].net / 1000).toFixed(1)}k`, icon: 'trending_up', color: '#0060ac' },
          { label: 'ARR', value: `$${((data[data.length - 1].net * 12) / 1000).toFixed(0)}k`, icon: 'calendar_month', color: '#006b5c' },
          { label: 'Churn Rate', value: `${((totalChurned / totalRevenue) * 100).toFixed(1)}%`, icon: 'trending_down', color: '#9d4224' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined">{kpi.icon}</span></div>
            <div><p className={`text-[10px] font-bold tracking-wider uppercase ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p><h3 className="text-xl font-bold">{kpi.value}</h3></div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Month</th><th className="px-6 py-3">New Revenue</th><th className="px-6 py-3">Renewals</th><th className="px-6 py-3">Churned</th><th className="px-6 py-3">Net Revenue</th><th className="px-6 py-3">Growth</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const prevNet = i > 0 ? data[i - 1].net : d.net;
                const growth = ((d.net - prevNet) / prevNet * 100).toFixed(1);
                return (
                  <tr key={d.month} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                    <td className="px-6 py-3 text-sm font-semibold">{d.month}</td>
                    <td className="px-6 py-3 text-sm text-[#006b5c] font-medium">${d.newRevenue.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm font-medium">${d.renewals.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-[#ba1a1a] font-medium">-${d.churned.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm font-bold">${d.net.toLocaleString()}</td>
                    <td className="px-6 py-3"><span className={`text-xs font-bold ${Number(growth) >= 0 ? 'text-[#006b5c]' : 'text-[#ba1a1a]'}`}>{Number(growth) >= 0 ? '+' : ''}{growth}%</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`font-bold border-t-2 ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
                <td className="px-6 py-3 text-sm">Total</td>
                <td className="px-6 py-3 text-sm text-[#006b5c]">${totalNew.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm">${data.reduce((s, d) => s + d.renewals, 0).toLocaleString()}</td>
                <td className="px-6 py-3 text-sm text-[#ba1a1a]">-${totalChurned.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm">${totalRevenue.toLocaleString()}</td>
                <td className="px-6 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
