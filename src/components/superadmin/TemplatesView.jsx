import { useState } from 'react';

const initialTemplates = [
  { id: 1, name: 'Welcome Email', channel: 'Email', trigger: 'New School Onboarded', status: 'Active', subject: 'Welcome to ERPZO!', body: 'Dear {{school_name}}, welcome to the ERPZO platform...' },
  { id: 2, name: 'Password Reset', channel: 'Email', trigger: 'Password Reset Request', status: 'Active', subject: 'Reset Your Password', body: 'Hi {{user_name}}, click here to reset...' },
  { id: 3, name: 'Payment Received', channel: 'Email', trigger: 'Payment Confirmed', status: 'Active', subject: 'Payment Confirmation', body: 'Thank you for your payment of {{amount}}...' },
  { id: 4, name: 'Trial Expiry Reminder', channel: 'SMS', trigger: '3 Days Before Trial Ends', status: 'Active', subject: '', body: 'Your ERPZO trial expires in 3 days. Upgrade now!' },
  { id: 5, name: 'Attendance Alert', channel: 'Push', trigger: 'Student Absent', status: 'Active', subject: '', body: '{{student_name}} was marked absent today.' },
  { id: 6, name: 'Fee Due Reminder', channel: 'WhatsApp', trigger: '7 Days Before Due Date', status: 'Active', subject: '', body: 'Hi {{parent_name}}, fee payment of {{amount}} is due on {{due_date}}.' },
  { id: 7, name: 'Maintenance Notice', channel: 'Email', trigger: 'Manual', status: 'Draft', subject: 'Scheduled Maintenance', body: 'We will be performing scheduled maintenance on {{date}}...' },
  { id: 8, name: 'New Feature Announcement', channel: 'Push', trigger: 'Manual', status: 'Draft', subject: '', body: 'Exciting news! {{feature_name}} is now available.' },
];

const channelColors = { Email: 'bg-[#0060ac]/10 text-[#0060ac]', SMS: 'bg-[#006b5c]/10 text-[#006b5c]', Push: 'bg-[#9d4224]/10 text-[#9d4224]', WhatsApp: 'bg-[#006b5c]/10 text-[#006b5c]' };

export default function TemplatesView({ dark, setToast }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', channel: 'Email', subject: '', body: '' });

  const toggleStatus = (t) => {
    const next = t.status === 'Active' ? 'Draft' : 'Active';
    setTemplates(templates.map(x => x.id === t.id ? { ...x, status: next } : x));
    setToast?.({ message: `"${t.name}" ${next === 'Active' ? 'activated' : 'set to draft'}`, type: 'success' });
  };

  const openEdit = (t) => { setForm({ name: t.name, channel: t.channel, subject: t.subject, body: t.body }); setEditing(t); };

  const handleSave = (e) => {
    e.preventDefault();
    setTemplates(templates.map(t => t.id === editing.id ? { ...t, ...form } : t));
    setToast?.({ message: `"${form.name}" updated`, type: 'success' });
    setEditing(null);
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Notifications</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Templates</span>
        </div>
        <h1 className="text-2xl font-bold">Notification Templates</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage notification templates across all channels.</p>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Template</th><th className="px-6 py-3">Channel</th><th className="px-6 py-3">Trigger</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{t.name}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${channelColors[t.channel]}`}>{t.channel}</span></td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{t.trigger}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'Active' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#6c7a76]/10 text-[#6c7a76]'}`}>{t.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">edit</span></button>
                      <button onClick={() => toggleStatus(t)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">{t.status === 'Active' ? 'toggle_on' : 'toggle_off'}</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className={`w-full max-w-lg rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Edit Template</h3>
              <button onClick={() => setEditing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Name</label><input className="sa-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Channel</label><select className="sa-input" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option>Email</option><option>SMS</option><option>Push</option><option>WhatsApp</option></select></div>
              {form.channel === 'Email' && <div><label className="block text-sm font-semibold mb-1.5">Subject</label><input className="sa-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>}
              <div><label className="block text-sm font-semibold mb-1.5">Body</label><textarea className="sa-input min-h-[100px] resize-none" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /><p className={`text-xs mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Variables: {'{{school_name}}, {{user_name}}, {{amount}}, {{date}}'}</p></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
