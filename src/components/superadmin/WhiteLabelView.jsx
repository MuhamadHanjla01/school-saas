import { useState } from 'react';

export default function WhiteLabelView({ dark, setToast }) {
  const [form, setForm] = useState({ brandName: 'ERPZO', primaryColor: '#006b5c', secondaryColor: '#0060ac', domain: 'app.erpzo.com', loginTitle: 'Welcome to ERPZO', footerText: 'Powered by ERPZO' });
  const handleSave = (e) => { e.preventDefault(); setToast?.({ message: 'White-label settings saved', type: 'success' }); };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1200px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">White-label</span></div>
        <h1 className="text-2xl font-bold">White-label Branding</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Customize platform branding for client schools.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className={`rounded-2xl border shadow-sm p-6 space-y-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <h3 className="text-[15px] font-semibold">Brand Configuration</h3>
          <div><label className="block text-sm font-semibold mb-1.5">Brand Name</label><input className="sa-input" value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Primary Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                <input className="sa-input font-mono text-xs flex-1" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Secondary Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                <input className="sa-input font-mono text-xs flex-1" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} />
              </div>
            </div>
          </div>
          <div><label className="block text-sm font-semibold mb-1.5">Custom Domain</label><input className="sa-input" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="app.yourdomain.com" /></div>
          <div><label className="block text-sm font-semibold mb-1.5">Login Page Title</label><input className="sa-input" value={form.loginTitle} onChange={e => setForm({ ...form, loginTitle: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold mb-1.5">Footer Text</label><input className="sa-input" value={form.footerText} onChange={e => setForm({ ...form, footerText: e.target.value })} /></div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Logo</label>
            <div className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${dark ? 'border-[#3c4a46] hover:border-[#006b5c]' : 'border-[#e2e2e5] hover:border-[#006b5c]'}`}>
              <span className="material-symbols-outlined text-[32px] text-[#8b9896] mb-1">upload</span>
              <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Click to upload logo (PNG, SVG)</p>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save Branding</button>
        </form>

        <div className={`rounded-2xl border shadow-sm p-6 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <h3 className="text-[15px] font-semibold mb-4">Live Preview</h3>
          <div className="rounded-xl overflow-hidden border border-[#e2e2e5] shadow-md">
            <div className="h-12 flex items-center px-4 gap-3" style={{ background: form.primaryColor }}>
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><span className="text-white text-xs font-bold">{form.brandName[0]}</span></div>
              <span className="text-white font-bold text-sm">{form.brandName}</span>
            </div>
            <div className="bg-[#f9f9fc] p-6 text-center">
              <h2 className="text-lg font-bold mb-2" style={{ color: form.primaryColor }}>{form.loginTitle}</h2>
              <div className="max-w-[200px] mx-auto space-y-2 mb-4">
                <div className="h-8 rounded-lg bg-[#eeeef0] border border-[#e2e2e5]" />
                <div className="h-8 rounded-lg bg-[#eeeef0] border border-[#e2e2e5]" />
                <div className="h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center" style={{ background: form.primaryColor }}>Sign In</div>
              </div>
              <p className="text-[10px] text-[#6c7a76]">{form.footerText}</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-[#006b5c]/5 border border-[#006b5c]/10">
            <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
              <strong>Domain:</strong> {form.domain}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
