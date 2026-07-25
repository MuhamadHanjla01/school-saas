import { useState } from 'react';

export default function SystemSettingsView({ dark, setToast }) {
  const [form, setForm] = useState({ platformName: 'ERPZO', supportEmail: 'support@erpzo.com', timezone: 'UTC', language: 'English', maintenance: false, maxUpload: '25' });

  const handleSave = (e) => { e.preventDefault(); setToast?.({ message: 'System settings saved', type: 'success' }); };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[800px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">System Settings</span>
        </div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Configure core platform settings.</p>
      </div>
      <form onSubmit={handleSave} className={`rounded-2xl border shadow-sm p-6 space-y-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div><label className="block text-sm font-semibold mb-1.5">Platform Name</label><input className="sa-input" value={form.platformName} onChange={e => setForm({ ...form, platformName: e.target.value })} /></div>
        <div><label className="block text-sm font-semibold mb-1.5">Support Email</label><input type="email" className="sa-input" value={form.supportEmail} onChange={e => setForm({ ...form, supportEmail: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold mb-1.5">Timezone</label><select className="sa-input" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}><option>UTC</option><option>US/Eastern</option><option>US/Pacific</option><option>Europe/London</option><option>Asia/Kolkata</option><option>Asia/Tokyo</option></select></div>
          <div><label className="block text-sm font-semibold mb-1.5">Language</label><select className="sa-input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}><option>English</option><option>Spanish</option><option>French</option><option>Hindi</option><option>Arabic</option></select></div>
        </div>
        <div><label className="block text-sm font-semibold mb-1.5">Max File Upload (MB)</label><input type="number" className="sa-input" value={form.maxUpload} onChange={e => setForm({ ...form, maxUpload: e.target.value })} /></div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${form.maintenance ? 'border-[#ba1a1a]/30 bg-[#ba1a1a]/5' : dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div><p className="text-sm font-semibold">Maintenance Mode</p><p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>When enabled, users will see a maintenance page.</p></div>
          <button type="button" onClick={() => setForm({ ...form, maintenance: !form.maintenance })} className={`w-12 h-7 rounded-full relative transition-colors ${form.maintenance ? 'bg-[#ba1a1a]' : dark ? 'bg-[#3c4a46]' : 'bg-[#e2e2e5]'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.maintenance ? 'left-6' : 'left-1'}`} /></button>
        </div>
        <button type="submit" className="w-full py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save Settings</button>
      </form>
    </div>
  );
}
