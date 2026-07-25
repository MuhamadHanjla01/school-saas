import { useState } from 'react';

const MODULES = ['Users', 'Finance', 'Academics', 'Reports', 'Settings', 'Communication', 'Support'];

const initialRoles = [
  { id: 1, name: 'Super Admin', description: 'Full platform access', users: 3, permissions: MODULES.reduce((a, m) => ({ ...a, [m]: true }), {}) },
  { id: 2, name: 'School Admin', description: 'Full school-level access', users: 45, permissions: { Users: true, Finance: true, Academics: true, Reports: true, Settings: true, Communication: true, Support: false } },
  { id: 3, name: 'Teacher', description: 'Academic & student management', users: 184, permissions: { Users: false, Finance: false, Academics: true, Reports: true, Settings: false, Communication: true, Support: false } },
  { id: 4, name: 'Accountant', description: 'Finance & billing access', users: 12, permissions: { Users: false, Finance: true, Academics: false, Reports: true, Settings: false, Communication: false, Support: false } },
  { id: 5, name: 'Support Agent', description: 'Ticket & knowledge base access', users: 8, permissions: { Users: false, Finance: false, Academics: false, Reports: false, Settings: false, Communication: true, Support: true } },
  { id: 6, name: 'Viewer', description: 'Read-only access to reports', users: 22, permissions: { Users: false, Finance: false, Academics: false, Reports: true, Settings: false, Communication: false, Support: false } },
];

export default function RolePermissionView({ dark, setToast }) {
  const [roles, setRoles] = useState(initialRoles);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: MODULES.reduce((a, m) => ({ ...a, [m]: false }), {}) });

  const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', description: '', permissions: MODULES.reduce((a, m) => ({ ...a, [m]: false }), {}) }); setEditing(null); setShowModal(true); };
  const openEdit = (role) => { setForm({ name: role.name, description: role.description, permissions: { ...role.permissions } }); setEditing(role); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      setRoles(roles.map(r => r.id === editing.id ? { ...r, name: form.name, description: form.description, permissions: { ...form.permissions } } : r));
      setToast?.({ message: `Role "${form.name}" updated`, type: 'success' });
    } else {
      setRoles([...roles, { id: Date.now(), name: form.name, description: form.description, users: 0, permissions: { ...form.permissions } }]);
      setToast?.({ message: `Role "${form.name}" created`, type: 'success' });
    }
    setShowModal(false);
  };

  const handleDelete = (role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    setRoles(roles.filter(r => r.id !== role.id));
    setToast?.({ message: `Role "${role.name}" deleted`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            <span className="cursor-pointer hover:text-[#006b5c]">Dashboard</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="cursor-pointer hover:text-[#006b5c]">Personnel</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#006b5c] font-medium">Role & Permission</span>
          </div>
          <h1 className="text-2xl font-bold">Role & Permission</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage platform roles and their access permissions.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Role
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896] pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none transition-colors ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3] placeholder-[#6c7a76]' : 'bg-[#f3f3f6] border-[#e2e2e5] text-[#1a1c1e] placeholder-[#8b9896]'}`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Role</th>
                {MODULES.map(m => <th key={m} className="px-3 py-3 text-center">{m}</th>)}
                <th className="px-6 py-3">Users</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(role => (
                <tr key={role.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3">
                    <p className="font-semibold text-sm">{role.name}</p>
                    <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{role.description}</p>
                  </td>
                  {MODULES.map(m => (
                    <td key={m} className="px-3 py-3 text-center">
                      <span className={`material-symbols-outlined text-[18px] ${role.permissions[m] ? 'text-[#006b5c]' : dark ? 'text-[#3c4a46]' : 'text-[#e2e2e5]'}`}>
                        {role.permissions[m] ? 'check_circle' : 'cancel'}
                      </span>
                    </td>
                  ))}
                  <td className="px-6 py-3 text-sm font-medium">{role.users}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(role)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}>
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(role)} className="p-1.5 rounded-lg hover:bg-[#ffdad6]/40 text-[#ba1a1a]">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
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
              <h3 className="text-lg font-bold">{editing ? 'Edit Role' : 'Add Role'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Role Name</label>
                <input className="sa-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Content Manager" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <input className="sa-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief role description" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {MODULES.map(m => (
                    <label key={m} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#f3f3f6]'}`}>
                      <input type="checkbox" checked={form.permissions[m]} onChange={() => setForm({ ...form, permissions: { ...form.permissions, [m]: !form.permissions[m] } })} className="accent-[#006b5c] w-4 h-4" />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">{editing ? 'Save Changes' : 'Create Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
