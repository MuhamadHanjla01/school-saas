import { useState } from 'react';

const initialLogs = [
  { id: 1, timestamp: 'Oct 24, 2024 14:32:18', user: 'James Wilson', action: 'Login', resource: 'Admin Portal', ip: '192.168.1.45', status: 'Success' },
  { id: 2, timestamp: 'Oct 24, 2024 14:28:05', user: 'Emily Carter', action: 'Update', resource: 'School: Oakridge Academy', ip: '10.0.0.12', status: 'Success' },
  { id: 3, timestamp: 'Oct 24, 2024 14:15:42', user: 'System', action: 'Export', resource: 'Revenue Report Q3', ip: '—', status: 'Success' },
  { id: 4, timestamp: 'Oct 24, 2024 13:58:11', user: 'Raj Patel', action: 'Delete', resource: 'User: test@demo.com', ip: '172.16.0.8', status: 'Success' },
  { id: 5, timestamp: 'Oct 24, 2024 13:45:33', user: 'Unknown', action: 'Login', resource: 'Admin Portal', ip: '203.0.113.42', status: 'Failed' },
  { id: 6, timestamp: 'Oct 24, 2024 13:30:20', user: 'Sofia Martinez', action: 'Create', resource: 'School: Lakeside Grammar', ip: '10.0.0.15', status: 'Success' },
  { id: 7, timestamp: 'Oct 24, 2024 12:55:08', user: 'James Wilson', action: 'Update', resource: 'System Settings', ip: '192.168.1.45', status: 'Success' },
  { id: 8, timestamp: 'Oct 24, 2024 12:40:15', user: 'Emily Carter', action: 'Create', resource: 'Ticket: TKT-008', ip: '10.0.0.12', status: 'Success' },
  { id: 9, timestamp: 'Oct 24, 2024 12:22:47', user: 'System', action: 'Export', resource: 'Database Backup', ip: '—', status: 'Success' },
  { id: 10, timestamp: 'Oct 24, 2024 11:58:03', user: 'Unknown', action: 'Login', resource: 'API Endpoint', ip: '198.51.100.77', status: 'Failed' },
  { id: 11, timestamp: 'Oct 24, 2024 11:30:19', user: 'Alex Kim', action: 'Update', resource: 'Ticket: TKT-002', ip: '10.0.0.20', status: 'Success' },
  { id: 12, timestamp: 'Oct 24, 2024 11:15:44', user: 'Raj Patel', action: 'Login', resource: 'Admin Portal', ip: '172.16.0.8', status: 'Success' },
  { id: 13, timestamp: 'Oct 24, 2024 10:48:32', user: 'James Wilson', action: 'Create', resource: 'Coupon: WINTER30', ip: '192.168.1.45', status: 'Success' },
  { id: 14, timestamp: 'Oct 24, 2024 10:20:11', user: 'System', action: 'Update', resource: 'SSL Certificate Renewal', ip: '—', status: 'Success' },
  { id: 15, timestamp: 'Oct 24, 2024 09:45:58', user: 'Sofia Martinez', action: 'Export', resource: 'School List CSV', ip: '10.0.0.15', status: 'Success' },
];

const actionColors = { Login: 'bg-[#0060ac]/10 text-[#0060ac]', Create: 'bg-[#006b5c]/10 text-[#006b5c]', Update: 'bg-[#9d4224]/10 text-[#9d4224]', Delete: 'bg-[#ba1a1a]/10 text-[#ba1a1a]', Export: 'bg-[#6c7a76]/10 text-[#6c7a76]' };

export default function AuditLogsView({ dark, setToast }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('All');

  const filtered = initialLogs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = l.user.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q);
    const matchAction = filterAction === 'All' || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Security</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Audit Logs</span>
          </div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Complete record of system events and user actions.</p>
        </div>
        <button onClick={() => setToast?.({ message: 'Audit logs exported', type: 'success' })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
          <span className="material-symbols-outlined text-[18px]">download</span> Export
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="sa-select">
            <option>All</option><option>Login</option><option>Create</option><option>Update</option><option>Delete</option><option>Export</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Timestamp</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">Resource</th><th className="px-6 py-3">IP Address</th><th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 text-xs font-mono">{l.timestamp}</td>
                  <td className="px-6 py-3 text-sm font-medium">{l.user}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionColors[l.action]}`}>{l.action}</span></td>
                  <td className="px-6 py-3 text-sm">{l.resource}</td>
                  <td className="px-6 py-3 text-xs font-mono">{l.ip}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'Success' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 text-sm border-t ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#e2e2e5] text-[#6c7a76]'}`}>
          Showing {filtered.length} of {initialLogs.length} entries
        </div>
      </div>
    </div>
  );
}
