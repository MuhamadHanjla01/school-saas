import { useState } from 'react';

const initialLogs = [
  { id: 1, admin: 'James Wilson', target: 'admin@oakridge.edu', school: 'Oakridge Academy', start: 'Oct 24, 2024 14:00', end: 'Oct 24, 2024 14:25', duration: '25 min', reason: 'Investigating fee module access issue' },
  { id: 2, admin: 'Emily Carter', target: 'teacher@maplewood.edu', school: 'Maplewood Prep', start: 'Oct 23, 2024 10:15', end: 'Oct 23, 2024 10:35', duration: '20 min', reason: 'Debugging attendance report generation' },
  { id: 3, admin: 'James Wilson', target: 'admin@stmarys.edu', school: "St. Mary's International", start: 'Oct 22, 2024 16:00', end: 'Oct 22, 2024 16:45', duration: '45 min', reason: 'API integration configuration' },
  { id: 4, admin: 'Raj Patel', target: 'admin@greenwood.edu', school: 'Greenwood Academy', start: 'Oct 21, 2024 11:30', end: 'Oct 21, 2024 11:50', duration: '20 min', reason: 'CSV import troubleshooting' },
  { id: 5, admin: 'Emily Carter', target: 'parent@heritage.edu', school: 'Heritage School', start: 'Oct 20, 2024 09:00', end: 'Oct 20, 2024 09:15', duration: '15 min', reason: 'Parent portal login issue verification' },
];

export default function ImpersonationLogsView({ dark }) {
  const [search, setSearch] = useState('');

  const filtered = initialLogs.filter(l => {
    const q = search.toLowerCase();
    return l.admin.toLowerCase().includes(q) || l.target.toLowerCase().includes(q) || l.school.toLowerCase().includes(q);
  });

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Security</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Impersonation Logs</span>
        </div>
        <h1 className="text-2xl font-bold">Impersonation Logs</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Audit trail of admin impersonation sessions.</p>
      </div>

      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${dark ? 'bg-[#9d4224]/10 border-[#9d4224]/30' : 'bg-[#ffdbd0]/30 border-[#9d4224]/20'}`}>
        <span className="material-symbols-outlined text-[#9d4224]">shield</span>
        <p className="text-sm"><strong>Security Notice:</strong> All impersonation sessions are logged and auditable. Admin access to school accounts requires a documented reason.</p>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by admin, target, or school..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Admin</th><th className="px-6 py-3">Target User</th><th className="px-6 py-3">School</th><th className="px-6 py-3">Start</th><th className="px-6 py-3">End</th><th className="px-6 py-3">Duration</th><th className="px-6 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{l.admin}</td>
                  <td className="px-6 py-3 text-sm font-mono">{l.target}</td>
                  <td className="px-6 py-3 text-sm">{l.school}</td>
                  <td className="px-6 py-3 text-xs font-mono">{l.start}</td>
                  <td className="px-6 py-3 text-xs font-mono">{l.end}</td>
                  <td className="px-6 py-3 text-sm font-medium">{l.duration}</td>
                  <td className={`px-6 py-3 text-sm max-w-[200px] truncate ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 text-sm border-t ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#e2e2e5] text-[#6c7a76]'}`}>
          Showing {filtered.length} of {initialLogs.length} sessions
        </div>
      </div>
    </div>
  );
}
