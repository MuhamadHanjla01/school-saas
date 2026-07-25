import { useState } from 'react';

export default function WebSettingsView({ dark, setToast }) {
  const [form, setForm] = useState({ metaTitle: 'ERPZO - Smart School Management', metaDesc: 'All-in-one school management platform for modern institutions.', analyticsId: 'G-XXXXXXXXXX', headerScripts: '', ogImage: '' });
  const handleSave = (e) => { e.preventDefault(); setToast?.({ message: 'Web settings saved', type: 'success' }); };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[800px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Web Settings</span></div>
        <h1 className="text-2xl font-bold">Web Settings</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>SEO, analytics, and web-related configurations.</p>
      </div>
      <form onSubmit={handleSave} className={`rounded-2xl border shadow-sm p-6 space-y-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div><label className="block text-sm font-semibold mb-1.5">Meta Title</label><input className="sa-input" value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} /></div>
        <div><label className="block text-sm font-semibold mb-1.5">Meta Description</label><textarea className="sa-input min-h-[80px] resize-none" value={form.metaDesc} onChange={e => setForm({ ...form, metaDesc: e.target.value })} /></div>
        <div><label className="block text-sm font-semibold mb-1.5">Google Analytics ID</label><input className="sa-input font-mono" value={form.analyticsId} onChange={e => setForm({ ...form, analyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
        <div><label className="block text-sm font-semibold mb-1.5">Custom Header Scripts</label><textarea className="sa-input min-h-[80px] resize-none font-mono text-xs" value={form.headerScripts} onChange={e => setForm({ ...form, headerScripts: e.target.value })} placeholder="<!-- Custom scripts -->" /></div>
        <button type="submit" className="w-full py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save Settings</button>
      </form>
    </div>
  );
}
