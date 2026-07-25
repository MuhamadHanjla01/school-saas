import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminPage';

export default function UserRolesView({ dark }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // Modal forms
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, username: '', email: '', role: 'Teacher', password: '' });
  const [toast, setToast] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setToast({ message: 'Failed to load user records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        // In real app, separate password change from profile update
        await axios.put(`http://localhost:3000/api/users/${form.id}`, {
          username: form.username,
          email: form.email,
          role: form.role
        });
        setToast({ message: 'User updated successfully', type: 'success' });
      } else {
        await axios.post('http://localhost:3000/api/users', form);
        setToast({ message: 'User created successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Failed to save user', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/users/${id}`);
      setToast({ message: 'User deleted', type: 'success' });
      fetchUsers();
    } catch (err) {
      setToast({ message: 'Failed to delete user', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = users.filter(u => 
    (u.username || '').toLowerCase().includes(q) || 
    (u.email || '').toLowerCase().includes(q) ||
    (u.role || '').toLowerCase().includes(q)
  );

  const openAddModal = () => {
    setForm({ id: null, username: '', email: '', role: 'Teacher', password: '' });
    setModalOpen(true);
  };

  const openEditModal = (u, e) => {
    e.stopPropagation();
    setForm({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      password: '' // Don't populate password on edit
    });
    setModalOpen(true);
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'SuperAdmin': return dark ? 'bg-error/20 text-[#ffb4ab]' : 'bg-error/10 text-error';
      case 'SchoolAdmin': return dark ? 'bg-tertiary/20 text-[#ffb4ab]' : 'bg-tertiary-container text-tertiary';
      case 'Teacher': return dark ? 'bg-primary/20 text-primary' : 'bg-primary-container text-primary';
      default: return dark ? 'bg-surface-variant/50 text-outline' : 'bg-surface-container-high text-on-surface-variant';
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
            <span>User & Role Management</span>
          </nav>
          <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>User & Role Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage user accounts, roles, and access permissions.</p>
        </div>
        <button 
          className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-label-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95 duration-200"
          onClick={openAddModal}
        >
          <span className="material-symbols-outlined">person_add</span>
          Add New User
        </button>
      </div>

      {/* Role Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', value: users.length, icon: 'group', color: '#0060ac' },
          { label: 'Administrators', value: users.filter(u => u.role.includes('Admin')).length, icon: 'shield_person', color: '#9d4224' },
          { label: 'Teachers', value: users.filter(u => u.role === 'Teacher').length, icon: 'school', color: '#006b5c' },
          { label: 'Staff/Others', value: users.filter(u => !['SuperAdmin', 'SchoolAdmin', 'Teacher'].includes(u.role)).length, icon: 'badge', color: '#5b5f62' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[24px] shadow-sm flex items-center justify-between ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
            <div>
              <div className={`text-sm font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{stat.label}</div>
              <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>{stat.value}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: stat.color }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className={`rounded-[24px] shadow-sm overflow-hidden flex flex-col ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className={`p-6 border-b flex items-center justify-between gap-4 ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`} 
              placeholder="Search users..." 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`border-b text-xs uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
              <tr>
                <th className="p-4 pl-6 font-semibold rounded-tl-xl">User Profile</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Last Active</th>
                <th className="p-4 pr-6 text-right font-semibold rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-outline">Loading users...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-outline">No users found.</td>
                </tr>
              ) : (
                filtered.map(u => {
                  const initials = (u.username || 'U').substring(0, 2).toUpperCase();
                  return (
                    <tr key={u.id} className={`border-b last:border-0 transition-colors group ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]/30' : 'border-[#eeeef0] hover:bg-[#f3f3f6]'}`}>
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-[#00897b] text-white font-bold shadow-sm">
                          {initials}
                        </div>
                        <div className={`font-semibold text-sm ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{u.username}</div>
                      </td>
                      <td className={`p-4 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{u.email || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className={`p-4 text-xs ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                        {new Date(u.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={(e) => openEditModal(u, e)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${dark ? 'hover:bg-[#3c4a46] text-white' : 'hover:bg-white text-[#1a1c1e] shadow-sm'}`} title="Edit">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(u.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-error/10 text-error`} title="Delete">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal title={form.id ? 'Edit User' : 'Add New User'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Username *</label>
                <input required type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`}>
                  <option>SchoolAdmin</option>
                  <option>Teacher</option>
                  <option>Staff</option>
                  <option>Student</option>
                </select>
              </div>
              {!form.id && (
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Password *</label>
                  <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-surface-container-high'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors shadow-md">
                {form.id ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
