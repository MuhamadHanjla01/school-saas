import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toast } from './AdminPage';

export default function AuditLogsView({ dark }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('https://erpzo-backend.onrender.com/api/audit-logs');
        setLogs(res.data.logs || []);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
        setToast({ message: 'Failed to load audit logs', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const q = search.toLowerCase();
  const filtered = logs.filter(l => 
    (l.userName || '').toLowerCase().includes(q) || 
    (l.action || '').toLowerCase().includes(q) ||
    (l.entity || '').toLowerCase().includes(q)
  );

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical': return dark ? 'bg-error/20 text-[#ffb4ab]' : 'bg-error/10 text-error';
      case 'Warning': return dark ? 'bg-tertiary/20 text-[#ffb4ab]' : 'bg-tertiary-container text-tertiary';
      case 'Info': 
      default: return dark ? 'bg-primary/20 text-primary' : 'bg-[#00c2a8]/10 text-[#006b5c]';
    }
  };

  return (
    <div className={`p-5 lg:p-10 flex-1 space-y-6 animate-fadeIn ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-background text-on-surface'}`}>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className={`flex items-center gap-2 text-label-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>
            <span>Admin Portal</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Audit Logs</span>
          </nav>
          <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>System Audit Logs</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Track administrative actions, security events, and system changes.</p>
        </div>
        <button className="px-6 py-3 bg-surface-container text-on-surface border border-outline-variant rounded-full font-label-lg flex items-center gap-2 hover:bg-surface-container-high transition-all shadow-sm active:scale-95 duration-200">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Logs
        </button>
      </div>

      {/* Filters & Search */}
      <div className={`p-6 rounded-[24px] shadow-sm mb-6 ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className="relative w-full max-w-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`} 
            placeholder="Search by user, action, or entity..." 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className={`rounded-[24px] shadow-sm overflow-hidden flex flex-col ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`border-b text-xs uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
              <tr>
                <th className="p-4 pl-6 font-semibold rounded-tl-xl">Timestamp</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Entity</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 pr-6 text-right font-semibold rounded-tr-xl">Details</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-outline">Loading audit logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-outline">No logs found matching your search.</td></tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className={`border-b last:border-0 transition-colors group ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]/30' : 'border-[#eeeef0] hover:bg-[#f3f3f6]'}`}>
                    <td className={`p-4 pl-6 font-mono text-xs ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold uppercase">
                          {l.userName.substring(0, 2)}
                        </div>
                        <span className={`font-semibold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{l.userName}</span>
                      </div>
                    </td>
                    <td className={`p-4 font-medium ${dark ? 'text-white' : 'text-on-surface'}`}>{l.action}</td>
                    <td className={`p-4 text-xs ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{l.entity}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getSeverityStyle(l.severity)}`}>
                        {l.severity || 'Info'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center ml-auto transition-colors hover:bg-surface-container-high text-outline" title="View Payload">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
