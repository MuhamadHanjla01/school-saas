import { useState } from 'react';

const topFeatures = [
  { name: 'Attendance', usage: '94%', sessions: '12,450' },
  { name: 'Fee Collection', usage: '87%', sessions: '9,820' },
  { name: 'Student Management', usage: '82%', sessions: '8,640' },
  { name: 'Parent Portal', usage: '76%', sessions: '7,210' },
  { name: 'Exam Management', usage: '68%', sessions: '5,890' },
];

const monthlyUsers = [
  { month: 'Jan', users: 8200 }, { month: 'Feb', users: 8450 }, { month: 'Mar', users: 9100 },
  { month: 'Apr', users: 9800 }, { month: 'May', users: 10200 }, { month: 'Jun', users: 10800 },
  { month: 'Jul', users: 11400 }, { month: 'Aug', users: 12100 }, { month: 'Sep', users: 12800 },
  { month: 'Oct', users: 13500 }, { month: 'Nov', users: 14200 }, { month: 'Dec', users: 15000 },
];

export default function PlatformAnalyticsView({ dark }) {
  const [period, setPeriod] = useState('12m');
  const maxUsers = Math.max(...monthlyUsers.map(m => m.users));

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Analytics</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Platform Analytics</span>
          </div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Platform-wide usage and engagement metrics.</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="sa-select">
          <option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="90d">Last 90 Days</option><option value="12m">Last 12 Months</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Total Users', value: '45,890', icon: 'group', color: '#006b5c', change: '+8.2%' },
          { label: 'Active Schools', value: '1,380', icon: 'domain', color: '#0060ac', change: '+3.1%' },
          { label: 'Avg Session', value: '24m', icon: 'timer', color: '#9d4224', change: '+12%' },
          { label: 'Feature Adoption', value: '78%', icon: 'trending_up', color: '#006b5c', change: '+5.4%' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-2xl border shadow-sm ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined">{kpi.icon}</span></div>
              <span className="text-[10px] font-bold text-[#006b5c] bg-[#006b5c]/10 px-2 py-0.5 rounded-full">{kpi.change}</span>
            </div>
            <p className={`text-[10px] font-bold tracking-wider uppercase ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p>
            <h3 className="text-xl font-bold mt-0.5">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm p-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <h3 className="text-[15px] font-semibold mb-4">Monthly Active Users</h3>
        <div className="flex items-end gap-2 h-48">
          {monthlyUsers.map(m => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-[10px] font-bold ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{(m.users / 1000).toFixed(1)}k</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-[#006b5c] to-[#00c2a8] transition-all hover:opacity-80" style={{ height: `${(m.users / maxUsers) * 160}px` }} />
              <span className={`text-[10px] font-bold ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className={`rounded-2xl border shadow-sm p-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <h3 className="text-[15px] font-semibold mb-3">Top Features by Usage</h3>
          <div className="space-y-3">
            {topFeatures.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <span className={`w-6 text-center text-xs font-bold ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium">{f.name}</span><span className="font-semibold text-[#006b5c]">{f.usage}</span></div>
                  <div className={`w-full h-1.5 rounded-full ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}><div className="bg-gradient-to-r from-[#006b5c] to-[#00c2a8] h-1.5 rounded-full" style={{ width: f.usage }} /></div>
                </div>
                <span className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{f.sessions}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border shadow-sm p-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <h3 className="text-[15px] font-semibold mb-3">User Distribution</h3>
          <div className="space-y-3">
            {[{ role: 'Students', count: '28,450', pct: '62%', color: '#006b5c' },
              { role: 'Parents', count: '10,200', pct: '22%', color: '#0060ac' },
              { role: 'Teachers', count: '5,890', pct: '13%', color: '#9d4224' },
              { role: 'Admins', count: '1,350', pct: '3%', color: '#6c7a76' }
            ].map(r => (
              <div key={r.role} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                <div className="flex-1 flex justify-between text-sm"><span className="font-medium">{r.role}</span><span className={dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}>{r.count}</span></div>
                <span className="text-sm font-bold w-10 text-right">{r.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
