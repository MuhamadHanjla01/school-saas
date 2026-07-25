import { useState } from 'react';

const categories = ['All', 'Getting Started', 'Account Management', 'Billing', 'Technical', 'API'];
const initialArticles = [
  { id: 1, title: 'Getting Started with ERPZO', category: 'Getting Started', updated: 'Oct 20, 2024', views: 4520, status: 'Published' },
  { id: 2, title: 'Setting Up Your School Profile', category: 'Getting Started', updated: 'Oct 18, 2024', views: 3210, status: 'Published' },
  { id: 3, title: 'Managing User Roles & Permissions', category: 'Account Management', updated: 'Oct 15, 2024', views: 2890, status: 'Published' },
  { id: 4, title: 'Password Reset & Account Recovery', category: 'Account Management', updated: 'Oct 12, 2024', views: 5120, status: 'Published' },
  { id: 5, title: 'Understanding Your Invoice', category: 'Billing', updated: 'Oct 10, 2024', views: 1890, status: 'Published' },
  { id: 6, title: 'Subscription Plans Comparison', category: 'Billing', updated: 'Oct 8, 2024', views: 3450, status: 'Published' },
  { id: 7, title: 'Troubleshooting Import Errors', category: 'Technical', updated: 'Oct 5, 2024', views: 2340, status: 'Published' },
  { id: 8, title: 'REST API Authentication Guide', category: 'API', updated: 'Oct 3, 2024', views: 1560, status: 'Published' },
  { id: 9, title: 'Webhook Integration Setup', category: 'API', updated: 'Oct 1, 2024', views: 980, status: 'Draft' },
  { id: 10, title: 'Data Backup & Restore Guide', category: 'Technical', updated: 'Sep 28, 2024', views: 1240, status: 'Published' },
];

export default function KnowledgeBaseView({ dark, setToast }) {
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Getting Started', content: '' });

  const filtered = articles.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.title.toLowerCase().includes(q);
    const matchCat = filterCat === 'All' || a.category === filterCat;
    return matchSearch && matchCat;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setArticles([{ id: Date.now(), title: form.title, category: form.category, updated: today, views: 0, status: 'Draft' }, ...articles]);
    setToast?.({ message: 'Article created as draft', type: 'success' });
    setShowModal(false);
    setForm({ title: '', category: 'Getting Started', content: '' });
  };

  const togglePublish = (article) => {
    const next = article.status === 'Published' ? 'Draft' : 'Published';
    setArticles(articles.map(a => a.id === article.id ? { ...a, status: next } : a));
    setToast?.({ message: `"${article.title}" ${next === 'Published' ? 'published' : 'unpublished'}`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Support</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Knowledge Base</span>
          </div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Help articles and documentation for schools.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span> New Article
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="sa-select">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Title</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Updated</th><th className="px-6 py-3">Views</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{a.title}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}>{a.category}</span></td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{a.updated}</td>
                  <td className="px-6 py-3 text-sm">{a.views.toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.status === 'Published' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#6c7a76]/10 text-[#6c7a76]'}`}>{a.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => togglePublish(a)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
                      {a.status === 'Published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className={`w-full max-w-lg rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">New Article</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Title</label><input className="sa-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Article title" /></div>
              <div><label className="block text-sm font-semibold mb-1.5">Category</label><select className="sa-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-semibold mb-1.5">Content</label><textarea className="sa-input min-h-[120px] resize-none" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write article content..." /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save as Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
