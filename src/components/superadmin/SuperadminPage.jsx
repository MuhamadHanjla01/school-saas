import PlatformDashboard from './PlatformDashboard';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ResourcePage, SettingsPage, downloadBlob, errorText } from '../shared/AdminWorkspace';
import SchoolsWorkspace from './SchoolsWorkspace';
import SystemUpdateView from './SystemUpdateView';
import '../shared/AdminWorkspace.css';
import './SuperadminPage.css';
import '../shared/ClassicAdmin.css';
const records={'School Inquiries':'inquiries','Contact Inquiry':'contacts','Addons':'addons','Features':'features','Coupons & Discounts':'coupons','Email Schools':'email','SMS / WhatsApp':'sms','Templates':'templates','Knowledge Base':'articles'};
const resources={'Package':'plans','Subscription':'subscriptions','Transactions':'transactions','Ticket Inbox':'tickets','Audit Logs':'audit','Login Activity':'logins','Staff':'staff'};
const settings={'System Settings':'system','Web Settings':'website','Academy Setup':'academy','White-label':'branding'};
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', type: 'link' },
  {
    id: 'schools', label: 'Schools', icon: 'school', type: 'group',
    children: ['Manage Schools', 'School Inquiries'],
  },
  {
    id: 'personnel', label: 'Personnel', icon: 'badge', type: 'group',
    children: ['Role & Permission', 'Staff'],
  },
  {
    id: 'packages', label: 'Packages', icon: 'inventory_2', type: 'group',
    children: ['Package', 'Addons', 'Features', 'Subscription', 'Transactions', 'Coupons & Discounts'],
  },
  {
    id: 'communication', label: 'Communication', icon: 'forum', type: 'group',
    children: ['Email Schools', 'SMS / WhatsApp'],
  },
  {
    id: 'analytics', label: 'Analytics', icon: 'analytics', type: 'group',
    children: ['Platform Analytics', 'Revenue Reports', 'Usage Reports'],
  },
  {
    id: 'support', label: 'Support', icon: 'support_agent', type: 'group',
    children: ['Ticket Inbox', 'Knowledge Base'],
  },
  {
    id: 'security', label: 'Security', icon: 'admin_panel_settings', type: 'group',
    children: ['Audit Logs', 'Login Activity', 'Impersonation Logs'],
  },
  {
    id: 'notifications', label: 'Notifications', icon: 'notifications_active', type: 'group',
    children: ['Templates', 'Push History'],
  },
  { id: 'contact', label: 'Contact Inquiry', icon: 'mail', type: 'link' },
  {
    id: 'settings', label: 'Settings', icon: 'settings', type: 'group',
    children: [
      'System Settings', 'Web Settings', 'Academy Setup',
      'Database Backup', 'System Update', 'Documentation', 'API Settings', 'White-label',
    ],
  },
];

