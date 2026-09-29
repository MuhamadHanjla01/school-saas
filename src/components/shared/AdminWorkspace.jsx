import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

export const errorText = error => error.response?.data?.error || error.response?.data?.message || 'Unable to complete the request. Please retry.';
export function downloadBlob(data, name) {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Field({ field, value, onChange, choices }) {
  const id = `field-${field.name}`;
  const shared = { id, name: field.name, required: field.required, className: 'workspace-input', value: value ?? '', onChange: e => onChange(e.target.value), maxLength: field.maxLength || (field.type === 'textarea' ? 20000 : 300) };
  const options = choices || field.options?.map(value => ({ value, label: value }));
  return <label className="workspace-field" htmlFor={id}><span>{field.label}{field.required ? ' *' : ''}</span>
    {field.type === 'checkbox' ? <input id={id} type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />
      : field.type === 'textarea' ? <textarea {...shared} rows={4} />
      : field.type === 'select' ? <select {...shared}><option value="">Select…</option>{options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      : field.type === 'money' ? <input {...shared} type="number" min={(field.min || 0) / 100} step="0.01" value={value === '' ? '' : Number(value || 0) / 100} onChange={e => onChange(e.target.value === '' ? '' : Math.round(Number(e.target.value) * 100))} />
      : <input {...shared} type={field.type || 'text'} value={field.type === 'date' ? String(value || '').slice(0, 10) : value ?? ''} min={field.min ?? (field.type === 'number' ? 0 : undefined)} max={field.max} step={field.type === 'number' ? 1 : undefined} autoComplete={field.type === 'password' ? 'new-password' : undefined} />}
  </label>;
}
export function FormDialog({ title, fields, initial, choices = {}, onSave, onClose }) {
  const [values, setValues] = useState(() => ({ ...Object.fromEntries(fields.map(f => [f.name, f.default ?? (f.type === 'checkbox' ? false : '')])), ...initial }));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await onSave(values); onClose(); } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="workspace-dialog" onCancel={e => { if (busy) e.preventDefault(); else onClose(); }}>
    <form onSubmit={submit}><div className="workspace-heading"><h2>{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button></div>
      {error && <p role="alert" className="workspace-error">{error}</p>}
      <div className="workspace-fields">{fields.map(f => <Field key={f.name} field={f} choices={choices[f.name]} value={values[f.name]} onChange={value => setValues(v => ({ ...v, [f.name]: value }))} />)}</div>
      <div className="workspace-actions"><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="workspace-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
    </form>
  </dialog>;
}
export function ResourcePage({ endpoint, noDelete = false }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1), [search, setSearch] = useState(''), [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const load = useCallback(async (signal) => {
    setBusy(true); setError('');
    try { const result = await axios.get(endpoint, { params: { page, search: query }, signal }); setData(result.data); }
    catch (e) { if (!axios.isCancel(e)) setError(errorText(e)); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [endpoint, page, query]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  async function save(values) { if (editing.id) await axios.put(`${endpoint}/${editing.id}`, values); else await axios.post(endpoint, values); await load(); }
  async function remove(row) {
    if (!window.confirm('Delete this record?')) return;
    setBusy(true);
    try { await axios.delete(`${endpoint}/${row.id}`); await load(); } catch (e) { setError(errorText(e)); setBusy(false); }
  }
  const columns = [...(data?.fields.filter(f => f.type !== 'password').slice(0, 7) || []), ...(data?.extraColumns || [])];
  const display = (row, field) => field.type === 'money' ? new Intl.NumberFormat('en-NP', { style: 'currency', currency: row.currency || 'NPR' }).format(Number(row[field.name] || 0) / 100) : field.type === 'date' ? String(row[field.name] || '').slice(0, 10) : data?.choices?.[field.name]?.find(o => o.value === row[field.name])?.label ?? (typeof row[field.name] === 'boolean' ? (row[field.name] ? 'Yes' : 'No') : String(row[field.name] ?? '—'));
  function exportCsv() {
    const quote = value => '"' + (/^[=+@\-\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""') + '"';
    const lines = [columns.map(f => quote(f.label)).join(','), ...data.rows.map(row => columns.map(f => quote(display(row, f))).join(','))];
    downloadBlob(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv' }), 'records-current-page.csv');
  }
  return <section className="workspace-section">
    <div className="workspace-heading"><div><h1>{data?.title || 'Records'}</h1><p>{data?.description || 'Manage your saved records.'}</p></div>{data && !data.readOnly && <button className="workspace-primary" disabled={busy} onClick={() => setEditing({})}>Add record</button>}</div>
    <form className="workspace-toolbar" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search); }}><input aria-label="Search records" placeholder="Search records…" className="workspace-input" value={search} onChange={e => setSearch(e.target.value)} /><button>Search</button><button type="button" disabled={busy} onClick={() => load()}>Refresh</button><button type="button" disabled={!data?.rows.length} onClick={exportCsv}>Export page</button></form>
    {error && <p role="alert" className="workspace-error">{error}</p>}{busy && <p role="status">Loading records…</p>}
    <div className="workspace-table"><table><thead><tr>{columns.map(f => <th key={f.name}>{f.label}</th>)}{!data?.readOnly && !data?.immutable && <th>Actions</th>}</tr></thead><tbody>{data?.rows.map(row => <tr key={row.id}>{columns.map(f => <td key={f.name} title={display(row, f)}>{display(row, f).slice(0, 160)}</td>)}{!data.readOnly && !data.immutable && <td><div className="workspace-actions"><button disabled={busy} onClick={() => setEditing(row)}>Edit</button>{!noDelete && !data.noDelete && <button disabled={busy} onClick={() => remove(row)}>Delete</button>}</div></td>}</tr>)}</tbody></table>
      {!busy && data?.rows.length === 0 && <p className="workspace-empty">No records yet. New records will appear here.</p>}</div>
    <div className="workspace-toolbar"><span>{data?.total || 0} records · Page {page} of {Math.max(1, data?.totalPages || 0)}</span><button disabled={page <= 1 || busy} onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={page >= (data?.totalPages || 1) || busy} onClick={() => setPage(p => p + 1)}>Next</button></div>
    {editing && <FormDialog title={editing.id ? 'Edit record' : 'Add record'} fields={data.fields} choices={data.choices} initial={editing} onSave={save} onClose={() => setEditing(null)} />}
  </section>;
}
export function SettingsPage({ endpoint, onSaved }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setData((await axios.get(endpoint)).data); setError(''); } catch (e) { setError(errorText(e)); } }, [endpoint]);
  useEffect(() => { load(); }, [load]);
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); setMessage(''); try { await axios.put(endpoint, data.values); await onSaved?.(); setMessage('Changes saved.'); } catch (err) { setError(errorText(err)); } finally { setBusy(false); } }
  return <section className="workspace-section"><h1>{data?.title || 'Settings'}</h1><p>{data?.description}</p>{error && <p role="alert" className="workspace-error">{error} <button onClick={load}>Retry</button></p>}{message && <p role="status">{message}</p>}{data ? <form onSubmit={submit} className="workspace-card"><div className="workspace-fields">{data.fields.map(f => <Field key={f.name} field={f} value={data.values[f.name]} onChange={value => setData(d => ({ ...d, values: { ...d.values, [f.name]: value } }))} />)}</div><button className="workspace-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></form> : !error && <p role="status">Loading settings…</p>}</section>;
}
