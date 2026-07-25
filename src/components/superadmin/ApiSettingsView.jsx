import { useState } from 'react';

const initialKeys = [
  { id: 1, name: 'Production API Key', key: 'sk_live_••••••••••••••••4f8a', created: 'Jun 15, 2024', lastUsed: '2 min ago', status: 'Active' },
  { id: 2, name: 'Staging API Key', key: 'sk_test_••••••••••••••••7b2c', created: 'Aug 1, 2024', lastUsed: '1 hr ago', status: 'Active' },
  { id: 3, name: 'Old Integration Key', key: 'sk_live_••••••••••••••••1d3e', created: 'Jan 10, 2024', lastUsed: 'Oct 1, 2024', status: 'Revoked' },
];

export default function ApiSettingsView({ dark, setToast }) {
  const [keys, setKeys] = useState(initialKeys);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: { read: true, write: false, delete: false } });
  const [rateLimit, setRateLimit] = useState({ perMin: '100', perDay: '10000' });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newKey = `sk_live_${'x'.repeat(16)}${Math.random().toString(36).slice(2, 6)}`;
    setKeys([{ id: Date.now(), name: form.name, key: newKey, created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), lastUsed: 'Never', status: 'Active' }, ...keys]);
    setToast?.({ message: 'API key generated', type: 'success' });
    setShowModal(false);
    setForm({ name: '', permissions: { read: true, write: false, delete: false } });
  };

  const revokeKey = (k) => {
    if (!window.confirm(`Revoke "${k.name}"?`)) return;
    setKeys(keys.map(x => x.id === k.id ? { ...x, status: 'Revoked' } : x));
    setToast?.({ message: `${k.name} revoked`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">API Settings</span></div>
          <h1 className="text-2xl font-bold">API Settings</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage API keys and rate limiting.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">key</span> Generate Key
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Name</th><th className="px-6 py-3">Key</th><th className="px-6 py-3">Created</th><th className="px-6 py-3">Last Used</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3 font-semibold text-sm">{k.name}</td>
                  <td className="px-6 py-3 text-xs font-mono">{k.key}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{k.created}</td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{k.lastUsed}</td>
                  <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${k.status === 'Active' ? 'bg-[#006b5c]/10 text-[#006b5c]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'}`}>{k.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    {k.status === 'Active' && <button onClick={() => revokeKey(k)} className="text-[#ba1a1a] text-xs font-semibold hover:underline">Revoke</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`rounded-2xl border shadow-sm p-6 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <h3 className="text-[15px] font-semibold mb-4">Rate Limiting</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div><label className="block text-sm font-semibold mb-1.5">Requests / minute</label><input type="number" className="sa-input" value={rateLimit.perMin} onChange={e => setRateLimit({ ...rateLimit, perMin: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold mb-1.5">Requests / day</label><input type="number" className="sa-input" value={rateLimit.perDay} onChange={e => setRateLimit({ ...rateLimit, perDay: e.target.value })} /></div>
        </div>
        <button onClick={() => setToast?.({ message: 'Rate limits updated', type: 'success' })} className="mt-4 px-5 py-2 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save Limits</button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Generate API Key</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold mb-1.5">Key Name</label><input className="sa-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Mobile App Key" /></div>
              <div>
                <label className="block text-sm font-semibold mb-2">Permissions</label>
                <div className="space-y-2">
                  {['read', 'write', 'delete'].map(p => (
                    <label key={p} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#f3f3f6]'}`}>
                      <input type="checkbox" checked={form.permissions[p]} onChange={() => setForm({ ...form, permissions: { ...form.permissions, [p]: !form.permissions[p] } })} className="accent-[#006b5c] w-4 h-4" />
                      <span className="text-sm capitalize">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
