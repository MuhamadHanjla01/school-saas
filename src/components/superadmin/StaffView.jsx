import { useState } from 'react';

const initialStaff = [
  { id: 1, name: 'James Wilson', email: 'j.wilson@erpzo.com', role: 'Super Admin', department: 'Engineering', status: 'Active', joined: 'Jan 15, 2023' },
  { id: 2, name: 'Emily Carter', email: 'e.carter@erpzo.com', role: 'Support Lead', department: 'Support', status: 'Active', joined: 'Mar 8, 2023' },
  { id: 3, name: 'Raj Patel', email: 'r.patel@erpzo.com', role: 'Developer', department: 'Engineering', status: 'Active', joined: 'Jun 22, 2023' },
  { id: 4, name: 'Sofia Martinez', email: 's.martinez@erpzo.com', role: 'Account Manager', department: 'Sales', status: 'Active', joined: 'Aug 5, 2023' },
  { id: 5, name: 'Alex Kim', email: 'a.kim@erpzo.com', role: 'Support Agent', department: 'Support', status: 'On Leave', joined: 'Oct 12, 2023' },
  { id: 6, name: 'Priya Sharma', email: 'p.sharma@erpzo.com', role: 'Designer', department: 'Product', status: 'Inactive', joined: 'Feb 1, 2024' },
];

const statusColors = {
  Active: 'bg-[#006b5c]/10 text-[#006b5c]',
  'On Leave': 'bg-[#0060ac]/10 text-[#0060ac]',
  Inactive: 'bg-[#9d4224]/10 text-[#9d4224]',
};

export default function StaffView({ dark, setToast }) {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', department: 'Engineering' });

  const departments = ['All', ...new Set(initialStaff.map(s => s.department))];
  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchDept = filterDept === 'All' || s.department === filterDept;
    return matchSearch && matchDept;
  });

  const openAdd = () => { setForm({ name: '', email: '', role: '', department: 'Engineering' }); setEditing(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, email: s.email, role: s.role, department: s.department }); setEditing(s); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) {
      setStaff(staff.map(s => s.id === editing.id ? { ...s, ...form } : s));
      setToast?.({ message: `${form.name} updated`, type: 'success' });
    } else {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setStaff([...staff, { id: Date.now(), ...form, status: 'Active', joined: today }]);
      setToast?.({ message: `${form.name} added to staff`, type: 'success' });
    }
    setShowModal(false);
  };

  const toggleStatus = (s) => {
    const next = s.status === 'Active' ? 'Inactive' : 'Active';
    setStaff(staff.map(x => x.id === s.id ? { ...x, status: next } : x));
    setToast?.({ message: `${s.name} marked as ${next}`, type: 'success' });
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
            <span className="text-[#006b5c] font-medium">Staff</span>
          </div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Manage platform team members and their roles.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold sa-gradient-primary hover:shadow-lg transition-all shrink-0">
          <span className="material-symbols-outlined text-[18px]">person_add</span> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'Total Staff', value: staff.length, icon: 'group', color: '#006b5c' },
          { label: 'Active', value: staff.filter(s => s.status === 'Active').length, icon: 'check_circle', color: '#006b5c' },
          { label: 'On Leave / Inactive', value: staff.filter(s => s.status !== 'Active').length, icon: 'schedule', color: '#9d4224' }
        ].map(kpi => (
          <div key={kpi.label} className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${kpi.color}15`, color: kpi.color }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{kpi.icon}</span>
            </div>
            <div>
              <p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{kpi.label}</p>
              <h3 className="text-2xl font-bold">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896]" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm outline-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#f0f0f3]' : 'bg-[#f3f3f6] border-[#e2e2e5]'}`} />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="sa-select">
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{s.email}</p>
                  </td>
                  <td className="px-6 py-3 text-sm">{s.role}</td>
                  <td className="px-6 py-3 text-sm">{s.department}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[s.status] || ''}`}>{s.status}</span>
                  </td>
                  <td className={`px-6 py-3 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>{s.joined}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}>
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => toggleStatus(s)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}>
                        <span className="material-symbols-outlined text-[18px]">{s.status === 'Active' ? 'person_off' : 'person'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 text-sm border-t ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#e2e2e5] text-[#6c7a76]'}`}>
          Showing {filtered.length} of {staff.length} staff members
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className={`w-full max-w-md rounded-2xl shadow-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">{editing ? 'Edit Staff' : 'Add Staff'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-[#eeeef0]'}`}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Full Name</label>
                <input className="sa-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Email</label>
                <input type="email" className="sa-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="john@erpzo.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Role</label>
                <input className="sa-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Developer" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Department</label>
                <select className="sa-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option>Engineering</option><option>Support</option><option>Sales</option><option>Product</option><option>Marketing</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">{editing ? 'Save' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
