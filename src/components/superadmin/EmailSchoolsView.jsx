import { useState } from 'react';

const initialEmails = [
  { id: 1, subject: 'Platform Maintenance Notice', recipients: 'All Schools (1,380)', date: 'Oct 24, 2024', status: 'Delivered', opens: 892 },
  { id: 2, subject: 'New Feature: Transport Tracking', recipients: 'Growth & Enterprise (735)', date: 'Oct 20, 2024', status: 'Delivered', opens: 567 },
  { id: 3, subject: 'End-of-Year Report Available', recipients: 'All Schools (1,380)', date: 'Oct 15, 2024', status: 'Delivered', opens: 1102 },
  { id: 4, subject: 'Billing Reminder - Q4 2024', recipients: 'Pending Payment (23)', date: 'Oct 10, 2024', status: 'Sending', opens: 0 },
  { id: 5, subject: 'Holiday Schedule Update', recipients: 'All Schools (1,380)', date: 'Oct 5, 2024', status: 'Failed', opens: 0 },
];

const statusColors = { Delivered: 'bg-[#006b5c]/10 text-[#006b5c]', Sending: 'bg-[#0060ac]/10 text-[#0060ac]', Failed: 'bg-[#ba1a1a]/10 text-[#ba1a1a]', Draft: 'bg-[#6c7a76]/10 text-[#6c7a76]' };

export default function EmailSchoolsView({ dark, setToast }) {
  const [emails, setEmails] = useState(initialEmails);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipients: 'All Schools', subject: '', body: '' });

  const handleSend = (e) => {
    e.preventDefault();
    if (!composeForm.subject.trim() || !composeForm.body.trim()) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setEmails([{ id: Date.now(), subject: composeForm.subject, recipients: composeForm.recipients, date: today, status: 'Sending', opens: 0 }, ...emails]);
    setToast?.({ message: 'Email sent successfully', type: 'success' });
    setShowCompose(false);
    setComposeForm({ recipients: 'All Schools', subject: '', body: '' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Communication</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Email Schools</span>
          </div>
          <h1 className="text-2xl font-bold">Email Schools</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Compose and send emails to school administrators.</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">edit</span> Compose Email
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'Emails Sent', value: '4,892', icon: 'send', color: '#006b5c' },
          { label: 'Open Rate', value: '68.4%', icon: 'mark_email_read', color: '#0060ac' },
          { label: 'Failed', value: '12', icon: 'error', color: '#ba1a1a' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{kpi.icon}</span></div>
            <div><p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p><h3 className="text-2xl font-bold">{kpi.value}</h3></div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Subject</th><th className="px-6 py-3">Recipients</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Opens</th><th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {emails.map(e => (
                <tr key={e.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{e.subject}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{e.recipients}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{e.date}</td>
                  <td className="px-6 py-3 text-sm font-medium">{e.opens.toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[e.status]}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCompose(false)}>
          <div className={`w-full max-w-lg rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Compose Email</h3>
              <button onClick={() => setShowCompose(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSend} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Recipients</label><select className="sa-input" value={composeForm.recipients} onChange={e => setComposeForm({ ...composeForm, recipients: e.target.value })}><option>All Schools</option><option>Active Schools Only</option><option>Trial Schools</option><option>Pending Payment</option></select></div>
              <div><label className="block text-sm font-semibold mb-1.5">Subject</label><input className="sa-input" value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} required placeholder="Email subject line" /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Body</label><textarea className="sa-input min-h-[120px] resize-none" value={composeForm.body} onChange={e => setComposeForm({ ...composeForm, body: e.target.value })} required placeholder="Write your email content..." /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompose(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[18px]">send</span>Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
