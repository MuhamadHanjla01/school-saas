import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import MessagingView from '../shared/MessagingView';
import { useDataCache } from '../../hooks/useDataCache';

// ─── Sidebar Items ──────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', type: 'link' },
  { id: 'teaching', label: 'Teaching', icon: 'school', type: 'group',
    children: ['My Classes', 'My Timetable', 'My Assignments', 'My Attendance']
  },
  { id: 'communication', label: 'Communication', icon: 'forum', type: 'group',
    children: ['Messages', 'Notices']
  },
  { id: 'profile', label: 'My Profile', icon: 'person', type: 'link' },
];

// ─── Teacher Dashboard ──────────────────────────────────────────────────────
function TeacherDashboard({ dark, profile }) {
  const { data: dashData, loading } = useDataCache('/api/teachers/me/dashboard');

  return (
    <div className="p-5 md:p-6 space-y-5 w-full max-w-[1600px] mx-auto animate-fadeIn">
      {/* Welcome Banner */}
      <section className="mb-5">
        <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-r from-[#0060ac] via-[#0077cc] to-[#00897b] shadow-lg p-6 text-white min-h-[120px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight">Welcome, {profile?.name || 'Teacher'}</h2>
          <p className="text-white/80 text-sm">{profile?.department || 'Department'} • Employee ID: {profile?.employeeId || 'N/A'}</p>
        </div>
      </section>

      {/* Quick Stats from teacher dashboard API */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(dashData?.stats || [
          { label: 'My Classes', value: String(profile?.classCount || '0'), icon: 'class', color: '#0060ac' },
          { label: 'My Subjects', value: String((profile?.subjectNames || []).length), icon: 'menu_book', color: '#006b5c' },
          { label: 'Active Assignments', value: '0', icon: 'assignment', color: '#9d4224' },
          { label: 'Attendance Rate', value: '0%', icon: 'trending_up', color: '#5b5f62' },
        ]).map((stat, i) => (
          <div key={i} className={`p-5 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: stat.color }}>
                <span className="material-symbols-outlined !text-[18px]">{stat.icon}</span>
              </div>
            </div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{stat.label}</h3>
            <p className={`text-2xl font-bold mt-1 tracking-tight ${dark ? 'text-white' : 'text-on-surface'}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* My Subjects */}
      <section className={`p-5 rounded-[20px] shadow-sm border ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">My Subjects</h3>
        <div className="flex flex-wrap gap-2">
          {(dashData?.subjectNames || profile?.subjectNames || []).length > 0 ? (dashData?.subjectNames || profile?.subjectNames || []).map(s => (
            <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">{s}</span>
          )) : <span className="text-sm text-outline">No subjects assigned yet.</span>}
        </div>
      </section>

      {/* Recent Notices */}
      {dashData?.recentNotices && dashData.recentNotices.length > 0 && (
        <section className={`p-5 rounded-[20px] shadow-sm border ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">Recent Notices</h3>
          <div className="space-y-3">
            {dashData.recentNotices.map(n => (
              <div key={n.id} className={`p-3 rounded-xl border ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold">{n.title}</h4>
                  <span className="text-[10px] text-outline">{new Date(n.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2">{n.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── My Classes ─────────────────────────────────────────────────────────────
function MyClassesView({ dark }) {
  const { data, loading } = useDataCache('/api/classes', {
    transform: (d) => d.classes || [],
  });
  const classes = data || [];

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Classes</h2>
      {loading ? <p className="text-outline">Loading...</p> : classes.length === 0 ? <p className="text-outline">No classes found.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className={`p-5 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <h4 className="text-[16px] font-bold mb-2">{cls.name}</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>group</span>
                <span className="text-[12px]">{cls.students || cls._count?.students || 0} Students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>meeting_room</span>
                <span className="text-[12px]">{cls.room || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Timetable ───────────────────────────────────────────────────────────
function MyTimetableView({ dark }) {
  const { data: classesData } = useDataCache('/api/classes', {
    transform: (d) => d.classes || [],
  });
  const classes = classesData || [];
  const [selectedClass, setSelectedClass] = useState('');

  const { data: timetableData, loading } = useDataCache(
    selectedClass ? `/api/timetable?classId=${selectedClass}` : null,
    { enabled: !!selectedClass, transform: (d) => d.timetable || {} }
  );
  const timetable = timetableData || {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Timetable</h2>
      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={`p-2.5 rounded-xl border text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-white border-outline-variant'}`}>
        <option value="">Select a class...</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {loading ? <p className="text-outline">Loading...</p> : !selectedClass ? <p className="text-outline">Select a class to view timetable.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {days.map(day => (
            <div key={day} className={`rounded-2xl border p-4 ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <h4 className="text-sm font-bold text-primary mb-3">{day}</h4>
              {(timetable[day] || []).length === 0 ? <p className="text-xs text-outline">No classes</p> :
                timetable[day].map((slot, i) => (
                  <div key={i} className={`mb-2 p-2 rounded-lg text-xs ${dark ? 'bg-[#3c4a46]' : 'bg-surface-container-low'}`}>
                    <p className="font-bold">{slot.subject}</p>
                    <p className="text-outline">{slot.time}</p>
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

// ─── My Assignments ─────────────────────────────────────────────────────────
function MyAssignmentsView({ dark }) {
  const { data, loading } = useDataCache('/api/assignments', {
    transform: (d) => d.assignments || [],
  });
  const assignments = data || [];

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Assignments</h2>
      {loading ? <p className="text-outline">Loading...</p> : assignments.length === 0 ? <p className="text-outline">No assignments found.</p> : (
        <div className={`rounded-[20px] shadow-sm overflow-hidden border ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <table className="w-full text-left">
            <thead className={`border-b text-xs uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Class</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
                  <td className="p-4 font-semibold text-sm">{a.title}</td>
                  <td className="p-4 text-sm">{a.class?.name || a.className || 'N/A'}</td>
                  <td className="p-4 text-sm">{a.subject?.name || a.subjectName || 'N/A'}</td>
                  <td className="p-4 text-sm">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-outline/10 text-outline'}`}>{a.status || 'Active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── My Attendance ──────────────────────────────────────────────────────────
function MyAttendanceView({ dark }) {
  const { data: classesData } = useDataCache('/api/classes', {
    transform: (d) => d.classes || [],
  });
  const classes = classesData || [];
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    axios.get(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`)
      .then(res => setRecords(res.data.records || res.data.attendance || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;

  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">Attendance</h2>
      <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>View student attendance for your classes.</p>
      
      <div className="flex flex-wrap gap-3">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={`p-2.5 rounded-xl border text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-white border-outline-variant'}`}>
          <option value="">Select a class...</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={`p-2.5 rounded-xl border text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-white border-outline-variant'}`} />
      </div>

      {!selectedClass ? (
        <div className={`p-8 rounded-[20px] border text-center ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
          <span className="material-symbols-outlined text-primary !text-[48px] mb-3 block">how_to_reg</span>
          <p className="text-sm font-medium text-on-surface-variant">Select a class to view attendance records.</p>
        </div>
      ) : loading ? <p className="text-outline">Loading...</p> : records.length === 0 ? (
        <p className="text-sm text-outline">No attendance records for this date.</p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border text-center ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <p className="text-xs text-outline uppercase">Total</p>
              <p className="text-lg font-bold">{records.length}</p>
            </div>
            <div className={`p-4 rounded-xl border text-center ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <p className="text-xs text-primary uppercase">Present</p>
              <p className="text-lg font-bold text-primary">{presentCount}</p>
            </div>
            <div className={`p-4 rounded-xl border text-center ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
              <p className="text-xs text-error uppercase">Absent</p>
              <p className="text-lg font-bold text-error">{absentCount}</p>
            </div>
          </div>

          {/* Records Table */}
          <div className={`rounded-[20px] shadow-sm overflow-hidden border ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
            <table className="w-full text-left">
              <thead className={`border-b text-xs uppercase tracking-wider ${dark ? 'border-[#3c4a46] bg-[#3c4a46]/50 text-[#bbcac4]' : 'border-[#eeeef0] bg-[#f3f3f6] text-on-surface-variant'}`}>
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id || i} className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
                    <td className="p-4 text-sm font-semibold">{r.student?.name || r.studentName || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'Present' ? 'bg-primary/10 text-primary' : r.status === 'Absent' ? 'bg-error/10 text-error' : 'bg-outline/10 text-outline'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

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

// ─── My Profile ─────────────────────────────────────────────────────────────
function TeacherProfileView({ dark, profile }) {
  return (
    <div className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
      <h2 className="text-xl font-bold tracking-tight">My Profile</h2>
      <div className={`p-6 rounded-[20px] border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0060ac] to-[#00897b] flex items-center justify-center text-white text-xl font-bold shadow-md">
            {(profile?.name || 'T').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold">{profile?.name || 'Teacher'}</h3>
            <p className="text-sm text-on-surface-variant">{profile?.department || 'N/A'} • {profile?.employeeId || 'N/A'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Email', value: profile?.email || 'N/A' },
            { label: 'Phone', value: profile?.phone || 'N/A' },
            { label: 'Title', value: profile?.title || 'N/A' },
            { label: 'Department', value: profile?.department || 'N/A' },
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

// ─── Teacher Sidebar ────────────────────────────────────────────────────────
function SidebarContent({ expanded, onToggle, activeItem, onItemClick, onSignOut, schoolName }) {
  return (
    <>
      <div className="mb-6 px-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0060ac] to-[#00897b] flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>school</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-primary tracking-tight leading-none">Teacher Portal</h1>
          <span className="text-[10px] font-medium text-on-surface-variant opacity-70">{schoolName || 'Your School'}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-px admin-scrollbar overflow-y-auto overflow-x-hidden pb-4">
        {SIDEBAR_ITEMS.map(item => {
          if (item.type === 'link') {
            const isActive = activeItem === item.id || activeItem === item.label;
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
                    <button key={child} onClick={() => onItemClick(child)} className={`block w-full text-left py-[6px] px-2.5 text-[12px] rounded-md transition-colors ${activeItem === child ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest/30'}`}>
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

// ─── Main Teacher Page ──────────────────────────────────────────────────────
export default function TeacherPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState([]);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    return () => document.documentElement.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/teachers/me/profile');
        setProfile({ ...res.data.teacher, email: res.data.email });
      } catch (err) {
        console.error('Failed to fetch teacher profile', err);
      }
    };
    fetchProfile();
  }, []);

  const toggleSubmenu = useCallback((id) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarProps = {
    expanded, onToggle: toggleSubmenu, activeItem, dark,
    onItemClick: (item) => { setActiveItem(item); setMobileOpen(false); },
    onSignOut: handleSignOut,
    schoolName: user?.schoolName,
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
        {/* Top Nav */}
        <header className={`flex justify-between items-center h-16 px-6 sticky top-0 z-50 w-full border-b backdrop-blur-[24px] ${dark ? 'border-[#3c4a46]/60 bg-[#1a1c1e]/90' : 'border-outline-variant/60 bg-surface/90'}`}>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-surface-container-high" onClick={() => setMobileOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
            </button>
            <span className="text-sm font-semibold text-on-surface-variant">{user?.schoolName || 'Your School'} · Teacher Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-surface-container'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0060ac] to-[#00897b] flex items-center justify-center text-white text-xs font-bold">
              {(profile?.name || 'T').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Views */}
        {activeItem === 'dashboard' && <TeacherDashboard dark={dark} profile={profile} />}
        {activeItem === 'My Classes' && <MyClassesView dark={dark} />}
        {activeItem === 'My Timetable' && <MyTimetableView dark={dark} />}
        {activeItem === 'My Assignments' && <MyAssignmentsView dark={dark} />}
        {activeItem === 'My Attendance' && <MyAttendanceView dark={dark} />}
        {activeItem === 'Messages' && <MessagingView dark={dark} role="Teacher" />}
        {activeItem === 'Notices' && <NoticesView dark={dark} />}
        {activeItem === 'profile' && <TeacherProfileView dark={dark} profile={profile} />}
      </main>
    </div>
  );
}
