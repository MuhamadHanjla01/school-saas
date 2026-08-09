import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard({ dark, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('https://erpzo-backend.onrender.com/api/school/dashboard-stats');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-5 w-full max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header Banner - Upgraded with smooth gradient and shadow */}
      <section className="mb-5">
        <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-r from-primary via-primary-container to-[#009b86] shadow-lg shadow-primary/20 p-6 text-white min-h-[140px] flex flex-col justify-center transition-all duration-300 hover:shadow-primary/30 hover:-translate-y-0.5">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-2xl mix-blend-overlay pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Welcome back, Administrator</h2>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <p className="text-xs font-medium">School is running at 94% attendance today</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-inner">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90 filter drop-shadow-sm">
                  <circle className="text-white/20" cx="20" cy="20" fill="transparent" r="16" stroke="currentColor" strokeWidth="3"></circle>
                  <circle className="text-white transition-all duration-1000 ease-out" cx="20" cy="20" fill="transparent" r="16" stroke="currentColor" strokeDasharray="100.5" strokeDashoffset="60.3" strokeLinecap="round" strokeWidth="3"></circle>
                </svg>
                <span className="absolute text-[9px] font-bold">12d</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                  <span className="material-symbols-outlined text-[10px]">verified</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">Enterprise Pro</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/90">
                  <span className="material-symbols-outlined text-xs">timer</span>
                  <p className="text-[11px] font-medium">Subscription expires in 12 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row - Added hover states and subtle borders */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Students', value: '1,240', sub: 'vs last year', icon: 'groups', color: 'primary', trend: '+12%' },
          { label: 'Total Teachers', value: '86', sub: 'Active Educators', icon: 'co_present', color: 'secondary' },
          { label: 'Total Staff', value: '42', sub: 'Support Personnel', icon: 'badge', color: 'tertiary' },
          { label: 'Active Classes', value: '18', sub: 'Concurrent sessions', icon: 'class', color: 'primary-container', text: 'on-primary-container' }
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${dark ? 'bg-[#2f3133] border-outline-variant/10 hover:border-outline-variant/30' : 'bg-white border-surface-variant/50 hover:border-surface-variant'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 bg-${stat.color}/10 text-${stat.text || stat.color} rounded-xl`}>
                <span className="material-symbols-outlined !text-[18px]">{stat.icon}</span>
              </div>
              {stat.trend && <span className="text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-full">{stat.trend}</span>}
            </div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{stat.label}</h3>
            <p className={`text-2xl font-bold mt-1 tracking-tight ${dark ? 'text-white' : 'text-on-surface'}`}>{stat.value}</p>
            <p className="text-[10px] font-medium text-outline mt-1">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Operational Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        {/* Attendance Card */}
        <div className={`lg:col-span-4 p-6 rounded-[20px] shadow-sm flex flex-col items-center text-center justify-center border transition-all duration-300 hover:shadow-md ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-5 w-full text-left text-on-surface-variant">Today's Attendance</h3>
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90">
              <circle className="text-surface-variant/30" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeWidth="6"></circle>
              <circle className="text-primary transition-all duration-1000 ease-out drop-shadow-md" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeDasharray="276.4" strokeDashoffset="16.6" strokeLinecap="round" strokeWidth="6"></circle>
            </svg>
            <span className={`absolute text-xl font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>94%</span>
          </div>
          <p className="text-[11px] font-medium text-on-surface-variant mt-5 bg-surface-variant/20 px-3 py-1 rounded-full">1,165 students checked in today</p>
          <button className="mt-4 text-primary text-[11px] font-bold uppercase tracking-wide flex items-center gap-1 hover:text-primary-container transition-colors">
            View detailed report <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Finance Card */}
        <div className={`lg:col-span-8 p-6 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Fee Collection Summary</h3>
            <div className="flex gap-1.5 p-1 bg-surface-variant/10 rounded-full">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors ${dark ? 'text-outline hover:text-white' : 'text-outline hover:text-on-surface'}`}>Monthly</span>
              <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">Quarterly</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Collected</h4>
                </div>
                <p className="text-2xl font-bold text-primary tracking-tight">$124,000</p>
                <div className="mt-3 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[87%] rounded-full shadow-[0_0_8px_rgba(0,194,168,0.5)]"></div>
                </div>
                <p className="mt-2 text-[10px] font-medium text-outline">87% of target achieved</p>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-error-container/10 border border-error-container/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-error/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-error !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Outstanding</h4>
                </div>
                <p className="text-2xl font-bold text-error tracking-tight">$18,000</p>
                <div className="mt-3 h-1.5 w-full bg-error-container/30 rounded-full overflow-hidden">
                  <div className="h-full bg-error w-[13%] rounded-full shadow-[0_0_8px_rgba(186,26,26,0.5)]"></div>
                </div>
                <p className="mt-2 text-[10px] font-medium text-outline">Due by end of month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Task & Event Columns */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Upcoming Exams */}
        <div className={`p-5 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Upcoming Exams</h3>
            <button className="p-1 hover:bg-surface-variant/20 rounded-full text-outline transition-colors">
              <span className="material-symbols-outlined !text-[18px]">more_vert</span>
            </button>
          </div>
          <div className="space-y-3">
            <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-surface-variant/10 ${dark ? 'bg-[#3c4a46]/30' : 'bg-surface-container-lowest border border-surface-variant/30'}`}>
              <div className="bg-secondary/10 text-secondary p-1.5 rounded-lg flex flex-col items-center justify-center min-w-[44px] h-[44px] shadow-sm">
                <span className="text-[9px] font-bold uppercase">Oct</span>
                <span className="text-sm font-bold leading-none">15</span>
              </div>
              <div className="pt-0.5">
                <p className={`text-[13px] font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>Mid-term 2024</p>
                <p className="text-[11px] text-outline mt-0.5">Grades 9 - 12 • Main Hall</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-surface-variant/10 ${dark ? 'bg-[#3c4a46]/30' : 'bg-surface-container-lowest border border-surface-variant/30'}`}>
              <div className="bg-tertiary/10 text-tertiary p-1.5 rounded-lg flex flex-col items-center justify-center min-w-[44px] h-[44px] shadow-sm">
                <span className="text-[9px] font-bold uppercase">Oct</span>
                <span className="text-sm font-bold leading-none">22</span>
              </div>
              <div className="pt-0.5">
                <p className={`text-[13px] font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>Final Term Prep</p>
                <p className="text-[11px] text-outline mt-0.5">All Faculty Workshop</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Admissions */}
        <div className={`p-5 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Recent Admissions</h3>
            <a className="text-primary text-[11px] font-bold uppercase tracking-wider hover:text-primary-container transition-colors" href="#">See all</a>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Ethan Hunt', desc: 'Grade 10-B • Joined 2h ago', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2L3mWivoRwuDVQf2PxnEa6Xg2uDkut-KPa_Ij8S68W57igYujBUk86jfx5_5ug_3lIFsT5JbnO01xarc-3OxKUmBx644gPdll5Opuy1FwrsgdN9GoUg2fbkHsVe-m9SMDSycAE0fIiHFUz9bzuEyB-5FWITSQy0ExFTscd5mwOSjKbtPaSBtLjsgV6OHHY6QI_LJoFe5FbenN-iA9QrJVExceE3LRvyChx8Rpfss0nq1k9GpasrR-Q' },
              { name: 'Sophia Williams', desc: 'Grade 8-A • Joined 5h ago', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqe1ORK3nEiHvWJ7DQVhfuYxXt7kiwpRnpEUFJQNeg7jaMBplHJgYvaUjVqMo45o_O2LWG_ebaCd242x0mHdP-1Zt0YLBl5uYaf3hJYKyKeUGBQ2qK9X-Q6TIsdhvq7fsjh8OoiuuV1l-9PF0CRZDR16Y305HVqLo8usGIUZocYMI0HNpVmP5d2VpNrCF2Qb0mbAfMprXremWADxwgtowlzinhendjV6D00YygDuPrhOzjQxpdKGYhDg' },
              { name: 'Marcus Chen', desc: 'Grade 11-C • Joined Yesterday', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTMItAv4N-mNnN_3rgcQUQVyBoLBh7McK4aPUNUotO5Z6W3smNn2aFkeAP0eoGZltUllDQRQaf6xPJNkFgobSxeT2DOo4Lyz5_p5Eca7pdhnDfHCt_ddsnraYmvlNUS8lidtp9lNnMnT4pFhUAVZDE2kN9m9mU_rBzZH1V6VNhZuzd5UkGEwcpbsY0BiLz2gbD324uehH75PvJ-ZzWJn_yGyglrzqMVornT32PGgDix_1b8Xmb4p61Nw' }
            ].map((student, i) => (
              <div key={i} className="flex items-center gap-3 group cursor-pointer">
                <img className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:ring-2 ring-primary/30 transition-all" alt="Student profile" src={student.img} />
                <div className="flex-1">
                  <p className={`text-[13px] font-bold group-hover:text-primary transition-colors ${dark ? 'text-white' : 'text-on-surface'}`}>{student.name}</p>
                  <p className="text-[11px] text-outline">{student.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-variant/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary !text-[14px]">chat</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Feed */}
        <div className={`p-5 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Announcements</h3>
            <button className="p-1 hover:bg-surface-variant/20 rounded-full text-outline transition-colors">
              <span className="material-symbols-outlined !text-[18px]">add</span>
            </button>
          </div>
          <div className="space-y-6">
            <div className={`relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 ${dark ? 'before:bg-[#3c4a46]' : 'before:bg-surface-variant/50'}`}>
              <div className={`absolute left-[-3px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 shadow-[0_0_5px_rgba(0,194,168,0.5)] ${dark ? 'ring-[#2f3133]' : 'ring-white'}`}></div>
              <p className={`text-[13px] font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>Staff Meeting at 2 PM</p>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Topic: Curriculum updates for Q4. Mandatory for all senior faculty.</p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-outline mt-2 block">10 mins ago</span>
            </div>
            <div className={`relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 ${dark ? 'before:bg-[#3c4a46]' : 'before:bg-surface-variant/50'}`}>
              <div className={`absolute left-[-3px] top-1.5 w-2 h-2 rounded-full bg-outline ring-4 ${dark ? 'ring-[#2f3133]' : 'ring-white'}`}></div>
              <p className={`text-[13px] font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>Sports Day rescheduled</p>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Moved to Nov 5th due to weather forecast. Notification sent to parents.</p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-outline mt-2 block">2 hours ago</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions & Bottom Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Announcement', icon: 'campaign' },
              { label: 'Add Student', icon: 'person_add_alt', action: () => onNavigate('Student Management') },
              { label: 'Add Teacher', icon: 'school', action: () => onNavigate('Teacher Management') },
              { label: 'Attendance', icon: 'how_to_reg', action: () => onNavigate('Attendance') }
            ].map((action, i) => (
              <button key={i} onClick={action.action} className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-[20px] transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-1 ${dark ? 'bg-[#2f3133] border-outline-variant/10 hover:border-primary/50' : 'bg-white border-surface-variant/50 hover:border-primary/50'}`}>
                <div className="w-10 h-10 bg-surface-variant/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                  <span className={`material-symbols-outlined !text-[18px] ${dark ? 'text-white' : 'text-on-surface'} group-hover:text-white`}>{action.icon}</span>
                </div>
                <span className={`text-[11px] font-bold ${dark ? 'text-outline group-hover:text-white' : 'text-on-surface-variant group-hover:text-primary'} transition-colors`}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts & Birthdays */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className={`p-4 rounded-[20px] shadow-sm border transition-all duration-300 hover:shadow-md ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>cake</span>
              Today's Birthdays
            </h3>
            <div className="flex -space-x-2 mb-2">
              <img className={`w-8 h-8 rounded-full border-2 object-cover shadow-sm ${dark ? 'border-[#2f3133]' : 'border-white'}`} alt="Student profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIBA_HX9SM13ItB8w5r8e8qZImmvEKZjYSG-sIzG2LEGqNgfJc0eZy5p2XFA6l1QWUhmwRUVjvV-wpG5E8d2htN5nb9cIt24knHSuVCZI8NNlcfC_wQrfcxYhDmMaq1g_Ul6QaLpNaMPXHObSe-hiNnmMtNVj0hI63_xDalmmRXPFZN7P5n6r2iECCHOkwHFkVXbDvNfTtZ14hGDiviB1xxNJtBGC7zRh0O2CanLTIscqZ2lPQWHCWgA" />
              <img className={`w-8 h-8 rounded-full border-2 object-cover shadow-sm ${dark ? 'border-[#2f3133]' : 'border-white'}`} alt="Student profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV9pRDFDzCs6Ve-M0mCEPMUxOYaIDKnJE1ZTlNyl_L5IfHHP6U7Qvhh_QWvwdR-0B5oi9x7WdzOrjVYRYWuZl6Xe0ovg_IRNBrbU02LFXKspc0HpHWY-QCjQZuTLfZKgBBdAkTPJHmo0DZJrdIT1xMGPBASCZd5Pzn7tzlwLhf5vSgOXvCM8JLP_9SL1nOklwCYN6uY92ZU9IyqAYSqgrEVs1ZH4XpQUmA11Ou9uhv-MlC4iNpTkz6Dg" />
              <div className={`w-8 h-8 rounded-full border-2 bg-secondary/10 flex items-center justify-center text-secondary text-[10px] font-bold shadow-sm ${dark ? 'border-[#2f3133]' : 'border-white'}`}>+2</div>
            </div>
            <p className="text-[11px] font-medium text-outline">Celebrate with Maya and Leo today!</p>
          </div>
          
          <div className="bg-error/5 p-4 rounded-[20px] border border-error/10 transition-all duration-300 hover:shadow-md hover:border-error/30">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-error mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined !text-[16px]">warning</span>
              System Alerts
            </h3>
            <ul className="space-y-2">
              <li className="text-[11px] font-medium text-on-surface flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-error rounded-full shadow-[0_0_4px_rgba(186,26,26,0.8)]"></span>
                1 pending teacher review
              </li>
              <li className="text-[11px] font-medium text-on-surface flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-error rounded-full shadow-[0_0_4px_rgba(186,26,26,0.8)]"></span>
                Backup failed at 03:00 AM
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAB - Upgraded with glow effect */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full shadow-[0_4px_14px_rgba(0,194,168,0.4)] flex items-center justify-center hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,194,168,0.6)] active:scale-95 transition-all duration-300 z-50">
        <span className="material-symbols-outlined !text-[20px]">chat_bubble</span>
      </button>
    </div>
  );
}
