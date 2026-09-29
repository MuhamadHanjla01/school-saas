import { useEffect, useState } from 'react';
import axios from 'axios';
import { FormDialog, errorText } from '../shared/AdminWorkspace';
export default function SupportView(){
 const [tickets,setTickets]=useState([]),[error,setError]=useState(''),[open,setOpen]=useState(false);
 async function load(){try{setTickets((await axios.get('/api/school-admin/support')).data.tickets);setError('');}catch(e){setError(errorText(e));}}
 useEffect(()=>{load();},[]);
 return <section className="workspace-section"><div className="workspace-heading"><div><h1>Platform Support</h1><p>Track requests and responses from your platform administrator.</p></div><button className="workspace-primary" onClick={()=>setOpen(true)}>New support ticket</button></div>{error&&<p role="alert" className="workspace-error">{error}</p>}{tickets.map(t=><article className="workspace-card mb-4" key={t.id}><div className="workspace-heading"><h2>{t.subject}</h2><span>{t.status} · {t.priority}</span></div><p>{t.description}</p>{t.response&&<p><strong>Platform response:</strong> {t.response}</p>}<small>{new Date(t.updatedAt).toLocaleString()}</small></article>)}{!tickets.length&&!error&&<p>No support tickets yet.</p>}{open&&<FormDialog title="New support ticket" fields={[{name:'subject',label:'Subject',required:true},{name:'description',label:'Description',type:'textarea',required:true},{name:'priority',label:'Priority',type:'select',options:['Normal','High','Urgent'],default:'Normal'}]} onSave={async values=>{await axios.post('/api/school-admin/support',values);await load();}} onClose={()=>setOpen(false)}/>}</section>;
}
