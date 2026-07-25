import { useState } from 'react';

const initialLogins = [
  { id: 1, user: 'James Wilson', email: 'j.wilson@erpzo.com', time: 'Oct 24, 2024 14:32', ip: '192.168.1.45', location: 'San Francisco, US', device: 'Chrome / macOS', status: 'Success' },
  { id: 2, user: 'Unknown', email: 'admin@test.com', time: 'Oct 24, 2024 13:45', ip: '203.0.113.42', location: 'Beijing, CN', device: 'Firefox / Windows', status: 'Failed' },
  { id: 3, user: 'Emily Carter', email: 'e.carter@erpzo.com', time: 'Oct 24, 2024 12:10', ip: '10.0.0.12', location: 'New York, US', device: 'Chrome / Windows', status: 'Success' },
  { id: 4, user: 'Raj Patel', email: 'r.patel@erpzo.com', time: 'Oct 24, 2024 11:15', ip: '172.16.0.8', location: 'Mumbai, IN', device: 'Safari / macOS', status: 'Success' },
  { id: 5, user: 'Unknown', email: 'root@server.com', time: 'Oct 24, 2024 10:30', ip: '198.51.100.77', location: 'Moscow, RU', device: 'curl/7.88', status: 'Blocked' },
  { id: 6, user: 'Sofia Martinez', email: 's.martinez@erpzo.com', time: 'Oct 24, 2024 09:20', ip: '10.0.0.15', location: 'Austin, US', device: 'Chrome / Windows', status: 'Success' },
  { id: 7, user: 'Alex Kim', email: 'a.kim@erpzo.com', time: 'Oct 23, 2024 17:45', ip: '10.0.0.20', location: 'Seattle, US', device: 'Chrome / macOS', status: 'Success' },
  { id: 8, user: 'Unknown', email: 'admin@erpzo.com', time: 'Oct 23, 2024 16:30', ip: '45.33.32.156', location: 'Lagos, NG', device: 'Firefox / Linux', status: 'Failed' },
  { id: 9, user: 'Unknown', email: 'admin@erpzo.com', time: 'Oct 23, 2024 16:28', ip: '45.33.32.156', location: 'Lagos, NG', device: 'Firefox / Linux', status: 'Failed' },
  { id: 10, user: 'Priya Sharma', email: 'p.sharma@erpzo.com', time: 'Oct 23, 2024 10:00', ip: '192.168.2.88', location: 'London, UK', device: 'Edge / Windows', status: 'Success' },
];

const statusColors = { Success: 'bg-[#006b5c]/10 text-[#006b5c]', Failed: 'bg-[#ba1a1a]/10 text-[#ba1a1a]', Blocked: 'bg-[#9d4224]/10 text-[#9d4224]' };

export default function LoginActivityView({ dark, setToast }) {
  const [logins] = useState(initialLogins);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = logins.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = l.user.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.ip.includes(q);
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleBlock = (login) => {
    setToast?.({ message: `IP ${login.ip} blocked`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Security</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Login Activity</span>
        </div>
        <h1 className="text-2xl font-bold">Login Activity</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Track login attempts and active sessions.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Logins Today', value: logins.filter(l => l.status === 'Success').length, icon: 'login', color: '#006b5c' },
          { label: 'Failed Attempts', value: logins.filter(l => l.status === 'Failed').length, icon: 'error', color: '#ba1a1a' },
          { label: 'Active Sessions', value: 4, icon: 'devices', color: '#0060ac' },
          { label: 'Blocked IPs', value: logins.filter(l => l.status === 'Blocked').length, icon: 'block', color: '#9d4224' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined">{kpi.icon}</span></div>
            <div><p className={`text-[10px] font-bold tracking-wider uppercase ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p><h3 className="text-xl font-bold">{kpi.value}</h3></div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, email, or IP..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sa-select">
            <option>All</option><option>Success</option><option>Failed</option><option>Blocked</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">User</th><th className="px-6 py-3">Time</th><th className="px-6 py-3">IP</th><th className="px-6 py-3">Location</th><th className="px-6 py-3">Device</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3"><p className="font-semibold text-sm">{l.user}</p><p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{l.email}</p></td>
                  <td className="px-6 py-3 text-xs font-mono">{l.time}</td>
                  <td className="px-6 py-3 text-xs font-mono">{l.ip}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{l.location}</td>
                  <td className={`px-6 py-3 text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{l.device}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[l.status]}`}>{l.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    {(l.status === 'Failed' || l.status === 'Blocked') && (
                      <button onClick={() => handleBlock(l)} className="text-[#ba1a1a] text-xs font-semibold hover:underline">Block IP</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
