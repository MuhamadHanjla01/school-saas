import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminPage';
import { useAuth } from '../../context/AuthContext';
import StudentOnboardingWizard from './StudentOnboardingWizard';
import EditStudentModal from './EditStudentModal';

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
        className={`w-full pl-4 pr-10 py-2 border focus:ring-2 transition-all text-sm cursor-pointer select-none ${className || 'rounded-xl'} ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] focus:ring-primary focus:border-primary text-white' : 'bg-[#f9f9fc] border-outline-variant focus:ring-primary focus:border-primary text-[#1a1c1e]'}`}
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

export default function StudentsView({ dark }) {
  const { user } = useAuth();
  const schoolDomain = user?.schoolName ? `${user.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'school.com';

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [sectionFilter, setSectionFilter] = useState('All Sections');
  const [statusFilter, setStatusFilter] = useState('Active');
  
  // State
  const [expandedRows, setExpandedRows] = useState({}); // { studentId: { loading: boolean, data: object } }
  const [promoteStudent, setPromoteStudent] = useState(null);
  const [promoteClassId, setPromoteClassId] = useState('');
  const [resetPasswordStudent, setResetPasswordStudent] = useState(null);
  const [resetForm, setResetForm] = useState({ oldPassword: '', newPassword: '' });
  const [toast, setToast] = useState(null);

  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', guardianName: '', status: 'Active', avatar: null });

  const fetchStudents = async () => {
    try {
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/students');
      const formatted = res.data.students.map(s => ({
        ...s,
        id: s.studentId,
        class: s.className,
        guardian: s.guardianName,
        fee: s.feeStatus,
      }));
      setStudents(formatted);
    } catch (err) {
      console.error('Failed to fetch students', err);
      setToast({ message: 'Failed to fetch students', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const submitPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetForm.newPassword) return;
    try {
      const dbId = resetPasswordStudent.id_db || resetPasswordStudent.id;
      const res = await axios.post(`https://school-backend-70ny.onrender.com/api/students/${dbId}/reset-password`, {
        newPassword: resetForm.newPassword,
        oldPassword: resetForm.oldPassword
      });
      setToast({ message: `Password successfully updated!`, type: 'success' });
      setResetPasswordStudent(null);
      setResetForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update password', type: 'error' });
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!promoteClassId) return;
    try {
      await axios.put(`https://school-backend-70ny.onrender.com/api/students/${promoteStudent.id_db || promoteStudent.id}`, { classId: promoteClassId });
      setToast({ message: `Student promoted successfully`, type: 'success' });
      setPromoteStudent(null);
      setPromoteClassId('');
      fetchStudents();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to promote student', type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    try {
      const dbId = editStudent.id_db || editStudent.id;
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('phone', editForm.phone);
      formData.append('guardianName', editForm.guardianName);
      formData.append('status', editForm.status);
      if (editForm.avatar) {
        formData.append('avatar', editForm.avatar);
      }

      await axios.put(`https://school-backend-70ny.onrender.com/api/students/${dbId}`, formData);
      
      setToast({ message: `Student updated successfully`, type: 'success' });
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update student', type: 'error' });
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${student.name}? This action cannot be undone.`)) return;
    try {
      const dbId = student.id_db || student.id;
      await axios.delete(`https://school-backend-70ny.onrender.com/api/students/${dbId}`);
      setToast({ message: 'Student deleted successfully', type: 'success' });
      // Remove from expanded rows if open
      const newExpanded = { ...expandedRows };
      delete newExpanded[dbId];
      setExpandedRows(newExpanded);
      fetchStudents();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to delete student', type: 'error' });
    }
  };

  const toggleDetails = async (dbId) => {
    // If already expanded, collapse it
    if (expandedRows[dbId]) {
      const newExpanded = { ...expandedRows };
      delete newExpanded[dbId];
      setExpandedRows(newExpanded);
      return;
    }

    // Set loading state
    setExpandedRows(prev => ({ ...prev, [dbId]: { loading: true, data: null } }));

    // Fetch details
    try {
      const res = await axios.get(`https://school-backend-70ny.onrender.com/api/students/${dbId}`);
      setExpandedRows(prev => ({ ...prev, [dbId]: { loading: false, data: res.data.student } }));
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load details', type: 'error' });
      const newExpanded = { ...expandedRows };
      delete newExpanded[dbId];
      setExpandedRows(newExpanded);
    }
  };

  const q = search.toLowerCase();
  const filtered = students.filter(s => {
    const sClassName = (s.class || '').split('-')[0]?.trim() || s.class;
    const sSection = (s.class || '').split('-')[1]?.trim() || '-';
    
    const matchSearch = (s.name || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q) || (s.class || '').toLowerCase().includes(q);
    const matchClass = classFilter === 'All Classes' || sClassName === classFilter;
    const matchSection = sectionFilter === 'All Sections' || sSection === sectionFilter;
    
    return matchSearch && matchClass && matchSection;
  });

  const uniqueClasses = Array.from(new Set(classes.map(c => c.name.split('-')[0]?.trim()))).filter(Boolean).sort();
  const uniqueSections = Array.from(new Set(classes.map(c => c.name.split('-')[1]?.trim()))).filter(Boolean).sort();

  return (
    <div className={`p-5 lg:p-10 flex-1 space-y-6 animate-fadeIn ${dark ? 'bg-[#1a1c1e]' : 'bg-[#f9f9fc]'}`}>
      
      {/* Filters & Stats Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-12 p-6 rounded-[24px] shadow-sm ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className={`text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'} block`}>Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] focus:ring-primary focus:border-primary text-white' : 'bg-[#f9f9fc] border-outline-variant focus:ring-primary focus:border-primary text-[#1a1c1e]'}`} 
                  placeholder="Search by name, ID or email..." 
                  type="text"
                />
              </div>
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className={`text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'} block`}>Class</label>
              <CustomSelect
                value={classFilter}
                onChange={setClassFilter}
                options={[
                  { value: 'All Classes', label: 'All Classes' },
                  ...uniqueClasses.map(c => ({ value: c, label: c }))
                ]}
                dark={dark}
              />
            </div>
            <div className="w-full md:w-40 space-y-2">
              <label className={`text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'} block`}>Section</label>
              <CustomSelect
                value={sectionFilter}
                onChange={setSectionFilter}
                options={[
                  { value: 'All Sections', label: 'All Sections' },
                  ...uniqueSections.map(s => ({ value: s, label: s }))
                ]}
                dark={dark}
              />
            </div>
            <button className="bg-[#00c2a8] text-[#00493e] px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:brightness-95 active:scale-95 transition-all">
              <span className="material-symbols-outlined">filter_list</span>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className={`rounded-[24px] shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className={`px-8 py-6 flex justify-between items-center border-b ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
          <h3 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Student Records</h3>
          <div className="flex gap-2">
            <button className={`p-2 rounded-lg transition-colors ${dark ? 'text-primary hover:bg-primary/20' : 'text-[#006b5c] hover:bg-[#006b5c]/10'}`}>
              <span className="material-symbols-outlined">download</span>
            </button>
            <button className={`p-2 rounded-lg transition-colors ${dark ? 'text-primary hover:bg-primary/20' : 'text-[#006b5c] hover:bg-[#006b5c]/10'}`}>
              <span className="material-symbols-outlined">print</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={dark ? 'bg-[#1a1c1e]/50' : 'bg-[#f3f3f6]'}>
                <th className={`px-8 py-4 text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Name</th>
                <th className={`px-8 py-4 text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Student ID</th>
                <th className={`px-8 py-4 text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Class</th>
                <th className={`px-8 py-4 text-sm font-semibold ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Section</th>
                <th className={`px-8 py-4 text-sm font-semibold text-right ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-[#3c4a46]' : 'divide-[#eeeef0]'}`}>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-outline">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-outline">No students found.</td></tr>
              ) : (
                filtered.map(s => {
                  const dbId = s.id_db || s.id;
                  const isExpanded = !!expandedRows[dbId];
                  const expandedData = expandedRows[dbId]?.data;
                  const isLoadingDetails = expandedRows[dbId]?.loading;
                  
                  return (
                    <React.Fragment key={s.id}>
                      {/* Main Row */}
                      <tr className={`${isExpanded ? (dark ? 'border-l-4 border-primary bg-[#3c4a46]/20' : 'border-l-4 border-[#006b5c] bg-[#006b5c]/5') : 'border-l-4 border-transparent hover:bg-black/5 dark:hover:bg-white/5'} transition-colors`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden font-bold ${dark ? 'bg-primary/20 text-primary' : 'bg-[#006b5c]/10 text-[#006b5c]'}`}>
                              {(s.name || '?').charAt(0)}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{s.name}</p>
                              <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>{s.studentEmail || s.user?.email || `${(s.name || '').split(' ')[0].toLowerCase()}@${schoolDomain}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-8 py-5 text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>{s.id}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dark ? 'bg-primary/20 text-primary' : 'bg-[#006b5c]/10 text-[#006b5c]'}`}>
                            {(s.class || '').split('-')[0]?.trim() || s.class}
                          </span>
                        </td>
                        <td className={`px-8 py-5 text-sm ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>
                          {(s.class || '').split('-')[1]?.trim() || '-'}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setResetPasswordStudent(s); setResetForm({ oldPassword: '', newPassword: '' }); }} className={`p-2 rounded-lg transition-colors ${dark ? 'text-[#bbcac4] hover:text-primary hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:text-[#006b5c] hover:bg-[#e8e8ea]'}`} title="Reset Password">
                              <span className="material-symbols-outlined">lock_reset</span>
                            </button>
                            <button onClick={() => { 
                              setEditStudent(s); 
                              setEditForm({ name: s.name || '', phone: s.phone || '', guardianName: s.guardian || '', status: s.status || 'Active', avatar: null }); 
                            }} className={`p-2 rounded-lg transition-colors ${dark ? 'text-[#bbcac4] hover:text-[#00c2a8] hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:text-[#006b5c] hover:bg-[#e8e8ea]'}`} title="Edit Profile">
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button onClick={() => setPromoteStudent(s)} className={`p-2 rounded-lg transition-colors ${dark ? 'text-[#bbcac4] hover:text-[#68abff] hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:text-[#0060ac] hover:bg-[#e8e8ea]'}`} title="Promote Student">
                              <span className="material-symbols-outlined">upgrade</span>
                            </button>
                            <button 
                              onClick={() => toggleDetails(dbId)} 
                              className="px-4 py-1.5 flex items-center gap-2 bg-[#00c2a8] text-[#00493e] rounded-full text-xs font-bold hover:brightness-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">{isExpanded ? 'visibility_off' : 'visibility'}</span>
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className={dark ? 'bg-[#1a1c1e]/50' : 'bg-white'}>
                          <td colSpan="5" className={`px-8 py-6 ${isLoadingDetails ? 'text-center text-outline' : ''}`}>
                            {isLoadingDetails ? (
                              <p>Loading details for {s.name}...</p>
                            ) : expandedData ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Academic Profile */}
                                <div className={`p-4 border rounded-2xl space-y-3 ${dark ? 'border-[#3c4a46] bg-[#2f3133]' : 'border-[#bbcac4] bg-white'}`}>
                                  <div className={`flex items-center gap-2 ${dark ? 'text-primary' : 'text-[#006b5c]'}`}>
                                    <span className="material-symbols-outlined">badge</span>
                                    <h4 className="text-sm font-semibold">Profile Options</h4>
                                  </div>
                                  <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Status: {expandedData.status}</p>
                                  <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Guardian: {expandedData.guardianName}</p>
                                  <div className="flex gap-3 mt-4 pt-2 border-t border-[#006b5c]/10">
                                    <button 
                                      onClick={() => { 
                                        setEditStudent(s); 
                                      }} 
                                      className="flex-1 py-2 px-3 flex items-center justify-center gap-2 bg-[#006b5c] text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">edit</span>
                                      Edit Details
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteStudent(s)} 
                                      className="flex-1 py-2 px-3 flex items-center justify-center gap-2 bg-red-600/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600/20 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">delete</span>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Fee History */}
                                <div className={`p-4 border rounded-2xl space-y-3 ${dark ? 'border-[#3c4a46] bg-[#2f3133]' : 'border-[#bbcac4] bg-white'}`}>
                                  <div className={`flex items-center gap-2 ${dark ? 'text-[#a4c9ff]' : 'text-[#0060ac]'}`}>
                                    <span className="material-symbols-outlined">receipt_long</span>
                                    <h4 className="text-sm font-semibold">Fee History</h4>
                                  </div>
                                  {expandedData.feePayments && expandedData.feePayments.length > 0 ? (
                                    <>
                                      <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>
                                        Status: <span className={`font-bold ${expandedData.feePayments[0].status === 'Paid' ? (dark ? 'text-primary' : 'text-[#006b5c]') : 'text-error'}`}>{expandedData.feePayments[0].status}</span>
                                      </p>
                                      <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>
                                        Last Payment: {expandedData.feePayments[0].paidDate ? new Date(expandedData.feePayments[0].paidDate).toLocaleDateString() : 'Pending'}
                                      </p>
                                    </>
                                  ) : (
                                    <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>No fee records.</p>
                                  )}
                                  <a className={`text-xs font-bold hover:underline ${dark ? 'text-[#a4c9ff]' : 'text-[#0060ac]'}`} href="#">View Ledger →</a>
                                </div>
                                
                                {/* Report Cards */}
                                <div className={`p-4 border rounded-2xl space-y-3 ${dark ? 'border-[#3c4a46] bg-[#2f3133]' : 'border-[#bbcac4] bg-white'}`}>
                                  <div className={`flex items-center gap-2 ${dark ? 'text-[#ffb59e]' : 'text-[#9d4224]'}`}>
                                    <span className="material-symbols-outlined">assignment</span>
                                    <h4 className="text-sm font-semibold">Report Cards</h4>
                                  </div>
                                  <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Exams taken: {expandedData.examResults?.length || 0}</p>
                                  <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Latest Grade: {expandedData.examResults?.[0]?.grade || 'N/A'}</p>
                                  <a className={`text-xs font-bold hover:underline ${dark ? 'text-[#ffb59e]' : 'text-[#9d4224]'}`} href="#">Download PDF →</a>
                                </div>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote Modal */}
      {promoteStudent && (
        <Modal title={`Promote ${promoteStudent.name}`} onClose={() => setPromoteStudent(null)}>
          <form onSubmit={handlePromote} className="space-y-4">
            <p className="text-sm">Current Class: <strong>{promoteStudent.class}</strong></p>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Select New Class</label>
              <CustomSelect
                value={promoteClassId}
                onChange={setPromoteClassId}
                options={[
                  { value: '', label: 'Select a class' },
                  ...classes.map(c => ({ value: c.id, label: c.name }))
                ]}
                dark={dark}
                className="pl-3 py-2 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setPromoteStudent(null)} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors">Confirm Promotion</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetPasswordStudent && (
        <Modal title={`Change Password for ${resetPasswordStudent.name}`} onClose={() => setResetPasswordStudent(null)}>
          <form onSubmit={submitPasswordReset} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Email (Fixed)</label>
              <input type="email" value={resetPasswordStudent.studentEmail || resetPasswordStudent.user?.email || `${(resetPasswordStudent.name || '').split(' ')[0].toLowerCase()}@${schoolDomain}`} disabled className={`w-full p-2 rounded-lg cursor-not-allowed opacity-70 ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46]' : 'bg-surface-container border border-outline-variant'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Old Password</label>
              <input type="text" value={resetPasswordStudent.user?.plainPassword || 'student123'} disabled className={`w-full p-2 rounded-lg cursor-not-allowed opacity-70 ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface-container border border-outline-variant text-[#1a1c1e]'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">New Password</label>
              <input type="text" required value={resetForm.newPassword} onChange={e => setResetForm({...resetForm, newPassword: e.target.value})} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-primary transition-all ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface border border-outline-variant text-[#1a1c1e]'}`} placeholder="Enter new password" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setResetPasswordStudent(null)} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors">Update Password</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          dark={dark}
          onClose={() => setEditStudent(null)}
          onUpdate={fetchStudents}
          setToast={setToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
