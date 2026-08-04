import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ManageSchoolsView({ dark, setShowOnboardModal, onViewSchool }) {
  const [schools, setSchools] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const dropdownRef = useRef(null);
  
  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/tenants/schools`, { withCredentials: true });
      setSchools(res.data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = async (action, school) => {
    setOpenDropdownId(null);
    if (action === 'suspend') {
      try {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/tenants/schools/${school.id}`, { status: 'Suspended' }, { withCredentials: true });
        fetchSchools();
      } catch (error) {
        console.error(error);
      }
    } else if (action === 'delete') {
      if(window.confirm(`Are you sure you want to delete ${school.name}?`)) {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/tenants/schools/${school.id}`, { withCredentials: true });
          fetchSchools();
        } catch (error) {
          console.error(error);
        }
      }
    } else if (action === 'analytics') {
      alert(`Opening analytics for ${school.name}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/tenants/schools/${editingSchool.id}`, editingSchool, { withCredentials: true });
      fetchSchools();
      setEditingSchool(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-container-padding-mob md:p-container-padding-desk space-y-card-gap mx-auto w-full max-w-[1600px] relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm cursor-pointer hover:text-primary">Dashboard</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-label-sm text-label-sm cursor-pointer hover:text-primary">Schools</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary font-medium">Manage Schools</span>
          </div>
          <h1 className="font-display text-display text-on-background">Manage Schools</h1>
        </div>
        <button
          onClick={() => setShowOnboardModal?.(true)}
          className="bg-primary-container text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Onboard New School
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-surface rounded-[24px] shadow-soft p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            className="w-full pl-12 pr-4 py-3 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Search by school name or subdomain..."
            type="text"
          />
        </div>
        <div className="flex w-full lg:w-auto gap-4">
          <div className="relative w-full lg:w-48">
            <select className="sa-select w-full">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="relative w-full lg:w-64">
            <div className="flex items-center px-4 py-3 bg-background border border-surface-variant rounded-xl cursor-pointer hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline mr-2 text-[20px]">calendar_today</span>
              <span className="font-body-md text-on-surface truncate">Jan 1, 2024 - Dec 31, 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Widget */}
      <div className="bg-surface rounded-[24px] shadow-soft overflow-hidden border border-surface-variant/30">
        <div className="overflow-x-auto sa-scrollbar min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-variant bg-background/50">
                <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant font-semibold">School Name</th>
                <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant font-semibold">Subdomain</th>
                <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant font-semibold">Plan</th>
                <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant font-semibold">Students</th>
                <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant font-semibold">Status</th>
                <th className="px-6 py-4 font-label-lg text-label-lg text-on-surface-variant font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {schools.map(school => (
                <tr key={school.id} className="hover:bg-background/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-surface-variant flex items-center justify-center overflow-hidden shrink-0">
                        {school.logo ? (
                          <img alt={`${school.name} Logo`} className={`w-8 h-8 object-contain ${school.muted ? 'opacity-50' : ''}`} src={school.logo} />
                        ) : (
                          <div className="w-8 h-8 bg-surface-variant rounded-md flex items-center justify-center text-outline font-headline-md text-sm">{school.fallback}</div>
                        )}
                      </div>
                      <div>
                        <p className={`font-headline-md text-[16px] text-on-surface mb-0.5 group-hover:text-primary transition-colors ${school.muted ? 'opacity-60' : ''}`}>{school.name}</p>
                        <p className={`font-body-md text-[12px] ${school.muted ? 'text-error' : 'text-outline'}`}>{school.joined}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-body-md text-on-surface ${school.muted ? 'opacity-60' : ''}`}>{school.subdomain}</td>
                  <td className={`px-6 py-4 ${school.muted ? 'opacity-60' : ''}`}>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${school.planColor}`}>{school.plan}</span>
                  </td>
                  <td className={`px-6 py-4 ${school.muted ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <span className="font-body-md text-on-surface">{school.students}</span>
                      <div className="w-full bg-surface-container rounded-full h-1.5">
                        <div className={`${school.studentColor} h-1.5 rounded-full`} style={{ width: school.studentPct }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${school.statusColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${school.statusDot}`}></span>
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button onClick={() => onViewSchool?.(school.id, school.name)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-lg transition-colors" title="View Details">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <button onClick={() => setEditingSchool({...school})} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-lg transition-colors" title="Edit School">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      
                      {/* Three Dots Button */}
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === school.id ? null : school.id)}
                        className={`p-2 rounded-lg transition-colors ${openDropdownId === school.id ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
                        title="More Actions"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === school.id && (
                        <div ref={dropdownRef} className="absolute right-0 top-10 mt-1 w-48 bg-surface rounded-xl shadow-lg border border-surface-variant py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-150">
                          <button onClick={() => handleAction('analytics', school)} className="w-full text-left px-4 py-2 text-sm font-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">analytics</span>
                            View Analytics
                          </button>
                          <button onClick={() => handleAction('suspend', school)} className="w-full text-left px-4 py-2 text-sm font-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">block</span>
                            Suspend School
                          </button>
                          <div className="border-t border-surface-variant my-1"></div>
                          <button onClick={() => handleAction('delete', school)} className="w-full text-left px-4 py-2 text-sm font-label-md text-error hover:bg-error/10 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Delete School
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-surface-variant flex items-center justify-between bg-surface">
          <span className="font-body-md text-on-surface-variant">Showing 1 to 4 of 45 entries</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-surface-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="hidden sm:flex gap-1">
              <button className="w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-lg flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-lg border border-surface-variant text-on-surface font-label-lg flex items-center justify-center hover:bg-surface-container-high">2</button>
              <button className="w-8 h-8 rounded-lg border border-surface-variant text-on-surface font-label-lg flex items-center justify-center hover:bg-surface-container-high">3</button>
              <span className="w-8 h-8 flex items-center justify-center text-outline">...</span>
              <button className="w-8 h-8 rounded-lg border border-surface-variant text-on-surface font-label-lg flex items-center justify-center hover:bg-surface-container-high">5</button>
            </div>
            <button className="p-2 rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-surface-variant overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-surface-variant flex items-center justify-between">
              <h3 className="font-headline-md text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                Edit School Profile
              </h3>
              <button onClick={() => setEditingSchool(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">School Name</label>
                <input 
                  type="text" 
                  required
                  value={editingSchool.name}
                  onChange={(e) => setEditingSchool({...editingSchool, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                />
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Subdomain</label>
                <div className="flex">
                  <input 
                    type="text" 
                    required
                    value={editingSchool.subdomain.replace('.erpzo.com', '')}
                    onChange={(e) => setEditingSchool({...editingSchool, subdomain: e.target.value + '.erpzo.com'})}
                    className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-l-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  />
                  <span className="px-4 py-2.5 bg-surface-container-high border border-l-0 border-surface-variant rounded-r-xl font-body-md text-on-surface-variant whitespace-nowrap">.erpzo.com</span>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-on-surface mb-1.5">Status</label>
                <select
                  value={editingSchool.status}
                  onChange={(e) => setEditingSchool({...editingSchool, status: e.target.value})}
                  className="w-full px-4 py-2.5 bg-background border border-surface-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors sa-select"
                >
                  <option value="Active">Active</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingSchool(null)}
                  className="flex-1 py-2.5 rounded-xl border border-surface-variant text-on-surface font-label-lg hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg hover:shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