function SidebarContent({ expanded, onToggle, activeItem, onItemClick, onSignOut }) {
  return (
    <>
      {/* Logo */}
      <div className="mb-4 px-3 flex items-center gap-3">
        <img src="/favicon.svg" alt="ERPZO Logo" className="w-8 h-8 rounded-lg shrink-0" style={{ boxShadow: '0 4px 14px rgba(0,107,92,0.25)' }} />
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[#006b5c] tracking-tight leading-none">ERPZO</h1>
          <span className="text-[10px] font-medium text-[#3c4a46] opacity-70">Superadmin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-px sa-scrollbar overflow-y-auto overflow-x-hidden">
        {SIDEBAR_ITEMS.map((item) => {
          if (item.type === 'link') {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                aria-label={item.label}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-[#006b5c] font-bold bg-[#006b5c]/10 border-l-[3px] border-[#006b5c]'
                  : 'text-[#3c4a46] font-medium hover:bg-[#e8e8ea] border-l-[3px] border-transparent'
                  }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
              </button>
            );
          }

          const isExpanded = expanded.includes(item.id);
          return (
            <div key={item.id} className={isExpanded ? 'sa-menu-expanded' : ''}>
              <button
                aria-expanded={isExpanded} onClick={() => onToggle(item.id)}
                className="w-full flex items-center justify-between py-[7px] px-3 rounded-lg text-[#3c4a46] font-medium hover:bg-[#e8e8ea] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                  <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
                </div>
                <span className="material-symbols-outlined sa-rotate-icon" style={{ fontSize: '15px' }}>chevron_right</span>
              </button>
              <div className="sa-submenu pl-9 pr-2 space-y-px">
                {item.children.map((child) => (
                  <button
                    key={child}
                    onClick={() => onItemClick(child)}
                    className={`block w-full text-left py-[5px] px-2.5 text-[12px] rounded-md transition-colors ${activeItem === child
                      ? 'text-[#006b5c] font-semibold bg-[#006b5c]/5'
                      : 'text-[#3c4a46] hover:text-[#006b5c]'
                      }`}
                  >
                    {child}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-2 space-y-1 border-t border-[#e2e2e5]">
        <div className="px-3 py-1">
          <span className="text-[9px] font-bold text-[#006b5c] uppercase tracking-widest bg-[#006b5c]/10 px-2 py-0.5 rounded flex items-center gap-1.5">
            <span className="relative w-1.5 h-1.5 rounded-full bg-[#006b5c] animate-pulse" />
            Platform Administration
          </span>
        </div>
        <button
          aria-label="Sign out" onClick={onSignOut}
          className="w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg text-[#ba1a1a] font-medium hover:bg-[#ffdad6]/40 transition-colors duration-200"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>logout</span>
          <span className="text-[12.5px] font-semibold">Sign Out</span>
        </button>
      </div>
    </>
  );
}

function Overview({title}){
  const [data,setData]=useState(null),[error,setError]=useState('');
  const load=useCallback(async()=>{try{setData((await axios.get('/api/platform/overview')).data);setError('');}catch(e){setError(errorText(e));}},[]);
  useEffect(()=>{load();},[load]);
  return <section className="workspace-section"><div className="workspace-heading"><div><h1>{title}</h1><p>Live school operations and recorded subscription revenue.</p></div><button onClick={load}>Refresh</button></div>{error && <p role="alert" className="workspace-error">{error}</p>}{!data ? <p role="status">Loading overview…</p> : <><div className="workspace-stats">{[['Schools',data.schools.length],['Active schools',data.activeSchools],['Students',data.students],['Teachers',data.teachers],['User accounts',data.users],['Active subscriptions',data.activeSubscriptions],['Open support tickets',data.openTickets]].map(([label,value])=><div key={label} className="workspace-card workspace-stat"><span>{label}</span><strong>{value.toLocaleString()}</strong></div>)}</div><div className="workspace-card"><h2>Recorded subscription revenue</h2>{data.revenue.length ? data.revenue.map(r=><p key={r.currency}>{new Intl.NumberFormat('en',{style:'currency',currency:r.currency}).format(r.amountMinor/100)} · {r.payments} payments</p>) : <p>No subscription payments recorded yet.</p>}</div><h2 className="mt-6 mb-4">School usage</h2><div className="workspace-table"><table><thead><tr><th>School</th><th>Status</th><th>Students</th><th>Teachers</th><th>Users</th><th>Documents</th></tr></thead><tbody>{data.schools.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.isActive?'Active':'Suspended'}</td><td>{s._count.students}</td><td>{s._count.teachers}</td><td>{s._count.users}</td><td>{s._count.documents}</td></tr>)}</tbody></table></div><p>Updated {new Date(data.generatedAt).toLocaleString()}</p></>}</section>;
}
function Operations({page}){
  const [runtime,setRuntime]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{axios.get('/api/platform/runtime').then(r=>setRuntime(r.data)).catch(e=>setError(errorText(e)));},[]);
  async function exportConfig(){setBusy(true);try{const response=await axios.get('/api/platform/export',{responseType:'blob'});downloadBlob(response.data,'erpzo-platform-configuration.json');}catch(e){setError(errorText(e));}finally{setBusy(false);}}
  return <section className="workspace-section"><h1>{page}</h1>{error && <p role="alert" className="workspace-error">{error}</p>}
    {page==='Role & Permission' ? <div className="workspace-card mt-6"><h2>Enforced account roles</h2><p>Platform administrators manage tenants, billing records, platform configuration and support. School administrators manage their own school's records and accounts. Teachers manage teaching workflows. Students see their own profile, fees and results.</p><p>Roles are enforced by the API. Parent and staff accounts do not yet have dedicated web portals; manage their records through the school administration portal.</p></div>
    : page==='Database Backup' ? <div className="workspace-card mt-6"><h2>Configuration export</h2><p>Download plans, platform settings and editorial records. This export excludes credentials and school records and is not a full database backup.</p><button disabled={busy} onClick={exportConfig}>{busy?'Exporting…':'Export configuration'}</button><h2 className="mt-6">Full backup</h2><p>Run the documented database backup command on the server. Store the database and upload backups securely outside the host. Restore into a separate environment and verify before replacing live data.</p></div>
    : page==='Impersonation Logs' ? <div className="workspace-card mt-6"><p>Account impersonation is disabled. Use school account management for password resets and audit logs for administrative activity.</p></div>
    : page==='Push History' ? <ResourcePage endpoint="/api/platform/push-history" />
    : page==='Documentation' ? <div className="workspace-card mt-6"><h2>ERPZO operations</h2><p>1. Onboard a school and its administrator from Manage Schools.</p><p>2. Create packages and assign subscriptions. Record offline payments with unique references.</p><p>3. School administrators create classes, teachers, subjects and students, then manage attendance, exams and fees.</p><p>4. Resolve school support tickets and review audit logs.</p><p>Deployment, backups, environment variables and release checks are documented in the repository README and deployment guide.</p></div>
    : <div className="workspace-card mt-6"><h2>Service health</h2>{runtime ? <dl>{Object.entries(runtime).map(([key,value])=><div key={key} className="flex justify-between gap-4 border-b py-3"><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl> : <p role="status">Checking services…</p>}<p>Secrets are configured in the server environment and are never returned by this screen.</p></div>}
  </section>;
}
export default function SuperadminPage(){
 const {logout}=useAuth();const [params,setParams]=useSearchParams();
 const page=params.get('view')||'Dashboard';const activeItem=page==='Dashboard'?'dashboard':page==='Contact Inquiry'?'contact':page;
 const [expanded,setExpanded]=useState(()=>SIDEBAR_ITEMS.filter(x=>x.children?.includes(page)).map(x=>x.id));
 const [dark,setDark]=useState(()=>localStorage.getItem('erpzo.theme')==='dark');const [mobileOpen,setMobileOpen]=useState(false),[search,setSearch]=useState('');
 const setActiveItem=(item)=>{const next=item==='dashboard'?'Dashboard':item==='contact'?'Contact Inquiry':item;setParams({view:next});setMobileOpen(false);setSearch('');setExpanded(v=>[...new Set([...v,...SIDEBAR_ITEMS.filter(x=>x.children?.includes(next)).map(x=>x.id)])]);};
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('erpzo.theme',dark?'dark':'light');return()=>document.documentElement.classList.remove('dark');},[dark]);
 const toggleSubmenu=id=>setExpanded(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const sidebarProps={expanded,onToggle:toggleSubmenu,activeItem,onItemClick:setActiveItem,onSignOut:logout};
 let content;
 if(records[page]) content=<ResourcePage key={page} endpoint={`/api/platform/records/${records[page]}`} />;
 else if(resources[page]) content=<ResourcePage key={page} endpoint={`/api/platform/${resources[page]}`} noDelete={['Subscription','Ticket Inbox'].includes(page)} />;
 else if(settings[page]) content=<SettingsPage key={page} endpoint={`/api/platform/settings/${settings[page]}`} />;
 else if(page==='Manage Schools') content=<SchoolsWorkspace />;
 else if(['Platform Analytics','Revenue Reports','Usage Reports'].includes(page)) content=<Overview title={page} />;
 else if(page==='System Update') content=<SystemUpdateView dark={dark} />;
 else if(page!=='Dashboard') content=<Operations key={page} page={page} />;
  return (
    <div className={`classic-admin flex h-screen overflow-hidden font-['Inter'] ${dark ? 'bg-[#1a1c1e] text-[#f0f0f3]' : 'bg-[#f9f9fc] text-[#1a1c1e]'}`}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col h-screen py-3 px-2 border-r shrink-0 overflow-y-auto sa-scrollbar w-56 lg:w-60 ${dark ? 'border-[#3c4a46]/60 bg-gradient-to-b from-[#2f3133] to-[#262829]' : 'border-[#e2e2e5]/60 bg-gradient-to-b from-[#f7f7fa] to-[#eeeeef]'
          }`}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <button aria-label="Close navigation" className="sa-mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className={`sa-mobile-drawer flex flex-col py-2 px-3 ${dark ? 'bg-[#2f3133]' : ''}`}>
            <SidebarContent {...sidebarProps} />
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-y-auto sa-scrollbar">
        {/* Top Navigation */}
        <header className={`flex justify-between items-center h-16 px-6 sticky top-0 z-50 w-full border-b backdrop-blur-[24px] ${dark ? 'border-[#3c4a46]/60 bg-[#1a1c1e]/90' : 'border-[#e2e2e5]/60 bg-[#f9f9fc]/90'
          }`}>
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-[#e8e8ea] dark:hover:bg-[#3c4a46]"
              aria-label="Toggle navigation" onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
            </button>

            {/* Mobile logo */}
            <img src="/favicon.svg" alt="ERPZO" className="md:hidden w-7 h-7 rounded shrink-0" />

            {/* Search */}
            <div className="relative hidden sm:block ml-2">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896] pointer-events-none" style={{ fontSize: '18px' }}>search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`sa-input pl-10 pr-4 h-10 rounded-xl border outline-none text-[13px] w-64 md:w-80 lg:w-96 transition-all focus:ring-2 focus:ring-[#006b5c]/20 ${dark ? 'bg-[#2f3133] border-[#6c7a76] text-[#f0f0f3] placeholder-[#8b9896]' : 'bg-[#f3f3f6] border-[#e2e2e5] text-[#1a1c1e] placeholder-[#8b9896]'
                  }`}
                style={{ boxShadow: 'none' }}
                aria-label="Find a page" placeholder="Find a page…"
              />{search&&<div className="absolute top-full left-0 mt-2 w-full max-h-80 overflow-auto rounded-xl border bg-white dark:bg-[#2f3133] shadow-lg z-50">{SIDEBAR_ITEMS.flatMap(i=>i.children||[i.label]).filter(i=>i.toLowerCase().includes(search.toLowerCase())).map(i=><button className="block w-full p-3 text-left text-xs hover:bg-[#006b5c]/10" key={i} onClick={()=>setActiveItem(i)}>{i}</button>)}</div>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick links */}
            <div className={`hidden md:flex items-center gap-2 mr-2 border-r pr-4 ${dark ? 'border-[#6c7a76]' : 'border-[#e2e2e5]'}`}>
              <button onClick={() => setActiveItem('API Settings')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                dark ? 'text-[#f0f0f3] hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:bg-[#eeeef0]'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c49a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c49a]"></span>
                </span>
                Platform Status
              </button>
              <button onClick={() => setActiveItem('Audit Logs')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                dark ? 'text-[#f0f0f3] hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:bg-[#eeeef0]'
              }`}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>manage_search</span>
                Audit Logs
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-[#eeeef0] text-[#3c4a46]'}`}
              title="Toggle dark mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {/* Notifications */}
            <button aria-label="Support tickets" onClick={() => setActiveItem('Ticket Inbox')} className={`p-1.5 rounded-full relative transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-[#eeeef0] text-[#3c4a46]'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
              
            </button>

            {/* Apps */}
            <button aria-label="Manage schools" onClick={() => setActiveItem('Manage Schools')} className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-[#eeeef0] text-[#3c4a46]'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>apps</span>
            </button>

            {/* Avatar */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-offset-1 ${dark ? 'ring-[#006b5c]/50 ring-offset-[#1a1c1e] bg-[#3c4a46]' : 'ring-[#006b5c]/30 ring-offset-white bg-gradient-to-br from-[#006b5c] to-[#00897b]'}`}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>person</span>
            </div>
          </div>
        </header>

{page==='Dashboard'&&<PlatformDashboard onNavigate={setActiveItem}/>}
{content}</main></div>);
}
