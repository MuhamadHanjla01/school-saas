import { useState } from 'react';

const initialTickets = [
  { id: 'TKT-001', subject: 'Cannot access fee module', school: 'Oakridge Academy', priority: 'High', status: 'Open', assignee: 'Emily Carter', date: 'Oct 24, 2024', messages: [{ from: 'School Admin', text: 'Fee collection page shows 403 error since this morning.', time: '10:30 AM' }, { from: 'Emily Carter', text: 'We are investigating this issue. Can you try clearing your cache?', time: '10:45 AM' }] },
  { id: 'TKT-002', subject: 'Attendance report not generating', school: 'Maplewood Prep', priority: 'Medium', status: 'In Progress', assignee: 'Alex Kim', date: 'Oct 23, 2024', messages: [{ from: 'School Admin', text: 'Monthly attendance report button does nothing.', time: '2:15 PM' }] },
  { id: 'TKT-003', subject: 'Need help with API integration', school: "St. Mary's International", priority: 'Low', status: 'Open', assignee: 'Unassigned', date: 'Oct 22, 2024', messages: [{ from: 'School Admin', text: 'We want to integrate our CRM with ERPZO via API.', time: '9:00 AM' }] },
  { id: 'TKT-004', subject: 'Student data import failing', school: 'Greenwood Academy', priority: 'Critical', status: 'Open', assignee: 'Raj Patel', date: 'Oct 22, 2024', messages: [{ from: 'School Admin', text: 'CSV import throws error for 500+ records.', time: '11:20 AM' }] },
  { id: 'TKT-005', subject: 'Request for custom report format', school: 'Pine Hill Academy', priority: 'Low', status: 'Resolved', assignee: 'Emily Carter', date: 'Oct 20, 2024', messages: [] },
  { id: 'TKT-006', subject: 'Payment gateway timeout', school: 'Heritage School', priority: 'High', status: 'In Progress', assignee: 'Raj Patel', date: 'Oct 19, 2024', messages: [] },
  { id: 'TKT-007', subject: 'Parent portal login issue', school: 'Sunrise Valley High', priority: 'Medium', status: 'Closed', assignee: 'Alex Kim', date: 'Oct 18, 2024', messages: [] },
  { id: 'TKT-008', subject: 'WhatsApp notifications not sending', school: "St. Jude's Boarding", priority: 'High', status: 'Open', assignee: 'Unassigned', date: 'Oct 17, 2024', messages: [] },
];

const priorityColors = { Critical: 'bg-[#ba1a1a]/10 text-[#ba1a1a]', High: 'bg-[#9d4224]/10 text-[#9d4224]', Medium: 'bg-[#0060ac]/10 text-[#0060ac]', Low: 'bg-[#6c7a76]/10 text-[#6c7a76]' };
const statusColors = { Open: 'bg-[#9d4224]/10 text-[#9d4224]', 'In Progress': 'bg-[#0060ac]/10 text-[#0060ac]', Resolved: 'bg-[#006b5c]/10 text-[#006b5c]', Closed: 'bg-[#6c7a76]/10 text-[#6c7a76]' };

export default function TicketInboxView({ dark, setToast }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewing, setViewing] = useState(null);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = t.subject.toLowerCase().includes(q) || t.school.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleClose = (ticket) => {
    setTickets(tickets.map(t => t.id === ticket.id ? { ...t, status: 'Closed' } : t));
    setViewing(null);
    setToast?.({ message: `${ticket.id} closed`, type: 'success' });
  };

  const handleAssign = (ticket) => {
    setTickets(tickets.map(t => t.id === ticket.id ? { ...t, assignee: 'Emily Carter', status: 'In Progress' } : t));
    setToast?.({ message: `${ticket.id} assigned to Emily Carter`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Support</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Ticket Inbox</span>
        </div>
        <h1 className="text-2xl font-bold">Ticket Inbox</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage support tickets from schools.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Open', value: tickets.filter(t => t.status === 'Open').length, icon: 'inbox', color: '#9d4224' },
          { label: 'Avg Response', value: '2.4h', icon: 'schedule', color: '#0060ac' },
          { label: 'Resolved Today', value: tickets.filter(t => t.status === 'Resolved').length, icon: 'check_circle', color: '#006b5c' },
          { label: 'Satisfaction', value: '4.6/5', icon: 'sentiment_satisfied', color: '#006b5c' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15`, color: kpi.color }}><span className="material-symbols-outlined">{kpi.icon}</span></div>
            <div><p className={`text-[10px] font-bold tracking-wider uppercase ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p><h3 className="text-xl font-bold">{kpi.value}</h3></div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sa-select">
            <option>All</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">ID</th><th className="px-6 py-3">Subject</th><th className="px-6 py-3">School</th><th className="px-6 py-3">Priority</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Assignee</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 text-xs font-mono font-medium">{t.id}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{t.subject}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{t.school}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[t.status]}`}>{t.status}</span></td>
                  <td className={`px-6 py-3 text-sm ${t.assignee === 'Unassigned' ? 'text-[#9d4224] italic' : ''}`}>{t.assignee}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewing(t)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                      {t.assignee === 'Unassigned' && <button onClick={() => handleAssign(t)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined text-[18px]">person_add</span></button>}
                    </div>
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
              <h3 className="text-lg font-bold">{viewing.id} — {viewing.subject}</h3>
              <button onClick={() => setViewing(null)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColors[viewing.priority]}`}>{viewing.priority}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[viewing.status]}`}>{viewing.status}</span>
              </div>
              <div className={`text-sm mb-4 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
                <p><strong>School:</strong> {viewing.school}</p>
                <p><strong>Assignee:</strong> {viewing.assignee}</p>
                <p><strong>Date:</strong> {viewing.date}</p>
              </div>
              {viewing.messages.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6c7a76]">Conversation</p>
                  {viewing.messages.map((m, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${dark ? 'bg-[#1a1c1e]' : 'bg-[#f3f3f6]'}`}>
                      <div className="flex justify-between mb-1"><span className="font-semibold text-xs">{m.from}</span><span className={`text-[10px] ${dark ? 'text-[#6c7a76]' : 'text-[#8b9896]'}`}>{m.time}</span></div>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`p-5 border-t flex gap-3 ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <button onClick={() => setViewing(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Close Modal</button>
              {viewing.status !== 'Closed' && <button onClick={() => handleClose(viewing)} className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Resolve & Close</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
