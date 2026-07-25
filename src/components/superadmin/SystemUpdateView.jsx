import { useState } from 'react';

const updates = [
  { version: 'v4.1.2', date: 'Oct 20, 2024', type: 'Patch', summary: 'Fixed attendance report generation bug and improved CSV import performance.' },
  { version: 'v4.1.1', date: 'Oct 10, 2024', type: 'Patch', summary: 'Security patch for session handling and XSS prevention.' },
  { version: 'v4.1.0', date: 'Sep 28, 2024', type: 'Minor', summary: 'Added Transport Tracking module, improved parent portal, new notification templates.' },
  { version: 'v4.0.0', date: 'Aug 15, 2024', type: 'Major', summary: 'Complete UI redesign with Material Design 3, multi-tenant architecture overhaul.' },
  { version: 'v3.9.5', date: 'Jul 1, 2024', type: 'Patch', summary: 'Fixed payment gateway timeout issues and improved database query optimization.' },
];

const typeColors = { Major: 'bg-[#9d4224]/10 text-[#9d4224]', Minor: 'bg-[#0060ac]/10 text-[#0060ac]', Patch: 'bg-[#006b5c]/10 text-[#006b5c]' };

export default function SystemUpdateView({ dark, setToast }) {
  const [checking, setChecking] = useState(false);

  const checkUpdates = () => {
    setChecking(true);
    setTimeout(() => { setChecking(false); setToast?.({ message: 'System is up to date!', type: 'success' }); }, 1500);
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">System Update</span></div>
        <h1 className="text-2xl font-bold">System Update</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Current version information and update history.</p>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#006b5c]/10 flex items-center justify-center"><span className="material-symbols-outlined text-[#006b5c] text-[28px]">verified</span></div>
          <div>
            <h2 className="text-xl font-bold">ERPZO v4.1.2-Stable</h2>
            <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Released Oct 20, 2024 &middot; You are on the latest version</p>
          </div>
        </div>
        <button onClick={checkUpdates} disabled={checking} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${checking ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
          <span className={`material-symbols-outlined text-[18px] ${checking ? 'animate-spin' : ''}`}>sync</span> {checking ? 'Checking...' : 'Check for Updates'}
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <h3 className="text-[15px] font-semibold">Update History</h3>
        </div>
        <div className="divide-y divide-[#e2e2e5] dark:divide-[#3c4a46]">
          {updates.map(u => (
            <div key={u.version} className={`p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${dark ? 'hover:bg-[#3c4a46]/30' : 'hover:bg-[#f3f3f6]'} transition-colors`}>
              <div className="flex items-center gap-3 sm:w-48 shrink-0">
                <span className="font-mono font-bold text-sm">{u.version}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors[u.type]}`}>{u.type}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">{u.summary}</p>
              </div>
              <span className={`text-xs shrink-0 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{u.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
