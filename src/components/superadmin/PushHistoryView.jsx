import { useState } from 'react';

const initialPush = [
  { id: 1, title: 'System Update v4.1.2', message: 'A new system update is available with performance improvements.', audience: 'All Users', date: 'Oct 24, 2024', sent: 45890, opened: 28450, openRate: '62%' },
  { id: 2, title: 'New Feature: Transport', message: 'Track school buses in real-time with our new Transport module!', audience: 'School Admins', date: 'Oct 20, 2024', sent: 1380, opened: 1102, openRate: '80%' },
  { id: 3, title: 'Maintenance Window', message: 'Scheduled maintenance on Oct 28, 2-4 AM UTC.', audience: 'All Users', date: 'Oct 18, 2024', sent: 45890, opened: 32100, openRate: '70%' },
  { id: 4, title: 'Fee Payment Reminder', message: 'Fee payment deadline is approaching. Pay now to avoid late fees.', audience: 'Parents', date: 'Oct 15, 2024', sent: 28450, opened: 19800, openRate: '70%' },
  { id: 5, title: 'Exam Schedule Published', message: 'Q3 exam schedule has been published. Check the calendar.', audience: 'Students & Teachers', date: 'Oct 10, 2024', sent: 34200, opened: 24500, openRate: '72%' },
  { id: 6, title: 'Holiday Notice', message: 'Schools will remain closed on Oct 14 for National Holiday.', audience: 'All Users', date: 'Oct 8, 2024', sent: 45890, opened: 38200, openRate: '83%' },
];

export default function PushHistoryView({ dark }) {
  const [viewing, setViewing] = useState(null);

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Notifications</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Push History</span>
        </div>
        <h1 className="text-2xl font-bold">Push History</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>History of push notifications sent to users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'Total Sent', value: initialPush.reduce((s, p) => s + p.sent, 0).toLocaleString(), icon: 'send', color: '#006b5c' },
          { label: 'Avg Open Rate', value: '73%', icon: 'mark_email_read', color: '#0060ac' },
          { label: 'Avg Click Rate', value: '34%', icon: 'touch_app', color: '#9d4224' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{kpi.icon}</span></div>
            <div><p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p><h3 className="text-2xl font-bold">{kpi.value}</h3></div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Title</th><th className="px-6 py-3">Audience</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Sent</th><th className="px-6 py-3">Opened</th><th className="px-6 py-3">Open Rate</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialPush.map(p => (
                <tr key={p.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3"><p className="font-semibold text-sm">{p.title}</p><p className={`text-xs truncate max-w-[250px] ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{p.message}</p></td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}>{p.audience}</span></td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{p.date}</td>
                  <td className="px-6 py-3 text-sm font-medium">{p.sent.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm">{p.opened.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm font-bold text-[#006b5c]">{p.openRate}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => setViewing(p)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">{viewing.title}</h3>
              <button onClick={() => setViewing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-3">
              <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{viewing.message}</p>
              {[['Audience', viewing.audience], ['Sent Date', viewing.date], ['Total Sent', viewing.sent.toLocaleString()], ['Opened', viewing.opened.toLocaleString()], ['Open Rate', viewing.openRate]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm"><span className={dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}>{k}</span><span className="font-semibold">{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
