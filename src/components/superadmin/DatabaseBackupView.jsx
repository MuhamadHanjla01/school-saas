import { useState } from 'react';

const initialBackups = [
  { id: 1, date: 'Oct 24, 2024 02:00 AM', size: '4.2 GB', type: 'Auto', status: 'Completed' },
  { id: 2, date: 'Oct 23, 2024 02:00 AM', size: '4.1 GB', type: 'Auto', status: 'Completed' },
  { id: 3, date: 'Oct 22, 2024 14:30 PM', size: '4.1 GB', type: 'Manual', status: 'Completed' },
  { id: 4, date: 'Oct 22, 2024 02:00 AM', size: '4.0 GB', type: 'Auto', status: 'Completed' },
  { id: 5, date: 'Oct 21, 2024 02:00 AM', size: '3.9 GB', type: 'Auto', status: 'Failed' },
];

export default function DatabaseBackupView({ dark, setToast }) {
  const [backups, setBackups] = useState(initialBackups);
  const [autoBackup, setAutoBackup] = useState(true);

  const createBackup = () => {
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setBackups([{ id: Date.now(), date: now, size: '4.2 GB', type: 'Manual', status: 'Completed' }, ...backups]);
    setToast?.({ message: 'Manual backup created', type: 'success' });
  };

  const deleteBackup = (b) => {
    if (!window.confirm('Delete this backup?')) return;
    setBackups(backups.filter(x => x.id !== b.id));
    setToast?.({ message: 'Backup deleted', type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Database Backup</span></div>
          <h1 className="text-2xl font-bold">Database Backup</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage database backups and restore points.</p>
        </div>
        <button onClick={createBackup} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">backup</span> Create Backup
        </button>
      </div>

      <div className={`flex items-center justify-between p-4 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div><p className="text-sm font-semibold">Auto-backup Schedule</p><p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Daily at 2:00 AM UTC</p></div>
        <button onClick={() => setAutoBackup(!autoBackup)} className={`w-12 h-7 rounded-full relative transition-colors ${autoBackup ? 'bg-[#006b5c]' : dark ? 'bg-[#3c4a46]' : 'bg-[#e2e2e5]'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoBackup ? 'left-6' : 'left-1'}`} /></button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Date</th><th className="px-6 py-3">Size</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(b => (
                <tr key={b.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 text-sm font-mono">{b.date}</td>
                  <td className="px-6 py-3 text-sm font-medium">{b.size}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${b.type === 'Auto' ? 'bg-[#0060ac]/10 text-[#0060ac]' : 'bg-[#006b5c]/10 text-[#006b5c]'}`}>{b.type}</span></td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.status === 'Completed' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'}`}>{b.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === 'Completed' && <button onClick={() => setToast?.({ message: 'Downloading backup...', type: 'success' })} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">download</span></button>}
                      <button onClick={() => deleteBackup(b)} className="p-1.5 rounded-lg hover:bg-[#ffdad6]/40 text-[#ba1a1a]"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
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
