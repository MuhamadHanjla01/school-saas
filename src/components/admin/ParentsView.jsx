import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminPage';

export default function ParentsView({ dark }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Modal forms
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, parentId: '', name: '', phone: '', email: '', occupation: '' });
  const [toast, setToast] = useState(null);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://erpzo-backend.onrender.com/api/parents');
      setParents(res.data.parents || []);
    } catch (err) {
      console.error('Failed to fetch parents', err);
      setToast({ message: 'Failed to load parent records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(`https://erpzo-backend.onrender.com/api/parents/${form.id}`, form);
        setToast({ message: 'Parent updated successfully', type: 'success' });
      } else {
        await axios.post('https://erpzo-backend.onrender.com/api/parents', form);
        setToast({ message: 'Parent created successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchParents();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Failed to save parent', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parent record?')) return;
    try {
      await axios.delete(`https://erpzo-backend.onrender.com/api/parents/${id}`);
      setToast({ message: 'Parent deleted', type: 'success' });
      fetchParents();
    } catch (err) {
      setToast({ message: 'Failed to delete parent', type: 'error' });
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

  const filtered = parents.filter(p => {
    const nameStr = (p.name || '').toLowerCase();
    const idStr = (p.parentId || '').toLowerCase();
    const studentStr = (p.students || []).map(s => s.name).join(' ').toLowerCase();
    return !q || nameStr.includes(q) || idStr.includes(q) || studentStr.includes(q);
  });

  const openAddModal = () => {
    setForm({ id: null, parentId: '', name: '', phone: '', email: '', occupation: '' });
    setModalOpen(true);
  };

  const openEditModal = (p, e) => {
    e.stopPropagation();
    setForm({
      id: p.id,
      parentId: p.parentId,
      name: p.name,
      phone: p.phone || '',
      email: p.email || '',
      occupation: p.occupation || ''
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
            <span>Parent Management</span>
          </nav>
          <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Parent Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage parent profiles and their associated student records.</p>
        </div>
        <button 
          className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-label-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95 duration-200"
          onClick={openAddModal}
        >
          <span className="material-symbols-outlined">person_add</span>
          Add New Parent
        </button>
      </div>

      {/* Filters & Search Bento */}
      <div className={`p-6 rounded-[24px] shadow-sm mb-8 grid grid-cols-1 gap-6 ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div>
          <label className={`text-sm font-semibold block mb-2 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Search Parents</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`} 
              placeholder="Search by parent name, ID, or student name..." 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Parent List Table Header */}
      <div className={`rounded-[24px] shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className={`hidden md:grid grid-cols-12 px-6 py-4 border-b text-xs font-semibold uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
          <div className="col-span-4">Parent Profile</div>
          <div className="col-span-2">Parent ID</div>
          <div className="col-span-3">Linked Students</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-outline">Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-outline">No records found.</div>
        ) : (
          filtered.map(p => {
            const isExpanded = expandedRows.has(p.id);
            const initials = p.name.split(' ').map(n => n[0]).slice(0, 2).join('');
            
            return (
              <div key={p.id} className={`group border-b last:border-b-0 ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
                {/* Row */}
                <div 
                  className={`grid grid-cols-1 md:grid-cols-12 px-6 py-5 items-center transition-all cursor-pointer ${dark ? 'hover:bg-[#3c4a46]/50' : 'hover:bg-[#f3f3f6]'}`}
                  onClick={() => toggleExpand(p.id)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{p.name}</div>
                      <div className={`text-[11px] ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>{p.email || 'No email provided'}</div>
                    </div>
                  </div>
                  <div className={`col-span-2 text-xs font-medium mt-2 md:mt-0 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
                    <span className="md:hidden text-outline text-[11px] block">Parent ID</span>
                    #{p.parentId}
                  </div>
                  <div className="col-span-3 mt-2 md:mt-0">
                    <span className="md:hidden text-outline text-[11px] block">Students</span>
                    <div className="flex flex-wrap gap-1">
                      {p.students && p.students.length > 0 ? p.students.map(s => (
                        <span key={s.id} className={`px-2 py-1 rounded text-[10px] font-bold ${dark ? 'bg-primary/20 text-primary' : 'bg-primary-container/30 text-primary'}`}>
                          {s.name} ({s.class?.name || 'Unassigned'})
                        </span>
                      )) : (
                        <span className="text-xs text-outline italic">No students linked</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-3 mt-4 md:mt-0">
                    <button 
                      className="px-4 py-1.5 bg-[#00c2a8] text-[#00493e] rounded-lg text-xs font-semibold hover:brightness-95 transition-all flex items-center gap-1"
                      onClick={(e) => openEditModal(p, e)}
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
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-outline-variant/30">
                    <div className={`col-span-1 border-r pr-8 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                      <h4 className="font-label-lg text-primary mb-3">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Phone Number</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{p.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Email Address</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{p.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-body-md">
                          <span className="text-outline">Occupation</span>
                          <span className={dark ? 'text-white' : 'text-on-surface'}>{p.occupation || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <h4 className="font-label-lg text-error mb-3">Danger Zone</h4>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="w-full max-w-[250px] py-2 bg-error/10 text-error hover:bg-error/20 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Remove Parent Record
                      </button>
                      <p className="text-[11px] text-outline mt-2">
                        Deleting this record will orphan any associated students unless they are reassigned.
                      </p>
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
        <Modal title={form.id ? 'Edit Parent' : 'Add New Parent'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Parent ID *</label>
                <input required type="text" value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Full Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
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

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Occupation</label>
                <input type="text" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-surface-container-high'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors shadow-md">
                {form.id ? 'Save Changes' : 'Create Parent'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
