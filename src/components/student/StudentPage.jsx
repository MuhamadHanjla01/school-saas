import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import StudentFeesView from './StudentFeesView';
import MessagingView from '../shared/MessagingView';
import { useDataCache } from '../../hooks/useDataCache';
import '../admin/AdminPage.css';

// ─── Sidebar Items ──────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', type: 'link' },
  { id: 'academics', label: 'Academics', icon: 'school', type: 'group',
    children: ['My Timetable', 'My Grades', 'My Assignments']
  },
  { id: 'finance', label: 'Finance', icon: 'payments', type: 'group',
    children: ['My Fees']
  },
  { id: 'communication', label: 'Communication', icon: 'forum', type: 'group',
    children: ['Messages', 'Notices']
  },
  { id: 'profile', label: 'My Profile', icon: 'person', type: 'link' },
];

// ─── Student Dashboard ─────────────────────────────────────────────────────
function StudentDashboard({ dark, studentData }) {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    axios.get('/api/school/notices').then(res => setNotices((res.data.notices || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="p-5 md:p-6 space-y-5 w-full max-w-[1600px] mx-auto animate-fadeIn">
      {/* Welcome Banner */}
      <section>
        <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-r from-[#6a4c93] via-[#7b5ea7] to-[#9d4edd] shadow-lg p-6 text-white min-h-[120px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight">Welcome, {studentData?.name || 'Student'}</h2>
          <p className="text-white/80 text-sm">Student ID: {studentData?.studentId || 'N/A'} • Class: {studentData?.className || 'N/A'}</p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Student ID', value: studentData?.studentId || 'N/A', icon: 'badge', color: '#6a4c93' },
          { label: 'Class', value: studentData?.className || 'N/A', icon: 'class', color: '#0060ac' },
          { label: 'Status', value: studentData?.status || 'Active', icon: 'verified', color: '#006b5c' },
          { label: 'Fee Status', value: studentData?.feeStatus || 'N/A', icon: 'payments', color: '#9d4224' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm mb-3" style={{ backgroundColor: stat.color }}>
              <span className="material-symbols-outlined !text-[18px]">{stat.icon}</span>
            </div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{stat.label}</h3>
            <p className={`text-lg font-bold mt-1 tracking-tight ${dark ? 'text-white' : 'text-on-surface'}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Recent Notices */}
      <section className={`p-5 rounded-[20px] shadow-sm border ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">Recent Notices</h3>
        {notices.length === 0 ? <p className="text-sm text-outline">No notices.</p> : (
          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className={`p-3 rounded-xl border ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold">{n.title}</h4>
                  <span className="text-[10px] text-outline">{new Date(n.date || n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── My Timetable ───────────────────────────────────────────────────────────
function MyTimetableView({ dark, classId }) {
  // For students, backend auto-resolves classId from the JWT token.
  // We pass classId as query param only as a fallback.
  const url = classId ? `/api/timetable?classId=${classId}` : '/api/timetable';
  const { data, loading } = useDataCache(url, {
    enabled: !!classId,
    transform: (d) => d.timetable || {},
  });
  const timetable = data || {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Timetable</h2>
      {loading ? <p className="text-outline">Loading...</p> : !classId ? <p className="text-outline">No class assigned.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {days.map(day => (
            <div key={day} className={`rounded-2xl border p-4 ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <h4 className="text-sm font-bold text-primary mb-3">{day}</h4>
              {(timetable[day] || []).length === 0 ? <p className="text-xs text-outline">No classes</p> :
                timetable[day].map((slot, i) => (
                  <div key={i} className={`mb-2 p-2 rounded-lg text-xs ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container-low'}`}>
                    <p className="font-bold">{slot.subject}</p>
                    <p className="text-outline">{slot.time}</p>
                    <p className="text-outline">{slot.teacher}</p>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Grades ──────────────────────────────────────────────────────────────
function MyGradesView({ dark, studentId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    axios.get(`/api/students/${studentId}`).then(res => {
      setResults(res.data.student?.examResults || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Grades</h2>
      {loading ? <p className="text-outline">Loading...</p> : results.length === 0 ? (
        <div className={`p-8 rounded-[20px] border text-center ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
          <span className="material-symbols-outlined text-outline !text-[48px] mb-3 block">grade</span>
          <p className="text-sm text-outline">No exam results available yet.</p>
        </div>
      ) : (
        <div className={`rounded-[20px] shadow-sm overflow-hidden border ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <table className="w-full text-left">
            <thead className={`border-b text-xs uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
              <tr>
                <th className="p-4">Exam</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Marks</th>
                <th className="p-4">Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
                  <td className="p-4 text-sm font-semibold">{r.exam?.name || 'N/A'}</td>
                  <td className="p-4 text-sm">{r.subject?.name || 'N/A'}</td>
                  <td className="p-4 text-sm font-bold">{r.marks ?? 'N/A'} / {r.totalMarks ?? 100}</td>
                  <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.grade === 'A+' || r.grade === 'A' ? 'bg-primary/10 text-primary' : 'bg-outline/10 text-outline'}`}>{r.grade || 'N/A'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── My Assignments ─────────────────────────────────────────────────────────
function MyAssignmentsView({ dark }) {
  const { data, loading } = useDataCache('/api/assignments', {
    transform: (d) => d.assignments || [],
  });
  const assignments = data || [];

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Assignments</h2>
      {loading ? <p className="text-outline">Loading...</p> : assignments.length === 0 ? (
        <div className={`p-8 rounded-[20px] border text-center ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
          <span className="material-symbols-outlined text-outline !text-[48px] mb-3 block">assignment</span>
          <p className="text-sm text-outline">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a.id} className={`p-4 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold">{a.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-outline/10 text-outline'}`}>{a.status || 'Active'}</span>
              </div>
              <p className="text-xs text-on-surface-variant">{a.description || 'No description'}</p>
              {a.dueDate && <p className="text-[10px] text-outline mt-2">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// MessagesView is now the shared MessagingView component (imported at top)

// ─── Notices ────────────────────────────────────────────────────────────────
function NoticesView({ dark }) {
  const { data, loading } = useDataCache('/api/school/notices', {
    transform: (d) => d.notices || [],
  });
  const notices = data || [];

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">Notices & Announcements</h2>
      {loading ? <p className="text-outline">Loading...</p> : notices.length === 0 ? (
        <p className="text-outline">No notices posted yet.</p>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className={`p-5 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold">{n.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${n.priority === 'High' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>{n.priority || 'Normal'}</span>
              </div>
              <p className="text-xs text-on-surface-variant">{n.content}</p>
              <p className="text-[10px] text-outline mt-2">{new Date(n.date || n.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Student Profile ────────────────────────────────────────────────────────
function StudentProfileView({ dark, studentData }) {
  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Profile</h2>
      <div className={`p-6 rounded-[20px] border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6a4c93] to-[#9d4edd] flex items-center justify-center text-white text-xl font-bold shadow-md">
            {(studentData?.name || 'S').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold">{studentData?.name || 'Student'}</h3>
            <p className="text-sm text-on-surface-variant">ID: {studentData?.studentId || 'N/A'} • Class: {studentData?.className || 'N/A'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Guardian', value: studentData?.guardianName || 'N/A' },
            { label: 'Phone', value: studentData?.phone || 'N/A' },
            { label: 'Gender', value: studentData?.gender || 'N/A' },
            { label: 'Status', value: studentData?.status || 'Active' },
          ].map((field, i) => (
            <div key={i}>
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{field.label}</label>
              <p className={`text-sm font-medium mt-1 ${dark ? 'text-white' : 'text-on-surface'}`}>{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Content ────────────────────────────────────────────────────────
function SidebarContent({ expanded, onToggle, activeItem, onItemClick, onSignOut, schoolName }) {
  return (
    <>
      <div className="mb-6 px-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6a4c93] to-[#9d4edd] flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>person</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-primary tracking-tight leading-none">Student Portal</h1>
          <span className="text-[10px] font-medium text-on-surface-variant opacity-70">{schoolName || 'Your School'}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-px admin-scrollbar overflow-y-auto overflow-x-hidden pb-4">
        {SIDEBAR_ITEMS.map(item => {
          if (item.type === 'link') {
            const isActive = activeItem === item.id;
            return (
              <button key={item.id} onClick={() => onItemClick(item.id)} className={`w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-200 ${isActive ? 'text-primary font-bold bg-primary/10 border-l-[3px] border-primary' : 'text-on-surface-variant font-medium hover:bg-surface-container-high border-l-[3px] border-transparent'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
              </button>
            );
          }
          const hasActiveChild = item.children.includes(activeItem);
          const isExpanded = expanded.includes(item.id) || hasActiveChild;
          return (
            <div key={item.id}>
              <button onClick={() => onToggle(item.id)} className={`w-full flex items-center justify-between py-[7px] px-3 rounded-lg font-medium transition-all ${hasActiveChild ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                  <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
                </div>
                <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-90' : ''}`} style={{ fontSize: '15px' }}>chevron_right</span>
              </button>
              {isExpanded && (
                <div className="pl-9 pr-2 space-y-px mt-0.5">
                  {item.children.map(child => (
                    <button key={child} onClick={() => onItemClick(child)} className={`block w-full text-left py-[6px] px-2.5 text-[12px] rounded-md transition-colors ${activeItem === child ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:text-primary'}`}>
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-outline-variant/40 shrink-0">
        <button onClick={onSignOut} className="w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg text-error font-medium hover:bg-error-container/40 transition-colors duration-200">
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>logout</span>
          <span className="text-[12.5px] font-semibold">Sign Out</span>
        </button>
      </div>
    </>
  );
}

// ─── Main Student Page ──────────────────────────────────────────────────────
export default function StudentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState([]);
  const [activeItem, setActiveItem] = useState(location.pathname.includes('/fees') || /session_id|regional_attempt/.test(location.search) ? 'My Fees' : 'dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileRetry, setProfileRetry] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    return () => document.documentElement.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    let active = true;
    setStudentData(null);
    setProfileLoading(true);
    setProfileError('');
    axios.get('/api/students/me/profile').then(res => {
      const student = res.data.student;
      if (!student || !user?.schoolId || student.schoolId !== user.schoolId) {
        throw new Error('No student record is linked to your school account. Contact your school office.');
      }
      if (active) setStudentData({ ...student, className: student.className || student.class?.name || 'Unassigned' });
    }).catch(err => {
      if (active) setProfileError(err.response?.data?.error || err.message || 'Unable to load your student profile.');
    }).finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.schoolId, profileRetry]);

  const toggleSubmenu = useCallback((id) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarProps = {
    expanded, onToggle: toggleSubmenu, activeItem, schoolName: user?.schoolName,
    onItemClick: (item) => { setActiveItem(item); setMobileOpen(false); },
    onSignOut: handleSignOut,
  };

  return (
    <div className={`flex h-screen overflow-hidden font-['Inter'] ${dark ? 'bg-[#1a1c1e] text-[#f0f0f3]' : 'bg-surface text-on-background'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen py-3 px-2 border-r shrink-0 overflow-y-auto admin-scrollbar w-[260px] ${dark ? 'border-[#3c4a46]/60 bg-gradient-to-b from-[#2f3133] to-[#262829]' : 'border-outline-variant/60 bg-gradient-to-b from-[#f7f7fa] to-[#eeeeef]'}`}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="admin-mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className={`admin-mobile-drawer flex flex-col py-2 px-3 w-[280px] ${dark ? 'bg-[#2f3133]' : ''}`}>
            <SidebarContent {...sidebarProps} />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto admin-scrollbar">
        <header className={`flex justify-between items-center h-16 px-6 sticky top-0 z-50 w-full border-b backdrop-blur-[24px] ${dark ? 'border-[#3c4a46]/60 bg-[#1a1c1e]/90' : 'border-outline-variant/60 bg-surface/90'}`}>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-surface-container-high" onClick={() => setMobileOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
            </button>
            <span className="text-sm font-semibold text-on-surface-variant">{user?.schoolName || 'Your School'} · Student Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-surface-container'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6a4c93] to-[#9d4edd] flex items-center justify-center text-white text-xs font-bold">
              {(studentData?.name || 'S').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {profileLoading && <p role="status" className="p-6">Loading your student profile...</p>}
        {profileError && <div role="alert" className="p-6 space-y-3"><p className="text-error">{profileError}</p><button className="rounded-xl border px-4 py-2" onClick={() => setProfileRetry(value => value + 1)}>Try again</button></div>}
        {!profileLoading && !profileError && studentData && <>
        {/* Views */}
        {activeItem === 'dashboard' && <StudentDashboard dark={dark} studentData={studentData} />}
        {activeItem === 'My Timetable' && <MyTimetableView dark={dark} classId={studentData?.classId} />}
        {activeItem === 'My Grades' && <MyGradesView dark={dark} studentId={studentData?.id} />}
        {activeItem === 'My Assignments' && <MyAssignmentsView dark={dark} />}
        {activeItem === 'My Fees' && <StudentFeesView dark={dark} studentId={studentData?.id} schoolName={user?.schoolName} />}
        {activeItem === 'Messages' && <MessagingView dark={dark} role="Student" />}
        {activeItem === 'Notices' && <NoticesView dark={dark} />}
        {activeItem === 'profile' && <StudentProfileView dark={dark} studentData={studentData} />}
        </>}
      </main>
    </div>
  );
}
