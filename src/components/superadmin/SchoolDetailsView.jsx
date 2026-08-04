import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SchoolDetailsView({ dark, schoolId, schoolName = "Oakridge Academy", onBack }) {
  const [activeTab, setActiveTab] = useState('User Management');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [searchUser, setSearchUser] = useState('');
  const [users, setUsers] = useState([]);
  
  // Document Themes State
  const [idCardTheme, setIdCardTheme] = useState('Modern Minimal');
  const [idCardFormat, setIdCardFormat] = useState('Vertical (CR80) - 2.125" x 3.375"');
  const [reportCardTheme, setReportCardTheme] = useState('Classic Academic');
  const [reportCardFormat, setReportCardFormat] = useState('A4 Portrait (Standard)');

  // Password Reset Modal State
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!schoolId) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/tenants/schools/${schoolId}/users`, { withCredentials: true });
        setUsers(res.data);
      } catch (error) {
        console.error('Failed to fetch school users:', error);
      }
    };
    fetchUsers();
  }, [schoolId]);

  const classes = ['All Classes', 'Class 9-B', 'Class 10-A'];

  // Filter users based on search, role, and class
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchUser.toLowerCase()) || user.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = selectedRole === 'All Roles' || user.role === selectedRole;
    const matchesClass = selectedRole !== 'Student' || selectedClass === 'All Classes' || user.className === selectedClass;
    
    return matchesSearch && matchesRole && matchesClass;
  });

  const handleResetPasswordClick = (user) => {
    setResetUser(user);
    setNewPassword('');
  };

  const submitPasswordReset = (e) => {
    e.preventDefault();
    if (!newPassword) return;
    // Mock API Call here
    alert(`Password for ${resetUser.name} successfully updated to: ${newPassword}`);
    setResetUser(null);
  };

  return (
    <div className="p-container-padding-mob md:p-container-padding-desk space-y-card-gap mx-auto w-full max-w-[1600px] relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm cursor-pointer hover:text-primary">Dashboard</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-label-sm text-label-sm cursor-pointer hover:text-primary" onClick={onBack}>Schools</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-label-sm text-label-sm cursor-pointer hover:text-primary" onClick={onBack}>Manage Schools</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary font-medium">{schoolName}</span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-surface-variant flex items-center justify-center overflow-hidden shrink-0">
              <img alt="School Logo" className="w-12 h-12 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCklcU9adoSc_7Gom9dagVN4h_WrQfKjmvtHv94fLEIJHp0u-waKLGOUr1Exfs6O8mQFxbQf-htpuRId_d2GzfC6p1IK62Ec6a5Dgh5i0_7ISNO5iUFS0Sn-9CN4oqwZHnjwi0xl8IP4L1jOvNh9g1IJz5oS-MceovDCBqkJYaphlCzdBCC2-aD7xlU7QaHdV26d4SpLgzM4ITgUEXURLq_68JUZ8qrgdh18xsEscgE0pGBm0Q9cj9t4A" />
            </div>
            <div>
              <h1 className="font-display text-display text-on-background flex items-center gap-3">
                {schoolName}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-container/10 text-primary uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  Active
                </span>
              </h1>
              <p className="font-body-md text-on-surface-variant mt-1">oakridge.erpzo.com</p>
            </div>
          </div>
        </div>
        <button className="bg-surface border border-surface-variant text-on-surface font-label-lg text-label-lg px-6 py-3 rounded-full hover:bg-surface-container-high transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">edit</span>
          Edit School Info
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-variant flex gap-6 mt-4 overflow-x-auto sa-scrollbar">
        {['Overview', 'User Management', 'Website Hosting', 'Document Themes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-label-lg text-label-lg transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: User Management */}
      {activeTab === 'User Management' && (
        <div className="bg-surface rounded-[24px] shadow-soft overflow-hidden border border-surface-variant/30 mt-6">
          <div className="p-4 border-b border-surface-variant flex flex-col sm:flex-row justify-between gap-4 items-center bg-background/50">
            <h2 className="font-headline-md text-on-background">User Accounts</h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-background border border-surface-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  placeholder="Search users..."
                />
              </div>
              <select 
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedClass('All Classes'); // reset class when role changes
                }}
                className="sa-select text-sm py-2 px-3 w-32"
              >
                <option>All Roles</option>
                <option>Admin</option>
                <option>Teacher</option>
                <option>Student</option>
                <option>Parent</option>
              </select>
              
              {/* Conditional Class Dropdown for Students */}
              {selectedRole === 'Student' && (
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="sa-select text-sm py-2 px-3 w-36"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="overflow-x-auto sa-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-variant bg-background/30">
                  <th className="px-6 py-3 font-label-md text-sm text-on-surface-variant font-semibold">Name</th>
                  <th className="px-6 py-3 font-label-md text-sm text-on-surface-variant font-semibold">Role</th>
                  <th className="px-6 py-3 font-label-md text-sm text-on-surface-variant font-semibold">Email</th>
                  <th className="px-6 py-3 font-label-md text-sm text-on-surface-variant font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-on-surface-variant font-body-md">
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-3 font-body-md text-on-surface font-medium">
                        {user.name}
                        {user.className && <span className="ml-2 text-xs text-outline bg-surface-container-high px-1.5 py-0.5 rounded">{user.className}</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          user.role === 'Admin' ? 'bg-error/10 text-error' :
                          user.role === 'Teacher' ? 'bg-secondary/10 text-secondary' :
                          user.role === 'Student' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-body-md text-on-surface-variant">{user.email}</td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => handleResetPasswordClick(user)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container-high hover:text-primary transition-colors flex items-center gap-1.5 inline-flex"
                        >
                          <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-surface-variant overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-surface-variant flex items-center justify-between">
              <h3 className="font-headline-md text-on-background">Reset Password</h3>
              <button onClick={() => setResetUser(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={submitPasswordReset} className="p-5 space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="font-label-md font-semibold text-on-surface">{resetUser.name}</p>
                  <p className="font-body-md text-sm text-on-surface-variant">{resetUser.role} • {resetUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Old Password</label>
                <div className="relative">
                  <input 
                    type="text" 
                    readOnly 
                    value={resetUser.oldPassword} 
                    className="w-full px-4 py-2.5 bg-surface-container-high border border-surface-variant rounded-xl font-body-md text-on-surface-variant cursor-not-allowed" 
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Shown for verification purposes
                </p>
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">New Password</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setResetUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-surface-variant text-on-surface font-label-lg hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content: Website Hosting */}
      {activeTab === 'Website Hosting' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Subdomain Hosting Panel */}
          <div className="bg-surface rounded-[24px] shadow-soft border border-surface-variant/30 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">language</span>
              </div>
              <div>
                <h2 className="font-headline-md text-on-background">Subdomain Hosting</h2>
                <p className="font-body-md text-on-surface-variant text-sm">Host a custom landing page for this school</p>
              </div>
            </div>
            
            <div className="flex-1 bg-background border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center mt-2 group hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[48px] text-outline mb-4 group-hover:text-primary transition-colors">upload_file</span>
              <h3 className="font-headline-md text-on-surface mb-1">Upload HTML File</h3>
              <p className="font-body-md text-on-surface-variant text-sm mb-4 max-w-[250px]">Drag and drop your custom index.html file here, or click to browse.</p>
              <button className="bg-primary text-on-primary font-label-lg px-5 py-2 rounded-lg hover:shadow-md transition-all">
                Select File
              </button>
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-secondary/5 border border-secondary/20 flex gap-3">
              <span className="material-symbols-outlined text-secondary">info</span>
              <div>
                <p className="font-label-md font-semibold text-on-surface text-sm mb-0.5">Current Hosted Status</p>
                <p className="font-body-md text-on-surface-variant text-sm">No custom HTML file hosted. Using default ERPZO login portal at <a href="#" className="text-secondary hover:underline">oakridge.erpzo.com</a>.</p>
              </div>
            </div>
          </div>

          {/* School Details & Logo Panel */}
          <div className="bg-surface rounded-[24px] shadow-soft border border-surface-variant/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div>
                <h2 className="font-headline-md text-on-background">School Profile Details</h2>
                <p className="font-body-md text-on-surface-variant text-sm">Update public information and logo</p>
              </div>
            </div>

            <form className="space-y-5">
              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">School Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-surface-variant flex items-center justify-center overflow-hidden shrink-0">
                    <img alt="School Logo" className="w-12 h-12 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCklcU9adoSc_7Gom9dagVN4h_WrQfKjmvtHv94fLEIJHp0u-waKLGOUr1Exfs6O8mQFxbQf-htpuRId_d2GzfC6p1IK62Ec6a5Dgh5i0_7ISNO5iUFS0Sn-9CN4oqwZHnjwi0xl8IP4L1jOvNh9g1IJz5oS-MceovDCBqkJYaphlCzdBCC2-aD7xlU7QaHdV26d4SpLgzM4ITgUEXURLq_68JUZ8qrgdh18xsEscgE0pGBm0Q9cj9t4A" />
                  </div>
                  <button type="button" className="text-sm font-semibold px-4 py-2 rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container-high transition-colors">
                    Change Logo
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">School Name</label>
                <input type="text" defaultValue="Oakridge Academy" className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors" />
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Public Contact Email</label>
                <input type="email" defaultValue="contact@oakridge.edu" className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors" />
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">School Address</label>
                <textarea rows="3" defaultValue="123 Education Lane&#10;Knowledge City, CA 90210" className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"></textarea>
              </div>

              <div className="pt-2">
                <button type="button" className="w-full bg-primary text-on-primary font-label-lg px-6 py-3 rounded-xl hover:shadow-md transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content: Overview */}
      {activeTab === 'Overview' && (
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* KPI Cards: User Breakdown */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-[#E1F4F4] rounded-[24px] shadow-md border border-[#E1F4F4] p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">+12%</span>
              </div>
              <div>
                <h4 className="font-label-md text-on-surface-variant mb-1">Total Students</h4>
                <p className="font-display text-2xl text-on-background">2,450</p>
              </div>
            </div>

            <div className="bg-[#E1F4F4] rounded-[24px] shadow-md border border-[#E1F4F4] p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">+4%</span>
              </div>
              <div>
                <h4 className="font-label-md text-on-surface-variant mb-1">Total Teachers</h4>
                <p className="font-display text-2xl text-on-background">184</p>
              </div>
            </div>

            <div className="bg-[#E1F4F4] rounded-[24px] shadow-md border border-[#E1F4F4] p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">+15%</span>
              </div>
              <div>
                <h4 className="font-label-md text-on-surface-variant mb-1">Total Parents</h4>
                <p className="font-display text-2xl text-on-background">3,120</p>
              </div>
            </div>

            <div className="bg-[#E1F4F4] rounded-[24px] shadow-md border border-[#E1F4F4] p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">0%</span>
              </div>
              <div>
                <h4 className="font-label-md text-on-surface-variant mb-1">Administrators</h4>
                <p className="font-display text-2xl text-on-background">12</p>
              </div>
            </div>
          </div>

          {/* Plan Details Card */}
          <div className="lg:w-[400px] bg-surface rounded-[24px] shadow-soft border border-surface-variant/30 overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-br from-primary-container/20 to-transparent border-b border-surface-variant/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline-md text-on-background">Enterprise Plan</h3>
                  <p className="font-body-md text-on-surface-variant text-sm mt-0.5">Billed Annually</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-on-primary">
                  Active
                </span>
              </div>
              <p className="font-display text-3xl text-primary">$4,999<span className="text-lg font-body-md text-on-surface-variant">/yr</span></p>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-label-md mb-1.5 text-sm">
                    <span className="text-on-surface">Storage Limit</span>
                    <span className="text-on-surface-variant">1.2 TB / 5 TB</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between font-label-md mb-1.5 text-sm">
                    <span className="text-on-surface">SMS Credits</span>
                    <span className="text-on-surface-variant">8k / 20k</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5">
                    <div className="bg-secondary h-1.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-surface-variant">
                <div className="flex justify-between text-sm">
                  <span className="font-body-md text-on-surface-variant">Renewal Date</span>
                  <span className="font-label-md text-on-surface">Oct 24, 2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-body-md text-on-surface-variant">Billing Contact</span>
                  <span className="font-label-md text-on-surface">admin@oakridge.edu</span>
                </div>
              </div>
              
              <button className="w-full py-2.5 rounded-xl border border-primary text-primary font-label-lg hover:bg-primary/5 transition-colors">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Document Themes */}
      {activeTab === 'Document Themes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* ID Card Configuration Panel */}
          <div className="bg-surface rounded-[24px] shadow-soft border border-surface-variant/30 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h2 className="font-headline-md text-on-background">ID Card Configuration</h2>
                <p className="font-body-md text-on-surface-variant text-sm">Design and format for student/staff IDs</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">ID Card Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Modern Minimal', 'Vibrant Edge', 'Corporate Clean', 'Classic Crest'].map(theme => (
                    <div 
                      key={theme}
                      onClick={() => setIdCardTheme(theme)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        idCardTheme === theme ? 'border-primary bg-primary/5' : 'border-surface-variant hover:border-primary/50 bg-background'
                      }`}
                    >
                      <span className="font-label-md text-sm text-on-surface">{theme}</span>
                      {idCardTheme === theme && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Card Format / Size</label>
                <select 
                  value={idCardFormat}
                  onChange={(e) => setIdCardFormat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option>Vertical (CR80) - 2.125" x 3.375"</option>
                  <option>Horizontal (CR80) - 3.375" x 2.125"</option>
                  <option>Square Badge - 3" x 3"</option>
                </select>
              </div>

              {/* Preview Box */}
              <div className="mt-4 bg-surface-container-high rounded-xl p-6 flex justify-center items-center h-48 border border-surface-variant border-dashed relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')]"></div>
                 <div className={`shadow-lg bg-white relative flex flex-col items-center justify-center transition-all duration-300 ${idCardFormat.includes('Vertical') ? 'w-24 h-36 rounded-md' : idCardFormat.includes('Horizontal') ? 'w-36 h-24 rounded-md' : 'w-32 h-32 rounded-md'}`}>
                   <div className="w-8 h-8 rounded-full bg-surface-variant mb-2"></div>
                   <div className="w-12 h-2 bg-surface-variant rounded-full mb-1"></div>
                   <div className="w-8 h-2 bg-surface-variant rounded-full"></div>
                   {idCardTheme === 'Vibrant Edge' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-400 rounded-t-md"></div>}
                   {idCardTheme === 'Modern Minimal' && <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl-full"></div>}
                   {idCardTheme === 'Corporate Clean' && <div className="absolute bottom-0 left-0 w-full h-2 bg-[#0060ac] rounded-b-md"></div>}
                 </div>
              </div>

              <div className="pt-2">
                <button className="w-full bg-primary text-on-primary font-label-lg px-6 py-3 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save ID Card Settings
                </button>
              </div>
            </div>
          </div>

          {/* Report Card Configuration Panel */}
          <div className="bg-surface rounded-[24px] shadow-soft border border-surface-variant/30 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <div>
                <h2 className="font-headline-md text-on-background">Report Card Configuration</h2>
                <p className="font-body-md text-on-surface-variant text-sm">Theme and layout for academic results</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Report Card Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Classic Academic', 'Modern Tabular', 'Colorful Primary', 'Elegant Serif'].map(theme => (
                    <div 
                      key={theme}
                      onClick={() => setReportCardTheme(theme)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        reportCardTheme === theme ? 'border-secondary bg-secondary/5' : 'border-surface-variant hover:border-secondary/50 bg-background'
                      }`}
                    >
                      <span className="font-label-md text-sm text-on-surface">{theme}</span>
                      {reportCardTheme === theme && <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Document Format</label>
                <select 
                  value={reportCardFormat}
                  onChange={(e) => setReportCardFormat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-secondary transition-colors"
                >
                  <option>A4 Portrait (Standard)</option>
                  <option>A4 Landscape</option>
                  <option>US Letter Portrait</option>
                  <option>Digital Web View (Fluid)</option>
                </select>
              </div>

              {/* Preview Box */}
              <div className="mt-4 bg-surface-container-high rounded-xl p-6 flex justify-center items-center h-48 border border-surface-variant border-dashed relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
                 <div className={`shadow-lg bg-white relative p-2 flex flex-col transition-all duration-300 ${reportCardFormat.includes('Landscape') ? 'w-36 h-28' : 'w-28 h-36'} ${reportCardFormat.includes('Digital') ? 'w-full h-full rounded-xl' : 'rounded-sm'}`}>
                    <div className="w-full flex justify-between items-center mb-2">
                       <div className="w-4 h-4 rounded-full bg-surface-variant"></div>
                       <div className="w-10 h-1 bg-surface-variant rounded-full"></div>
                    </div>
                    <div className="w-full h-px bg-surface-variant/50 mb-2"></div>
                    <div className="flex-1 border border-surface-variant/30 rounded flex flex-col gap-1 p-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center w-full">
                          <div className="w-10 h-1 bg-surface-variant/70 rounded-full"></div>
                          <div className={`w-4 h-1 rounded-full ${reportCardTheme === 'Colorful Primary' ? 'bg-primary' : 'bg-secondary/50'}`}></div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="pt-2">
                <button className="w-full bg-secondary text-on-primary font-label-lg px-6 py-3 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Report Card Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
