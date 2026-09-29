import './ReferenceDashboard.css';
export function DashboardIcon({name}){return <span aria-hidden="true" className="material-symbols-outlined">{name}</span>;}
export function DashboardPanel({title,action,children}){return <section className="reference-panel"><div className="reference-panel-heading"><h2>{title}</h2>{action}</div>{children}</section>;}
export default function ReferenceDashboard({title,subtitle,badge,badgeDetail,metrics,ringTitle,ringValue,ringCaption,ringAction,financeTitle,financeControl,financeCards,actions,children,onChat}){
 return <div className="reference-dashboard">
  <section className="reference-banner"><div><h1>{title}</h1><p><DashboardIcon name="check_circle"/>{subtitle}</p></div><div className="reference-subscription"><DashboardIcon name="verified"/><div><strong>{badge}</strong><span>{badgeDetail}</span></div></div></section>
  <div className="reference-metrics">{metrics.map(m=><article className="reference-panel reference-metric" key={m.label}><div className="reference-metric-top"><span className={`reference-icon ${m.tone||''}`}><DashboardIcon name={m.icon}/></span>{m.badge&&<small>{m.badge}</small>}</div><h2>{m.label}</h2><strong>{m.value}</strong><p>{m.caption}</p></article>)}</div>
  <div className="reference-operations"><DashboardPanel title={ringTitle}><div className="reference-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50"/><circle className="reference-ring-value" cx="60" cy="60" r="50" pathLength="100" strokeDasharray={`${ringValue} 100`}/></svg><strong>{ringValue}%</strong></div><p className="reference-ring-caption">{ringCaption}</p>{ringAction}</DashboardPanel><DashboardPanel title={financeTitle} action={financeControl}><div className="reference-finance">{financeCards.map(c=><article className={`reference-finance-card ${c.tone||''}`} key={c.label}><h3><DashboardIcon name={c.icon}/>{c.label}</h3><strong>{c.value}</strong><div className="reference-progress"><span style={{width:`${c.percent}%`}}/></div><p>{c.caption}</p></article>)}</div></DashboardPanel></div>
  <section><h2 className="reference-section-title">Quick Actions</h2><div className="reference-actions">{actions.map(a=><button key={a.label} onClick={a.onClick}><span className="reference-icon"><DashboardIcon name={a.icon}/></span><strong>{a.label}</strong></button>)}</div></section>
  <div className="reference-lower">{children}</div>
  <button className="reference-chat" aria-label="Open support" onClick={onChat}><DashboardIcon name="chat_bubble"/></button>
 </div>;
}
