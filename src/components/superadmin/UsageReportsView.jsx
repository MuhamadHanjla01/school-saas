import { useState } from 'react';

const initialData = [
  { id: 1, school: 'Oakridge Academy', activeUsers: 2180, storage: '45.2 GB', apiCalls: '12,480', lastActive: '2 min ago' },
  { id: 2, school: 'Maplewood Prep', activeUsers: 720, storage: '18.7 GB', apiCalls: '4,210', lastActive: '5 min ago' },
  { id: 3, school: "St. Mary's International", activeUsers: 1950, storage: '62.1 GB', apiCalls: '18,920', lastActive: '1 min ago' },
  { id: 4, school: 'Greenwood Academy', activeUsers: 890, storage: '22.4 GB', apiCalls: '6,780', lastActive: '12 min ago' },
  { id: 5, school: 'Pine Hill Academy', activeUsers: 1100, storage: '31.8 GB', apiCalls: '8,450', lastActive: '3 min ago' },
  { id: 6, school: 'Sunrise Valley High', activeUsers: 95, storage: '1.2 GB', apiCalls: '320', lastActive: '1 hr ago' },
  { id: 7, school: 'Heritage School', activeUsers: 0, storage: '8.9 GB', apiCalls: '0', lastActive: '3 days ago' },
  { id: 8, school: "St. Jude's Boarding", activeUsers: 0, storage: '12.5 GB', apiCalls: '0', lastActive: '5 days ago' },
];

export default function UsageReportsView({ dark, setToast }) {
  const [data] = useState(initialData);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('activeUsers');

  const filtered = data
    .filter(d => d.school.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Analytics</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Usage Reports</span>
          </div>
          <h1 className="text-2xl font-bold">Usage Reports</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Per-school resource usage and activity metrics.</p>
        </div>
        <button onClick={() => setToast?.({ message: 'Usage report exported', type: 'success' })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
          <span className="material-symbols-outlined text-[18px]">download</span> Export
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sa-select">
            <option value="activeUsers">Sort: Active Users</option><option value="storage">Sort: Storage</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">School</th><th className="px-6 py-3">Active Users</th><th className="px-6 py-3">Storage Used</th><th className="px-6 py-3">API Calls (30d)</th><th className="px-6 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{d.school}</td>
                  <td className="px-6 py-3 text-sm font-medium">{d.activeUsers.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm">{d.storage}</td>
                  <td className="px-6 py-3 text-sm">{d.apiCalls}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{d.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 text-sm border-t ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#e2e2e5] text-[#6c7a76]'}`}>
          Showing {filtered.length} of {data.length} schools
        </div>
      </div>
    </div>
  );
}
