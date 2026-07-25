import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminPage';

function CustomSelect({ value, onChange, options, dark, placeholder, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const displayLabel = options.find(o => o.value === value)?.label || placeholder || value;

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-4 pr-10 py-2.5 border focus:ring-2 transition-all text-sm cursor-pointer select-none ${className || 'rounded-xl'} ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] focus:ring-primary focus:border-primary text-white' : 'bg-[#f9f9fc] border-outline-variant focus:ring-primary focus:border-primary text-[#1a1c1e]'}`}
      >
        <span className="block truncate">{displayLabel}</span>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline transition-transform duration-200" style={{ fontSize: '20px', transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>expand_more</span>
      </div>
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-xl shadow-xl border overflow-hidden animate-fadeIn ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#eeeef0]'}`}>
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((opt, i) => (
              <li 
                key={i}
                onClick={() => handleSelect(opt.value)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  value === opt.value 
                    ? (dark ? 'bg-primary/20 text-primary font-semibold' : 'bg-[#00c2a8]/10 text-[#006b5c] font-semibold')
                    : (dark ? 'text-[#bbcac4] hover:bg-[#3c4a46] hover:text-white' : 'text-[#3c4a46] hover:bg-[#f3f3f6] hover:text-[#1a1c1e]')
                }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StaffView({ dark }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('Any Status');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Modal forms
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, staffId: '', name: '', role: '', department: '', phone: '', email: '', status: 'Active', joinDate: '' });
  const [toast, setToast] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/staff');
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error('Failed to fetch staff', err);
      setToast({ message: 'Failed to load staff records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(`http://localhost:3000/api/staff/${form.id}`, form);
        setToast({ message: 'Staff updated successfully', type: 'success' });
      } else {
        await axios.post('http://localhost:3000/api/staff', form);
        setToast({ message: 'Staff created successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Failed to save staff', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/staff/${id}`);
      setToast({ message: 'Staff deleted', type: 'success' });
      fetchStaff();
    } catch (err) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const toggleExpand = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.clear();
      next.add(id);
    }
    setExpandedRows(next);
  };

  const q = search.toLowerCase();
  
  const uniqueDepts = Array.from(new Set(staffList.map(s => s.department))).filter(Boolean);
  const uniqueRoles = Array.from(new Set(staffList.map(s => s.role))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(staffList.map(s => s.status))).filter(Boolean);

  const filtered = staffList.filter(s => {
    const nameStr = (s.name || '').toLowerCase();
    const idStr = (s.staffId || '').toLowerCase();
    const matchesSearch = !q || nameStr.includes(q) || idStr.includes(q);
    const matchesDept = departmentFilter === 'All Departments' || s.department === departmentFilter;
    const matchesRole = roleFilter === 'All Roles' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'Any Status' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  const openAddModal = () => {
    setForm({ id: null, staffId: '', name: '', role: '', department: '', phone: '', email: '', status: 'Active', joinDate: '' });
    setModalOpen(true);
  };

  const openEditModal = (s, e) => {
    e.stopPropagation();
    setForm({
      id: s.id,
      staffId: s.staffId,
      name: s.name,
      role: s.role,
      department: s.department,
      phone: s.phone || '',
      email: s.email || '',
      status: s.status,
      joinDate: s.joinDate ? new Date(s.joinDate).toISOString().split('T')[0] : ''
    });
    setModalOpen(true);
  };

  return (
    <div className={`p-5 lg:p-10 flex-1 space-y-6 animate-fadeIn ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-background text-on-surface'}`}>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className={`flex items-center gap-2 text-label-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>
            <span>Admin Portal</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Staff Management</span>
          </nav>
          <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Staff Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage non-teaching staff, administration, and support personnel.</p>
        </div>
        <button 
          className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-label-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95 duration-200"
          onClick={openAddModal}
        >
          <span className="material-symbols-outlined">person_add</span>
          Add New Staff
        </button>
      </div>

      {/* Filters & Search Bento */}
      <div className={`p-6 rounded-[24px] shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className="md:col-span-4">
          <label className={`text-sm font-semibold block mb-2 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Search Staff</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`} 
              placeholder="By name or ID..." 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className={`text-sm font-semibold block ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Department</label>
          <CustomSelect 
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[{ value: 'All Departments', label: 'All Departments' }, ...uniqueDepts.map(d => ({ value: d, label: d }))]}
            dark={dark}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className={`text-sm font-semibold block ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Role</label>
          <CustomSelect 
            value={roleFilter}
            onChange={setRoleFilter}
            options={[{ value: 'All Roles', label: 'All Roles' }, ...uniqueRoles.map(d => ({ value: d, label: d }))]}
            dark={dark}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className={`text-sm font-semibold block ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Status</label>
          <CustomSelect 
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'Any Status', label: 'Any Status' }, ...uniqueStatuses.map(d => ({ value: d, label: d }))]}
            dark={dark}
          />
        </div>
        <div className="md:col-span-2 flex items-end">
          <button className={`w-full py-2.5 px-4 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${dark ? 'bg-[#3c4a46] text-white hover:opacity-80' : 'bg-[#00c2a8] text-[#00493e] hover:brightness-95'}`}>
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filters
          </button>
        </div>
      </div>

      {/* Staff List Table Header */}
      <div className={`rounded-[24px] shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className={`hidden md:grid grid-cols-12 px-6 py-4 border-b text-xs font-semibold uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
          <div className="col-span-4">Staff Profile</div>
          <div className="col-span-2">Staff ID</div>
          <div className="col-span-2">Role / Dept</div>
          <div className="col-span-4 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-outline">Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-outline">No records found.</div>
        ) : (
          filtered.map(s => {
            const isExpanded = expandedRows.has(s.id);
            const initials = s.name.split(' ').map(n => n[0]).slice(0, 2).join('');
            
            return (
              <div key={s.id} className={`group border-b last:border-b-0 ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
                {/* Row */}
                <div 
                  className={`grid grid-cols-1 md:grid-cols-12 px-6 py-5 items-center transition-all cursor-pointer ${dark ? 'hover:bg-[#3c4a46]/50' : 'hover:bg-[#f3f3f6]'}`}
                  onClick={() => toggleExpand(s.id)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{s.name}</div>
                      <div className={`text-[11px] ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>{s.email || 'N/A'}</div>
                    </div>
                  </div>
                  <div className={`col-span-2 text-xs font-medium mt-2 md:mt-0 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
                    <span className="md:hidden text-outline text-[11px] block">Staff ID</span>
                    #{s.staffId}
                  </div>
                  <div className="col-span-2 mt-2 md:mt-0">
                    <span className="md:hidden text-outline text-[11px] block">Role / Dept</span>
                    <div className={`text-xs ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{s.role}</div>
                    <div className="text-[11px] text-tertiary">{s.department}</div>
                  </div>
                  <div className="col-span-4 flex items-center justify-end gap-3 mt-4 md:mt-0">
                    <button 
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        s.status === 'Active' 
                          ? 'bg-primary/20 text-primary' 
                          : s.status === 'Terminated' ? 'bg-error/20 text-error' : 'bg-outline/20 text-outline'
                      }`}
                    >
                      {s.status}
                    </button>
                    <button 
                      className="px-4 py-1.5 bg-[#00c2a8] text-[#00493e] rounded-lg text-xs font-semibold hover:brightness-95 transition-all flex items-center gap-1"
                      onClick={(e) => openEditModal(s, e)}
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </button>
                    <span className={`material-symbols-outlined text-outline transition-transform ml-2 text-[20px] ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} ${dark ? 'bg-[#1a1c1e]' : 'bg-surface'}`}>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-outline-variant/30">
                    <div className={`col-span-1 border-r pr-8 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                      <h4 className="font-label-lg text-tertiary mb-3">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Phone</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{s.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Email</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{s.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`col-span-1 border-r pr-8 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                      <h4 className="font-label-lg text-tertiary mb-3">Employment Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Join Date</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{s.joinDate ? new Date(s.joinDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Status</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{s.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <h4 className="font-label-lg text-error mb-3">Danger Zone</h4>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="w-full py-2 bg-error/10 text-error hover:bg-error/20 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Remove Staff Member
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal title={form.id ? 'Edit Staff' : 'Add New Staff'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Staff ID *</label>
                <input required type="text" value={form.staffId} onChange={e => setForm({...form, staffId: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Full Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Role *</label>
                <input required type="text" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Department *</label>
                <input required type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Status</label>
                <CustomSelect
                  value={form.status}
                  onChange={(val) => setForm({...form, status: val})}
                  options={[{value: 'Active', label: 'Active'}, {value: 'On Leave', label: 'On Leave'}, {value: 'Terminated', label: 'Terminated'}]}
                  dark={dark}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Join Date</label>
                <input type="date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-surface-container-high'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors shadow-md">
                {form.id ? 'Save Changes' : 'Create Staff'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
