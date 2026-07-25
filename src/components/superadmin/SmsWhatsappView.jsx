import { useState } from 'react';

const initialMessages = [
  { id: 1, channel: 'SMS', message: 'Your ERPZO trial expires in 3 days. Upgrade now!', recipients: 89, date: 'Oct 24, 2024', deliveryRate: '98%', status: 'Delivered' },
  { id: 2, channel: 'WhatsApp', message: 'New attendance report available for your school.', recipients: 1380, date: 'Oct 22, 2024', deliveryRate: '99.2%', status: 'Delivered' },
  { id: 3, channel: 'SMS', message: 'Payment received. Invoice INV-2024-089 confirmed.', recipients: 45, date: 'Oct 20, 2024', deliveryRate: '97%', status: 'Delivered' },
  { id: 4, channel: 'WhatsApp', message: 'Scheduled maintenance on Oct 28, 2-4 AM UTC.', recipients: 1380, date: 'Oct 18, 2024', deliveryRate: '99.5%', status: 'Delivered' },
  { id: 5, channel: 'SMS', message: 'Your subscription plan has been upgraded to Growth.', recipients: 12, date: 'Oct 15, 2024', deliveryRate: '100%', status: 'Delivered' },
];

export default function SmsWhatsappView({ dark, setToast }) {
  const [messages, setMessages] = useState(initialMessages);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ channel: 'SMS', recipients: 'All Schools', message: '' });

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setMessages([{ id: Date.now(), channel: form.channel, message: form.message, recipients: form.recipients === 'All Schools' ? 1380 : 89, date: today, deliveryRate: '—', status: 'Sending' }, ...messages]);
    setToast?.({ message: `${form.channel} message sent`, type: 'success' });
    setShowCompose(false);
    setForm({ channel: 'SMS', recipients: 'All Schools', message: '' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Communication</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">SMS / WhatsApp</span>
          </div>
          <h1 className="text-2xl font-bold">SMS / WhatsApp</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Send notifications via SMS and WhatsApp channels.</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">chat</span> New Message
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'SMS Sent', value: '12,480', icon: 'sms', color: '#006b5c' },
          { label: 'WhatsApp Sent', value: '8,920', icon: 'forum', color: '#0060ac' },
          { label: 'Delivery Rate', value: '98.7%', icon: 'check_circle', color: '#006b5c' }
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
                <th className="px-6 py-3">Channel</th><th className="px-6 py-3">Message</th><th className="px-6 py-3">Recipients</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Delivery</th><th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.channel === 'SMS' ? 'bg-[#0060ac]/10 text-[#0060ac]' : 'bg-[#006b5c]/10 text-[#006b5c]'}`}>{m.channel}</span></td>
                  <td className="px-6 py-3 text-sm max-w-[300px] truncate">{m.message}</td>
                  <td className="px-6 py-3 text-sm font-medium">{m.recipients.toLocaleString()}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{m.date}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{m.deliveryRate}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.status === 'Delivered' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#0060ac]/10 text-[#0060ac]'}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCompose(false)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">New Message</h3>
              <button onClick={() => setShowCompose(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSend} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Channel</label>
                <div className="flex gap-2">
                  {['SMS', 'WhatsApp'].map(ch => (
                    <button key={ch} type="button" onClick={() => setForm({ ...form, channel: ch })} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.channel === ch ? 'bg-[#006b5c] text-white border-[#006b5c]' : dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>{ch}</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-semibold mb-1.5">Recipients</label><select className="sa-input" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })}><option>All Schools</option><option>Active Schools</option><option>Trial Schools</option></select></div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Message</label>
                <textarea className="sa-input min-h-[100px] resize-none" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Type your message..." maxLength={160} />
                <p className={`text-xs mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{form.message.length}/160 characters</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompose(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
