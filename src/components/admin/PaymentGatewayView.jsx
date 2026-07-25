import { useState } from 'react';
import { Toast } from './AdminUI';

const INITIAL_TRANSACTIONS = [
  { id: 'TXN-00912', student: 'S1029 (Aarav Sharma)', amount: 1200, date: '2024-05-18 10:23 AM', status: 'Success', method: 'Credit Card' },
  { id: 'TXN-00913', student: 'S1102 (Emma Watson)', amount: 850, date: '2024-05-18 11:45 AM', status: 'Failed', method: 'Bank Transfer' },
  { id: 'TXN-00914', student: 'S1055 (Michael Chang)', amount: 1200, date: '2024-05-19 09:12 AM', status: 'Success', method: 'PayPal' },
];

export default function PaymentGatewayView({ dark }) {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const handleRefund = (id) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'Refunded' } : t));
    setToast({ message: 'Refund initiated', type: 'success' });
  };

  const filtered = transactions.filter(t => t.id.toLowerCase().includes(search.toLowerCase()) || t.student.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Payment Gateway Logs</h2>
          <p className={`text-xs mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>View online transaction statuses and initiate refunds.</p>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} className="admin-input h-10 px-4 rounded-xl" />
        </div>
      </div>
      <div className={`admin-card rounded-xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <table className="w-full text-left">
          <thead className="border-b text-xs uppercase opacity-70">
            <tr><th className="p-4">Txn ID</th><th className="p-4">Student</th><th className="p-4">Amount</th><th className="p-4">Method</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-outline-variant/20 hover:bg-black/5 dark:hover:bg-white/5">
                <td className="p-4 font-mono font-bold">{t.id}</td><td className="p-4">{t.student}</td><td className="p-4 font-mono font-semibold">${t.amount}</td><td className="p-4 text-xs">{t.method}</td><td className="p-4 font-mono text-[10px]">{t.date}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${t.status === 'Success' ? 'bg-primary/20 text-primary' : t.status === 'Failed' ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'}`}>{t.status}</span></td>
                <td className="p-4 text-right flex gap-2 justify-end">
                  {t.status === 'Success' && <button onClick={() => handleRefund(t.id)} className="text-secondary font-bold text-xs border border-secondary/30 px-2 py-1 rounded hover:bg-secondary/10">Refund</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}
