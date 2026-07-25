import React, { useState } from 'react';
import { Toast, Modal } from './AdminPage';

const INITIAL_DOCS = [
  { id: 'DOC-1', name: 'School_Policy_2024.pdf', type: 'Policy', date: '2024-01-10', size: '2.4 MB', author: 'Admin' },
  { id: 'DOC-2', name: 'S1029_Birth_Certificate.pdf', type: 'Student Record', date: '2024-05-12', size: '1.1 MB', author: 'Admissions' },
  { id: 'DOC-3', name: 'Tax_Returns_2023.pdf', type: 'Finance', date: '2024-04-15', size: '5.6 MB', author: 'Finance Dept' },
  { id: 'DOC-4', name: 'Teacher_Handbook_v2.pdf', type: 'HR', date: '2024-06-20', size: '3.2 MB', author: 'HR Dept' },
  { id: 'DOC-5', name: 'Fire_Safety_Guidelines.pdf', type: 'Compliance', date: '2024-07-01', size: '800 KB', author: 'Facilities' },
];

export default function DocumentsView({ dark }) {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);

  const handleDelete = (id) => {
    if(!window.confirm('Delete this document? This action cannot be undone.')) return;
    setDocs(docs.filter(d => d.id !== id));
    setToast({ message: 'Document deleted successfully', type: 'success' });
  };

  const handleUpload = (e) => {
    e.preventDefault();
    setUploadModal(false);
    setToast({ message: 'File uploaded successfully', type: 'success' });
    // Mock addition
    const newDoc = {
      id: `DOC-${docs.length + 1}`,
      name: 'New_Uploaded_File.pdf',
      type: 'General',
      date: new Date().toISOString().split('T')[0],
      size: '1.5 MB',
      author: 'Current User'
    };
    setDocs([newDoc, ...docs]);
  };

  const q = search.toLowerCase();
  const filtered = docs.filter(d => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q));

  const getIconForType = (type) => {
    switch (type) {
      case 'Finance': return { icon: 'request_quote', color: 'text-tertiary', bg: 'bg-tertiary-container' };
      case 'Policy': return { icon: 'policy', color: 'text-primary', bg: 'bg-primary-container' };
      case 'Student Record': return { icon: 'school', color: 'text-[#0060ac]', bg: 'bg-[#0060ac]/20' };
      default: return { icon: 'description', color: 'text-outline', bg: 'bg-surface-container-high' };
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
            <span>Document Management</span>
          </nav>
          <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Document Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Secure storage for school policies, financial records, and student files.</p>
        </div>
        <button 
          className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-label-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95 duration-200"
          onClick={() => setUploadModal(true)}
        >
          <span className="material-symbols-outlined">cloud_upload</span>
          Upload File
        </button>
      </div>

      {/* Quick Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Storage Used', value: '45.2 GB', icon: 'hard_drive', color: '#006b5c' },
          { label: 'Total Files', value: '1,284', icon: 'folder', color: '#0060ac' },
          { label: 'Shared Externally', value: '34', icon: 'share', color: '#9d4224' },
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
        <div className={`p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4 ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`} 
              placeholder="Search documents by name or type..." 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-outline-variant hover:bg-surface-container'}`}>
              <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
            </button>
            <button className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-outline-variant hover:bg-surface-container'}`}>
              <span className="material-symbols-outlined text-[18px]">grid_view</span> View
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`border-b text-xs uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
              <tr>
                <th className="p-4 pl-6 font-semibold rounded-tl-xl">File Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Author</th>
                <th className="p-4 font-semibold">Size</th>
                <th className="p-4 font-semibold">Date Modified</th>
                <th className="p-4 pr-6 text-right font-semibold rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-outline">No documents found matching your search.</td>
                </tr>
              ) : (
                filtered.map(d => {
                  const style = getIconForType(d.type);
                  return (
                    <tr key={d.id} className={`border-b last:border-0 transition-colors group ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]/30' : 'border-[#eeeef0] hover:bg-[#f3f3f6]'}`}>
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                          <span className="material-symbols-outlined">{style.icon}</span>
                        </div>
                        <div>
                          <div className={`font-semibold text-sm ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{d.name}</div>
                          <div className={`text-[11px] ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>PDF Document</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dark ? 'bg-[#3c4a46] text-white' : 'bg-surface-container text-[#1a1c1e]'}`}>
                          {d.type}
                        </span>
                      </td>
                      <td className={`p-4 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{d.author}</td>
                      <td className={`p-4 font-mono text-xs ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{d.size}</td>
                      <td className={`p-4 font-mono text-xs ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{d.date}</td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${dark ? 'hover:bg-[#3c4a46] text-white' : 'hover:bg-white text-[#1a1c1e] shadow-sm'}`} title="Download">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                          <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${dark ? 'hover:bg-[#3c4a46] text-white' : 'hover:bg-white text-[#1a1c1e] shadow-sm'}`} title="Share">
                            <span className="material-symbols-outlined text-[18px]">share</span>
                          </button>
                          <button onClick={() => handleDelete(d.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-error/10 text-error`} title="Delete">
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

      {uploadModal && (
        <Modal title="Upload Document" onClose={() => setUploadModal(false)}>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className={`border-2 border-dashed rounded-2xl p-10 text-center ${dark ? 'border-[#3c4a46] bg-[#1a1c1e]' : 'border-outline-variant bg-[#f9f9fc]'}`}>
              <span className="material-symbols-outlined text-4xl text-outline mb-2">cloud_upload</span>
              <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Drag & drop your files here</p>
              <p className="text-xs text-outline mb-4">or click to browse from your computer</p>
              <button type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-bold border border-outline-variant hover:bg-surface-container-high transition-colors">Browse Files</button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Document Category</label>
              <select className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`}>
                <option>General</option>
                <option>Policy</option>
                <option>Finance</option>
                <option>HR</option>
                <option>Student Record</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setUploadModal(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-surface-container-high'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:brightness-110 transition-colors shadow-md">
                Upload Files
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
