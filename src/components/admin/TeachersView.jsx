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

export default function TeachersView({ dark }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [designationFilter, setDesignationFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('Any Status');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Password Reset
  const [resetPasswordTeacher, setResetPasswordTeacher] = useState(null);
  const [resetForm, setResetForm] = useState({ oldPassword: '', newPassword: '' });
  const [toast, setToast] = useState(null);

  // Promote
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteForm, setPromoteForm] = useState({ teacherId: '', classId: '', department: '', title: '' });
  const [classes, setClasses] = useState([]);

  // Edit Teacher
  const [editTeacher, setEditTeacher] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', department: '', status: 'Active', avatar: null });

  const submitPromote = async (e) => {
    e.preventDefault();
    if (!promoteForm.teacherId) {
      setToast({ message: 'Please select a teacher', type: 'error' });
      return;
    }
    try {
      await axios.put(`https://school-backend-70ny.onrender.com/api/teachers/${promoteForm.teacherId}/promote`, {
        classId: promoteForm.classId,
        department: promoteForm.department,
        title: promoteForm.title
      });
      setToast({ message: 'Teacher promoted successfully!', type: 'success' });
      setPromoteModalOpen(false);
      setPromoteForm({ teacherId: '', classId: '', department: '', title: '' });
      // Reload teachers to reflect changes
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/teachers');
      setTeachers(res.data.teachers.map(t => ({
        ...t,
        id_db: t.id,
        id: t.employeeId || t.id || '',
        dept: t.department || '',
        subject: t.subjectNames?.join(', ') || 'N/A',
        classes: t.classCount || 0,
      })));
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to promote teacher', type: 'error' });
    }
  };

  const submitPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetForm.newPassword) return;
    try {
      const res = await axios.post(`https://school-backend-70ny.onrender.com/api/teachers/${resetPasswordTeacher.id}/reset-password`, {
        newPassword: resetForm.newPassword,
        oldPassword: resetForm.oldPassword
      });
      setToast({ message: `Password successfully updated!`, type: 'success' });
      setResetPasswordTeacher(null);
      setResetForm({ oldPassword: '', newPassword: '' });
      // Update teachers locally to show the new password in the modal if opened again
      setTeachers(prev => prev.map(t => t.id === resetPasswordTeacher.id ? { ...t, user: { ...t.user, plainPassword: resetForm.newPassword } } : t));
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update password', type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTeacher) return;
    try {
      const dbId = editTeacher.id_db || editTeacher.id;
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('phone', editForm.phone);
      formData.append('department', editForm.department);
      formData.append('status', editForm.status);
      if (editForm.avatar) {
        formData.append('avatar', editForm.avatar);
      }

      const token = localStorage.getItem('school_token');
      await axios.put(`https://school-backend-70ny.onrender.com/api/teachers/${dbId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      setToast({ message: `Teacher updated successfully`, type: 'success' });
      setEditTeacher(null);
      
      // Reload teachers
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/teachers');
      setTeachers(res.data.teachers.map(t => ({
        ...t,
        id_db: t.id,
        id: t.employeeId || t.id || '',
        dept: t.department || '',
        subject: t.subjectNames?.join(', ') || 'N/A',
        classes: t.classCount || 0,
      })));
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update teacher', type: 'error' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resTeachers = await axios.get('https://school-backend-70ny.onrender.com/api/teachers');
        if (resTeachers.data?.teachers) {
          const formatted = resTeachers.data.teachers.map(t => ({
            ...t,
            id_db: t.id,
            id: t.employeeId || t.id || '',
            dept: t.department || '',
            subject: t.subjectNames?.join(', ') || 'N/A',
            classes: t.classCount || 0,
          }));
          setTeachers(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch teachers', err);
      } finally {
        setLoading(false);
      }

      try {
        const resClasses = await axios.get('https://school-backend-70ny.onrender.com/api/classes');
        setClasses(resClasses.data?.classes || []);
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchData();
  }, []);

  const toggleExpand = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.clear(); // like the HTML JS, only one open at a time
      next.add(id);
    }
    setExpandedRows(next);
  };

  const q = search.toLowerCase();
  
  // Extract unique filter options
  const uniqueDepts = Array.from(new Set(teachers.map(t => t.dept))).filter(Boolean);
  const uniqueDesignations = Array.from(new Set(['Teacher', 'HOD (Head of Dept)', ...teachers.map(t => t.title || 'Teacher')])).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(teachers.map(t => t.status))).filter(Boolean);

  const filtered = teachers.filter(t => {
    const nameStr = (t.name || '').toLowerCase();
    const idStr = (t.id || t.employeeId || '').toLowerCase();
    const subjStr = (t.subject || '').toLowerCase();
    const matchesSearch = !q || nameStr.includes(q) || idStr.includes(q) || subjStr.includes(q);
    const matchesDept = departmentFilter === 'All Departments' || t.dept === departmentFilter;
    const matchesDesignation = designationFilter === 'All Roles' || (t.title || 'Teacher') === designationFilter;
    const matchesStatus = statusFilter === 'Any Status' || t.status === statusFilter;
    return matchesSearch && matchesDept && matchesDesignation && matchesStatus;
  });

  return (
    <div className={`p-5 lg:p-10 flex-1 space-y-6 animate-fadeIn ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-background text-on-surface'}`}>
      {/* Header & Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className={`flex items-center gap-2 text-label-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>
            <span>Admin Portal</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Teacher Management</span>
          </nav>
          <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Teacher Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage, evaluate, and support district-wide faculty members.</p>
        </div>
        <button 
          className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-label-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95 duration-200"
          onClick={() => setPromoteModalOpen(true)}
        >
          <span className="material-symbols-outlined">upgrade</span>
          Promote Teacher
        </button>
      </div>

      {/* Filters & Search Bento */}
      <div className={`p-6 rounded-[24px] shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className="md:col-span-4">
          <label className={`text-sm font-semibold block mb-2 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Search Records</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`} 
              placeholder="By name, ID, or subject..." 
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
            options={[
              { value: 'All Departments', label: 'All Departments' },
              ...uniqueDepts.map(d => ({ value: d, label: d }))
            ]}
            dark={dark}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className={`text-sm font-semibold block ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Designation</label>
          <CustomSelect 
            value={designationFilter}
            onChange={setDesignationFilter}
            options={[
              { value: 'All Roles', label: 'All Roles' },
              ...uniqueDesignations.map(d => ({ value: d, label: d }))
            ]}
            dark={dark}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className={`text-sm font-semibold block ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Status</label>
          <CustomSelect 
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'Any Status', label: 'Any Status' },
              ...uniqueStatuses.map(d => ({ value: d, label: d }))
            ]}
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

      {/* Teacher List Table Header */}
      <div className={`rounded-[24px] shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className={`hidden md:grid grid-cols-12 px-6 py-4 border-b text-xs font-semibold uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
          <div className="col-span-4">Teacher Profile</div>
          <div className="col-span-2">Employee ID</div>
          <div className="col-span-2">Dept &amp; Designation</div>
          <div className="col-span-4 text-right">Administrative Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-outline">Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-outline">No records found.</div>
        ) : (
          filtered.map(t => {
            const isExpanded = expandedRows.has(t.id);
            // Derive initials for avatar fallback
            const initials = t.name.split(' ').map(n => n[0]).slice(0, 2).join('');
            
            return (
              <div key={t.id} className={`group border-b last:border-b-0 ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
                {/* Row */}
                <div 
                  className={`grid grid-cols-1 md:grid-cols-12 px-6 py-5 items-center transition-all cursor-pointer ${dark ? 'hover:bg-[#3c4a46]/50' : 'hover:bg-[#f3f3f6]'}`}
                  onClick={() => toggleExpand(t.id)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{t.name}</div>
                      <div className={`text-[11px] ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>{t.email || `${t.id.toLowerCase()}@edu.example`}</div>
                    </div>
                  </div>
                  <div className={`col-span-2 text-xs font-medium mt-2 md:mt-0 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
                    <span className="md:hidden text-outline text-[11px] block">Employee ID</span>
                    #{t.id}
                  </div>
                  <div className="col-span-2 mt-2 md:mt-0">
                    <span className="md:hidden text-outline text-[11px] block">Dept &amp; Designation</span>
                    <div className={`text-xs ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{t.dept}</div>
                    <div className="text-[11px] text-[#006b5c]">{t.title || 'Teacher'}</div>
                  </div>
                  <div className="col-span-4 flex items-center justify-end gap-3 mt-4 md:mt-0">
                    <button 
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${dark ? 'text-[#bbcac4] hover:bg-[#3c4a46] hover:text-white' : 'text-outline hover:bg-[#eeeef0] hover:text-[#1a1c1e]'}`}
                      title="Reset Password"
                      onClick={(e) => { e.stopPropagation(); setResetPasswordTeacher(t); }}
                    >
                      <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                    </button>
                    <button 
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${dark ? 'text-[#bbcac4] hover:text-[#00c2a8] hover:bg-[#3c4a46]' : 'text-outline hover:text-[#006b5c] hover:bg-[#eeeef0]'}`}
                      title="Edit Teacher"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditTeacher(t); 
                        setEditForm({ name: t.name || '', phone: t.phone || '', department: t.dept || '', status: t.status || 'Active', avatar: null }); 
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button 
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dark ? 'text-[#bbcac4] hover:bg-[#3c4a46] hover:text-white' : 'text-[#3c4a46] hover:bg-[#eeeef0]'}`}
                      onClick={(e) => { e.stopPropagation(); /* Update Status */ }}
                    >
                      {t.status === 'Active' ? 'Active' : 'On Leave'}
                    </button>
                    <button 
                      className="px-4 py-1.5 bg-[#00c2a8] text-[#00493e] rounded-lg text-xs font-semibold hover:brightness-95 transition-all"
                      onClick={(e) => { e.stopPropagation(); /* View Details */ }}
                    >
                      Details
                    </button>
                    <span className={`material-symbols-outlined text-outline transition-transform ml-2 text-[20px] ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} ${dark ? 'bg-[#1a1c1e]' : 'bg-surface'}`}
                >
                  <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-outline-variant/30">
                    <div className={`col-span-1 border-r pr-8 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                      <h4 className="font-label-lg text-primary mb-3">Specialization</h4>
                      <p className={`text-body-md leading-relaxed ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                        {t.about || `Subject matter expert in ${t.subject}.`}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {t.subject.split(', ').map(subj => (
                          <span key={subj} className="px-2 py-1 bg-primary-container/20 text-on-primary-container text-[11px] font-bold rounded uppercase">
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`col-span-1 border-r pr-8 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                      <h4 className="font-label-lg text-primary mb-3">Today's Schedule</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center justify-between text-body-md">
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{t.subject.split(', ')[0] || 'Class'}</span>
                          <span className="text-outline text-label-sm">09:00 AM</span>
                        </li>
                        <li className="flex items-center justify-between text-body-md">
                          <span className={dark ? 'text-white' : 'text-on-surface'}>Faculty Meet</span>
                          <span className="text-outline text-label-sm">03:00 PM</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className={`col-span-1 border-r pr-8 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                      <h4 className="font-label-lg text-primary mb-3">Performance Metrics</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-label-sm mb-1">
                            <span className={dark ? 'text-white' : 'text-on-surface'}>Attendance Rate</span>
                            <span className="font-bold text-primary">98.4%</span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${dark ? 'bg-[#3c4a46]' : 'bg-outline-variant'}`}>
                            <div className="h-full bg-primary-container" style={{ width: '98.4%' }}></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined">payments</span>
                          </div>
                          <div>
                            <div className="text-label-sm text-outline">Recent Payroll</div>
                            <div className={`text-body-md font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>Processed</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`col-span-1 p-4 rounded-xl border ${dark ? 'bg-[#262829] border-primary/20' : 'bg-surface-container-lowest border-primary/10'}`}>
                      <h4 className={`font-label-lg mb-2 ${dark ? 'text-white' : 'text-on-surface'}`}>Internal Note</h4>
                      <p className={`text-label-sm italic ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                        "Consistently receives high student feedback. Actively participating in extracurriculars."
                      </p>
                      <button className="mt-4 text-primary text-label-sm font-bold flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit Record
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination / Footer Actions */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className={`text-body-md ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
          Showing <span className={`font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>1 - {filtered.length}</span> of <span className={`font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>{teachers.length}</span> total teachers
        </div>
        <div className="flex items-center gap-2">
          <button className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-outline-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container font-bold">1</button>
          <button className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-outline-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetPasswordTeacher && (
        <Modal title={`Change Password for ${resetPasswordTeacher.name}`} onClose={() => setResetPasswordTeacher(null)}>
          <form onSubmit={submitPasswordReset} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Email (Fixed)</label>
              <input type="email" value={resetPasswordTeacher.email || `${(resetPasswordTeacher.id || 'unknown').toLowerCase()}@edu.example`} disabled className={`w-full p-2 rounded-lg cursor-not-allowed opacity-70 ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46]' : 'bg-surface-container border border-outline-variant'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Old Password</label>
              <input type="text" value={resetPasswordTeacher.user?.plainPassword || 'teacher123'} disabled className={`w-full p-2 rounded-lg cursor-not-allowed opacity-70 ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface-container border border-outline-variant text-[#1a1c1e]'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">New Password</label>
              <input type="text" required value={resetForm.newPassword} onChange={e => setResetForm({...resetForm, newPassword: e.target.value})} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-primary transition-all ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface border border-outline-variant text-[#1a1c1e]'}`} placeholder="Enter new password" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setResetPasswordTeacher(null)} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors">Update Password</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Teacher Modal */}
      {editTeacher && (
        <Modal title={`Edit Profile: ${editTeacher.name}`} onClose={() => setEditTeacher(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Name</label>
              <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-primary transition-all ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface border border-outline-variant text-[#1a1c1e]'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Phone</label>
              <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-primary transition-all ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface border border-outline-variant text-[#1a1c1e]'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Department</label>
              <CustomSelect
                value={editForm.department}
                onChange={(val) => setEditForm({ ...editForm, department: val })}
                options={[
                  { value: '', label: 'Select Department' },
                  ...uniqueDepts.map(d => ({ value: d, label: d }))
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Status</label>
              <CustomSelect
                value={editForm.status}
                onChange={(val) => setEditForm({ ...editForm, status: val })}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'On Leave', label: 'On Leave' }
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Profile Photo / Avatar</label>
              <input type="file" accept="image/*" onChange={e => setEditForm({...editForm, avatar: e.target.files[0]})} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface border border-outline-variant text-[#1a1c1e]'}`} />
              <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Leave blank to keep current photo.</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setEditTeacher(null)} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Promote Teacher Modal */}
      {promoteModalOpen && (
        <Modal title="Promote Teacher" onClose={() => setPromoteModalOpen(false)}>
          <form onSubmit={submitPromote} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Select Teacher</label>
              <CustomSelect
                value={promoteForm.teacherId}
                onChange={(val) => {
                  const t = teachers.find(x => x.id_db === val || x.employeeId === val || x.id === val);
                  setPromoteForm({ ...promoteForm, teacherId: t?.id_db || t?.id, department: t?.dept || '', title: t?.title || '' });
                }}
                options={[
                  { value: '', label: 'Select a teacher' },
                  ...teachers.map(t => ({ value: t.id_db || t.id, label: t.name }))
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Promote to Class Teacher (Optional)</label>
              <CustomSelect
                value={promoteForm.classId}
                onChange={(val) => setPromoteForm({ ...promoteForm, classId: val })}
                options={[
                  { value: '', label: 'None' },
                  ...classes.map(c => ({ value: c.id, label: c.name }))
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">New Department</label>
              <CustomSelect
                value={promoteForm.department}
                onChange={(val) => setPromoteForm({ ...promoteForm, department: val })}
                options={[
                  { value: '', label: 'Select Department' },
                  ...uniqueDepts.map(d => ({ value: d, label: d }))
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">New Designation</label>
              <CustomSelect
                value={promoteForm.title}
                onChange={(val) => setPromoteForm({ ...promoteForm, title: val })}
                options={[
                  { value: '', label: 'Select Designation' },
                  ...uniqueDesignations.map(d => ({ value: d, label: d }))
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setPromoteModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors">Promote</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
