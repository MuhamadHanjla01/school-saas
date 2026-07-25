import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toast } from './AdminUI';
import StudentOnboardingWizard from './StudentOnboardingWizard';

export default function AdmissionsView({ dark }) {
  const [classes, setClasses] = useState([]);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        axios.get('https://school-backend-70ny.onrender.com/api/classes'),
        axios.get('https://school-backend-70ny.onrender.com/api/students')
      ]);
      setClasses(classesRes.data.classes || []);
      
      let allStudents = studentsRes.data.students || [];

      // Inject draft into the list if it exists
      const savedDraft = localStorage.getItem('studentOnboardingDraft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Show draft if there's at least a name or guardian name started
          if (parsed.name || parsed.guardianName) {
            allStudents.unshift({
              id: 'draft-local',
              isDraft: true,
              name: parsed.name || 'Unnamed Draft',
              studentId: 'DRAFT-PENDING',
              className: 'Pending Assignment',
              createdAt: new Date().toISOString(),
              studentEmail: parsed.studentEmail || 'pending@draft.local',
              draftData: parsed
            });
          }
        } catch (err) {
          console.error('Failed to parse draft for list', err);
        }
      }

      setRecentAdmissions(allStudents);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setToast({ message: 'Failed to load classes or recent students', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (student) => {
    if (student.isDraft) {
      localStorage.removeItem('studentOnboardingDraft');
      setToast({ message: 'Draft deleted successfully', type: 'success' });
      fetchData();
      return;
    }
    
    if (window.confirm(`Are you sure you want to permanently delete ${student.name}? This cannot be undone.`)) {
      try {
        await axios.delete(`https://school-backend-70ny.onrender.com/api/students/${student.id}`);
        setToast({ message: 'Student deleted permanently', type: 'success' });
        fetchData();
      } catch (err) {
        console.error('Delete error', err);
        setToast({ message: 'Failed to delete student', type: 'error' });
      }
    }
  };

  const inputClass = `p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`;

  const filteredAdmissions = recentAdmissions.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`p-5 lg:p-10 flex-1 flex flex-col space-y-8 animate-fadeIn h-full overflow-hidden ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-[#f8f9fa] text-on-surface'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <h2 className={`text-2xl lg:text-3xl font-bold font-serif tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Student Onboarding</h2>
        <button 
          onClick={() => setShowWizard(true)} 
          className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#006b5c] text-white hover:brightness-110 transition-colors shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Start New Enrollment
        </button>
      </div>

      {/* Filters Bar */}
      <div className={`flex flex-wrap items-center gap-4 p-4 rounded-[20px] ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
          <input 
            type="text" 
            placeholder="Search Student Name or ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-colors border-none focus:ring-0 ${dark ? 'bg-[#1a1c1e] text-white placeholder-white/30' : 'bg-[#f3f4f6] text-[#1a1c1e]'}`}
          />
        </div>
        
        <select className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-[#f3f4f6] text-[#1a1c1e]'}`}>
          <option>All Grades</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        <select className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-[#f3f4f6] text-[#1a1c1e]'}`}>
          <option>Onboarding Status</option>
          <option>Completed</option>
          <option>Pending</option>
        </select>

        <button className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'bg-[#1a1c1e] text-white hover:bg-white/10' : 'bg-[#f3f4f6] text-[#1a1c1e] hover:bg-black/5'}`}>
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className={`text-lg font-bold mb-4 font-serif ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Recent Onboarding</h3>
        
        <div className={`flex-1 overflow-auto rounded-[24px] ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className={`sticky top-0 z-10 ${dark ? 'bg-[#2f3133]' : 'bg-[#fafafa]'}`}>
              <tr>
                <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#eeeef0] text-outline'}`}>Student Profile</th>
                <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#eeeef0] text-outline'}`}>Application ID</th>
                <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#eeeef0] text-outline'}`}>Grade & Section</th>
                <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#eeeef0] text-outline'}`}>Date</th>
                <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#eeeef0] text-outline'}`}>Status</th>
                <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b text-right ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-[#eeeef0] text-outline'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center opacity-70">Loading history...</td>
                </tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center opacity-50">No students found.</td>
                </tr>
              ) : (
                filteredAdmissions.map((student) => {
                  const initials = (student.name || 'S').substring(0, 2).toUpperCase();
                  const fakeEmail = student.studentEmail || `${student.name.split(' ')[0].toLowerCase()}@edu.example.com`;
                  
                  let appDate = 'Oct 24, 2023';
                  if (student.createdAt) {
                    appDate = new Date(student.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    });
                  }
                  
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => {
                        if (student.isDraft) {
                          setShowWizard(true);
                        }
                      }}
                      className={`border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${student.isDraft ? 'cursor-pointer bg-amber-50/50 dark:bg-amber-900/10' : ''} ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006b5c] to-[#00493e] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{student.name}</p>
                            <p className="text-xs opacity-70 mt-0.5">{fakeEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-black/5 dark:bg-white/5 rounded">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">
                        Grade {student.className}
                      </td>
                      <td className="px-6 py-4 text-sm opacity-90">
                        {appDate}
                      </td>
                      <td className="px-6 py-4">
                        {student.isDraft ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] dark:bg-[#92400e]/20 dark:text-[#fcd34d]">
                            <span className="material-symbols-outlined text-[14px]">edit_document</span>
                            Draft / Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333] dark:bg-[#137333]/20 dark:text-[#81c995]">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(student);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${dark ? 'text-[#ffb4ab] hover:bg-[#ffb4ab]/10' : 'text-[#ba1a1a] hover:bg-[#ba1a1a]/10'}`}
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showWizard && (
        <StudentOnboardingWizard 
          dark={dark} 
          onClose={() => {
            setShowWizard(false);
            fetchData();
          }} 
          classes={classes} 
          onComplete={() => {
            setShowWizard(false);
            fetchData();
          }} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
