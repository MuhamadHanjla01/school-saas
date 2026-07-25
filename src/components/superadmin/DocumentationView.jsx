import { useState } from 'react';

const categories = ['All', 'API Reference', 'Integration Guides', 'User Manual', 'Release Notes'];
const docs = [
  { id: 1, title: 'REST API Documentation', category: 'API Reference', desc: 'Complete API reference with endpoints, authentication, and examples.', updated: 'Oct 20, 2024' },
  { id: 2, title: 'Webhook Events Reference', category: 'API Reference', desc: 'List of all webhook events with payloads and retry policies.', updated: 'Oct 15, 2024' },
  { id: 3, title: 'Getting Started Guide', category: 'User Manual', desc: 'Step-by-step guide to onboard your school on ERPZO.', updated: 'Oct 12, 2024' },
  { id: 4, title: 'Google Workspace Integration', category: 'Integration Guides', desc: 'Connect ERPZO with Google Classroom and Google Drive.', updated: 'Oct 10, 2024' },
  { id: 5, title: 'Payment Gateway Setup', category: 'Integration Guides', desc: 'Configure Stripe, Razorpay, or PayPal for fee collection.', updated: 'Oct 8, 2024' },
  { id: 6, title: 'Admin User Manual', category: 'User Manual', desc: 'Complete guide for school administrators.', updated: 'Oct 5, 2024' },
  { id: 7, title: 'Release Notes v4.1', category: 'Release Notes', desc: 'What\'s new in ERPZO v4.1 including Transport Tracking.', updated: 'Sep 28, 2024' },
  { id: 8, title: 'SMS Gateway Configuration', category: 'Integration Guides', desc: 'Set up Twilio or custom SMS provider for notifications.', updated: 'Sep 20, 2024' },
];

export default function DocumentationView({ dark }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    return (d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)) && (filterCat === 'All' || d.category === filterCat);
  });

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Documentation</span></div>
        <h1 className="text-2xl font-bold">Documentation</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Platform documentation and integration guides.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documentation..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#2f3133] border-[#3c4a46] text-[#f0f0f3]' : 'bg-white border-[#e2e2e5]'}`} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="sa-select">{categories.map(c => <option key={c}>{c}</option>)}</select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(d => (
          <div key={d.id} className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60 hover:border-[#006b5c]/40' : 'bg-white border-[#e8e8ea] hover:border-[#006b5c]/25'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}>{d.category}</span>
              <span className="material-symbols-outlined text-[#006b5c] opacity-0 group-hover:opacity-100 transition-opacity text-[18px]">open_in_new</span>
            </div>
            <h3 className="text-sm font-bold mb-1 group-hover:text-[#006b5c] transition-colors">{d.title}</h3>
            <p className={`text-xs mb-3 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{d.desc}</p>
            <p className={`text-[10px] ${dark ? 'text-[#6c7a76]' : 'text-[#8b9896]'}`}>Updated {d.updated}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
