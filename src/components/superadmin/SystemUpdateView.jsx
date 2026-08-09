import { useState, useEffect } from 'react';
import axios from 'axios';

const typeColors = { Major: 'bg-[#9d4224]/10 text-[#9d4224]', Minor: 'bg-[#0060ac]/10 text-[#0060ac]', Patch: 'bg-[#006b5c]/10 text-[#006b5c]' };

export default function SystemUpdateView({ dark, setToast }) {
  const [checking, setChecking] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newVersion, setNewVersion] = useState({ version: '', downloadUrl: '', releaseNotes: '', forceUpdate: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVersions = async () => {
    try {
      const res = await axios.get('/api/app-update', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVersions(res.data);
    } catch (error) {
      setToast?.({ message: 'Failed to fetch update history', type: 'error' });
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const checkUpdates = () => {
    setChecking(true);
    fetchVersions().then(() => {
      setChecking(false);
      setToast?.({ message: 'Update history refreshed!', type: 'success' });
    });
  };

  const handleRelease = async (e) => {
    e.preventDefault();
    if (!newVersion.version || !newVersion.downloadUrl) {
      return setToast?.({ message: 'Version and Download URL are required', type: 'error' });
    }
    
    setIsSubmitting(true);
    try {
      await axios.post('/api/app-update', newVersion, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setToast?.({ message: 'New version released successfully!', type: 'success' });
      setShowModal(false);
      setNewVersion({ version: '', downloadUrl: '', releaseNotes: '', forceUpdate: false });
      fetchVersions();
    } catch (error) {
      setToast?.({ message: 'Failed to release version', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const latest = versions.length > 0 ? versions[0] : null;

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">System Update</span></div>
          <h1 className="text-2xl font-bold">System Update</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Current version information and update history.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#006b5c] text-white rounded-xl text-sm font-semibold hover:bg-[#005a4e] transition-colors flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          Release Update
        </button>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#006b5c]/10 flex items-center justify-center"><span className="material-symbols-outlined text-[#006b5c] text-[28px]">verified</span></div>
          <div>
            <h2 className="text-xl font-bold">ERPZO {latest ? `v${latest.version}` : 'App'}</h2>
            <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{latest ? `Released ${new Date(latest.createdAt).toLocaleDateString()} · You are on the latest version` : 'No versions released yet'}</p>
          </div>
        </div>
        <button onClick={checkUpdates} disabled={checking} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${checking ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-[#e2e2e5] hover:bg-[#f3f3f6]'}`}>
          <span className={`material-symbols-outlined text-[18px] ${checking ? 'animate-spin' : ''}`}>sync</span> {checking ? 'Checking...' : 'Refresh History'}
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <h3 className="text-[15px] font-semibold">Update History</h3>
        </div>
        <div className="divide-y divide-[#e2e2e5] dark:divide-[#3c4a46]">
          {versions.length === 0 ? (
             <div className="p-8 text-center text-sm opacity-60">No update history found</div>
          ) : versions.map(u => (
            <div key={u.id} className={`p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${dark ? 'hover:bg-[#3c4a46]/30' : 'hover:bg-[#f3f3f6]'} transition-colors`}>
              <div className="flex items-center gap-3 sm:w-48 shrink-0">
                <span className="font-mono font-bold text-sm">v{u.version}</span>
                {u.forceUpdate && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors['Major']}`}>Force</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm">{u.releaseNotes || 'No release notes'}</p>
                <a href={u.downloadUrl} target="_blank" rel="noreferrer" className="text-xs text-[#006b5c] hover:underline mt-1 inline-block">Download Link</a>
              </div>
              <span className={`text-xs shrink-0 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden ${dark ? 'bg-[#2f3133] border border-[#3c4a46]' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="font-bold text-lg">Release New Version</h3>
              <button onClick={() => setShowModal(false)} className="text-[#6c7a76] hover:text-black dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRelease} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Version (e.g. 1.0.1)</label>
                <input required type="text" value={newVersion.version} onChange={(e) => setNewVersion({...newVersion, version: e.target.value})} className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#006b5c] ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-[#e2e2e5]'}`} placeholder="1.0.0" />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Download URL</label>
                <input required type="url" value={newVersion.downloadUrl} onChange={(e) => setNewVersion({...newVersion, downloadUrl: e.target.value})} className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#006b5c] ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-[#e2e2e5]'}`} placeholder="https://..." />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Release Notes</label>
                <textarea rows="3" value={newVersion.releaseNotes} onChange={(e) => setNewVersion({...newVersion, releaseNotes: e.target.value})} className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#006b5c] ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-[#e2e2e5]'}`} placeholder="What's new in this update..." />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="forceUpdate" checked={newVersion.forceUpdate} onChange={(e) => setNewVersion({...newVersion, forceUpdate: e.target.checked})} className="rounded text-[#006b5c] focus:ring-[#006b5c] w-4 h-4 cursor-pointer" />
                <label htmlFor="forceUpdate" className="text-sm font-medium cursor-pointer">Force Update?</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5a55]' : 'bg-[#f3f3f6] hover:bg-[#e8e8ea]'}`}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-[#006b5c] text-white hover:bg-[#005a4e] disabled:opacity-50">
                  {isSubmitting ? 'Releasing...' : 'Release Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
