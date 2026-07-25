import { useState } from 'react';

const initialInquiries = [
  { id: 1, name: 'Robert Johnson', email: 'r.johnson@email.com', phone: '+1 555-0101', subject: 'Pricing for 500+ students', message: 'We are a growing school with 500+ students and would like to know about enterprise pricing and bulk discounts.', date: 'Oct 24, 2024', status: 'New' },
  { id: 2, name: 'Amanda Lee', email: 'amanda.lee@school.org', phone: '+1 555-0102', subject: 'Integration with existing SIS', message: 'Can ERPZO integrate with our current Student Information System? We use PowerSchool.', date: 'Oct 23, 2024', status: 'New' },
  { id: 3, name: 'Mark Thompson', email: 'mark.t@academy.edu', phone: '+44 20-7946-0958', subject: 'Multi-campus deployment', message: 'We have 3 campuses and need a solution that supports multi-branch management with centralized reporting.', date: 'Oct 22, 2024', status: 'Replied' },
  { id: 4, name: 'Lisa Wang', email: 'lwang@intlschool.cn', phone: '+86 131-0000-5678', subject: 'Data migration support', message: 'We are migrating from another ERP. Do you offer data migration services and training?', date: 'Oct 20, 2024', status: 'Replied' },
  { id: 5, name: 'Carlos Mendez', email: 'cmendez@colegio.mx', phone: '+52 55-1234-5678', subject: 'Spanish language support', message: 'Does ERPZO support Spanish language? We need full localization for our school in Mexico.', date: 'Oct 18, 2024', status: 'Closed' },
  { id: 6, name: 'Sarah Williams', email: 'swilliams@prep.edu', phone: '+1 555-0106', subject: 'Partnership opportunity', message: 'We represent a network of 12 prep schools and are interested in a partnership arrangement.', date: 'Oct 15, 2024', status: 'New' },
];

const statusColors = { New: 'bg-[#0060ac]/10 text-[#0060ac]', Replied: 'bg-[#006b5c]/10 text-[#006b5c]', Closed: 'bg-[#6c7a76]/10 text-[#6c7a76]' };

export default function ContactInquiryView({ dark, setToast }) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);

  const filtered = inquiries.filter(i => {
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q);
  });

  const handleReply = (inq) => {
    setInquiries(inquiries.map(i => i.id === inq.id ? { ...i, status: 'Replied' } : i));
    setViewing(null);
    setToast?.({ message: `Reply sent to ${inq.name}`, type: 'success' });
  };

  const handleClose = (inq) => {
    setInquiries(inquiries.map(i => i.id === inq.id ? { ...i, status: 'Closed' } : i));
    setViewing(null);
    setToast?.({ message: `Inquiry from ${inq.name} closed`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Contact Inquiry</span>
        </div>
        <h1 className="text-2xl font-bold">Contact Inquiries</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Website contact form submissions and inquiries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'Total Inquiries', value: inquiries.length, icon: 'mail', color: '#006b5c' },
          { label: 'New / Unread', value: inquiries.filter(i => i.status === 'New').length, icon: 'mark_email_unread', color: '#0060ac' },
          { label: 'Replied', value: inquiries.filter(i => i.status === 'Replied').length, icon: 'reply', color: '#006b5c' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{kpi.icon}</span></div>
            <div><p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p><h3 className="text-2xl font-bold">{kpi.value}</h3></div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inquiries..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Name</th><th className="px-6 py-3">Subject</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3"><p className="font-semibold text-sm">{i.name}</p><p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{i.email}</p></td>
                  <td className="px-6 py-3 text-sm">{i.subject}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{i.date}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[i.status]}`}>{i.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => setViewing(i)} className="text-[#006b5c] font-semibold text-xs hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className={`w-full max-w-lg rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">{viewing.subject}</h3>
              <button onClick={() => setViewing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-4 text-sm">
                <div><span className={dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}>From:</span> <strong>{viewing.name}</strong></div>
                <div><span className={dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}>Phone:</span> {viewing.phone}</div>
              </div>
              <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{viewing.email}</p>
              <div className={`p-4 rounded-xl text-sm ${dark ? 'bg-[#1a1c1e]' : 'bg-[#f3f3f6]'}`}>{viewing.message}</div>
            </div>
            <div className={`p-5 border-t flex gap-3 ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <button onClick={() => handleClose(viewing)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>Close</button>
              <button onClick={() => handleReply(viewing)} className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[18px]">reply</span>Mark as Replied</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
