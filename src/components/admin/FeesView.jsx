import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function FeesView({ dark }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ summary: [], records: [] });
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [modalType, setModalType] = useState(null); // 'addFee' | 'recordPayment'
  const [classes, setClasses] = useState([]);
  const [feesList, setFeesList] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [feeForm, setFeeForm] = useState({ name: '', amount: '', dueDate: '', classId: '' });
  const [paymentForm, setPaymentForm] = useState({ studentId: '', feeId: '', amount: '', status: 'Paid' });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/fees/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch fees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const openAddFeeModal = async () => {
    setModalType('addFee');
    setFeeForm({ name: '', amount: '', dueDate: '', classId: '' });
    try {
      const res = await axios.get('http://localhost:3000/api/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const openRecordPaymentModal = async () => {
    setModalType('recordPayment');
    setPaymentForm({ studentId: '', feeId: '', amount: '', status: 'Paid' });
    try {
      const [resFees, resStudents] = await Promise.all([
        axios.get('http://localhost:3000/api/fees'),
        axios.get('http://localhost:3000/api/students')
      ]);
      setFeesList(resFees.data.fees);
      setStudents(resStudents.data.students);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/fees', feeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Fee structure added', type: 'success' });
      setModalType(null);
      fetchSummary();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to add fee', type: 'error' });
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/fees/payments', paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Payment recorded', type: 'success' });
      setModalType(null);
      fetchSummary();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to record payment', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = data.records.filter(r => {
    const matchSearch = r.student.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchFilter = filter === 'All' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px]">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Fee Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Track payments, pending dues, and generate invoices.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddFeeModal} className={`admin-btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold shadow-sm ${dark ? 'bg-[#2f3133] border border-[#4a5854] text-[#f0f0f3]' : 'bg-white border border-outline-variant text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_box</span>
            Add Fee Structure
          </button>
          <button onClick={openRecordPaymentModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
            Record Payment
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      {!loading && data.summary && data.summary.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 admin-section-animate" style={{ animationDelay: '0.05s' }}>
          {data.summary.map((s, i) => (
            <div key={s.label} className={`admin-card p-3.5 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-surface-container-high'}`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.08em] font-semibold ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{s.label}</p>
                  <h3 className="text-lg font-bold mt-1">{s.value}</h3>
                </div>
                <div className="p-2 rounded-xl" style={{ background: `${s.color}12`, color: s.color }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search by student or invoice..." />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="admin-select h-10">
          <option>All</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
      </div>

      {/* Table */}
      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-outline">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-outline">No records found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-mono text-[11px]">{r.id}</td>
                  <td className="py-3 px-4 font-semibold">{r.student}</td>
                  <td className="py-3 px-4">{r.class}</td>
                  <td className="py-3 px-4 font-bold">{r.amount}</td>
                  <td className="py-3 px-4">{formatDate(r.dueDate)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Paid' ? 'bg-primary/10 text-primary' : r.status === 'Pending' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>{r.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-primary text-[11px] font-semibold hover:underline">Receipt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      {modalType === 'addFee' && (
        <Modal title="Add Fee Structure" onClose={() => setModalType(null)}>
          <form onSubmit={handleAddFee} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Fee Name</label>
              <input required type="text" value={feeForm.name} onChange={e => setFeeForm({...feeForm, name: e.target.value})} className="admin-input w-full" placeholder="e.g. Tuition Fee - Term 1" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Amount ($)</label>
                <input required type="number" step="0.01" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: e.target.value})} className="admin-input w-full" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Due Date</label>
                <input required type="date" value={feeForm.dueDate} onChange={e => setFeeForm({...feeForm, dueDate: e.target.value})} className="admin-input w-full" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Target Class</label>
              <select required value={feeForm.classId} onChange={e => setFeeForm({...feeForm, classId: e.target.value})} className="admin-select w-full">
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalType(null)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Add Fee</button>
            </div>
          </form>
        </Modal>
      )}

      {modalType === 'recordPayment' && (
        <Modal title="Record Payment" onClose={() => setModalType(null)}>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Student</label>
              <select required value={paymentForm.studentId} onChange={e => setPaymentForm({...paymentForm, studentId: e.target.value})} className="admin-select w-full">
                <option value="">-- Select Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Fee Structure</label>
              <select required value={paymentForm.feeId} onChange={e => {
                const fee = feesList.find(f => f.id === e.target.value);
                setPaymentForm({...paymentForm, feeId: e.target.value, amount: fee ? fee.amount : ''});
              }} className="admin-select w-full">
                <option value="">-- Select Fee --</option>
                {feesList.map(f => <option key={f.id} value={f.id}>{f.name} - ${f.amount}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Amount Paid ($)</label>
                <input required type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="admin-input w-full" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Status</label>
                <select required value={paymentForm.status} onChange={e => setPaymentForm({...paymentForm, status: e.target.value})} className="admin-select w-full">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalType(null)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Record Payment</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
