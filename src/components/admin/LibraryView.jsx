import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function LibraryView({ dark }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: null, bookId: '', title: '', author: '', category: '' });

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ bookId: '', issuedTo: '', dueDate: '' });

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/library`, { withCredentials: true });
      setBooks(res.data);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to fetch books', type: 'error' });
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const openAddModal = () => {
    setForm({ id: null, bookId: `B00${books.length + 1}`, title: '', author: '', category: '' });
    setModalOpen(true);
  };

  const openIssueModal = (book) => {
    setIssueForm({ bookId: book.id, issuedTo: '', dueDate: '' });
    setIssueModalOpen(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/library`, form, { withCredentials: true });
      setToast({ message: 'Book added successfully', type: 'success' });
      setModalOpen(false);
      fetchBooks();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to add book', type: 'error' });
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/library/${issueForm.bookId}`, {
        status: 'Issued',
        issuedTo: issueForm.issuedTo,
        dueDate: issueForm.dueDate
      }, { withCredentials: true });
      setToast({ message: 'Book issued successfully', type: 'success' });
      setIssueModalOpen(false);
      fetchBooks();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to issue book', type: 'error' });
    }
  };

  const handleReturnBook = async (id) => {
    if (!confirm('Mark this book as returned?')) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/library/${id}`, {
        status: 'Available',
        issuedTo: null,
        dueDate: null
      }, { withCredentials: true });
      setToast({ message: 'Book returned', type: 'success' });
      fetchBooks();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to return book', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/library/${id}`, { withCredentials: true });
      setToast({ message: 'Book deleted', type: 'success' });
      fetchBooks();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to delete book', type: 'error' });
    }
  };

  const q = search.toLowerCase();
  const filtered = books.filter(b => 
    b.title?.toLowerCase().includes(q) || b.bookId?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)
  );

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Library Management</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage library inventory, issue, and return books.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="admin-input pl-10 h-10 rounded-xl" placeholder="Search books..." />
          </div>
          <button onClick={openAddModal} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>library_add</span>
            Add Book
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/50'}`}>
              <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>
                <th className="py-3 px-4 w-24">Book ID</th>
                <th className="py-3 px-4">Title & Author</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-outline">No books found.</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b.id} className={`admin-row-enter border-b ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="py-3 px-4 font-mono font-semibold">{b.bookId}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold">{b.title}</div>
                    <div className={`text-[10px] ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{b.author}</div>
                  </td>
                  <td className="py-3 px-4">{b.category}</td>
                  <td className="py-3 px-4">
                    {b.status === 'Available' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">Available</span>
                    ) : (
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">Issued</span>
                        <div className={`text-[10px] mt-1 ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>To: {b.issuedTo}</div>
                        <div className={`text-[10px] font-mono ${dark ? 'text-error' : 'text-error'}`}>Due: {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : ''}</div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b.status === 'Available' ? (
                      <button onClick={() => openIssueModal(b)} className="text-secondary text-[11px] font-semibold hover:underline mr-3 border px-2 py-1 rounded-md border-secondary/20">Issue</button>
                    ) : (
                      <button onClick={() => handleReturnBook(b.id)} className="text-primary text-[11px] font-semibold hover:underline mr-3 border px-2 py-1 rounded-md border-primary/20">Return</button>
                    )}
                    <button onClick={() => handleDelete(b.id)} className="text-error text-[11px] font-semibold hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal title="Add New Book" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSaveBook} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Book ID</label>
                <input required type="text" value={form.bookId} onChange={e => setForm({...form, bookId: e.target.value.toUpperCase()})} className="admin-input w-full uppercase" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Category</label>
                <input required type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-input w-full" placeholder="e.g. Science" />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Book Title</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="admin-input w-full" />
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Author</label>
              <input required type="text" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="admin-input w-full" />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Add Book</button>
            </div>
          </form>
        </Modal>
      )}

      {issueModalOpen && (
        <Modal title="Issue Book" onClose={() => setIssueModalOpen(false)}>
          <form onSubmit={handleIssueBook} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Issue To (Student ID / Name)</label>
              <input required type="text" value={issueForm.issuedTo} onChange={e => setIssueForm({...issueForm, issuedTo: e.target.value})} className="admin-input w-full" placeholder="e.g. S1025" />
            </div>
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Due Date</label>
              <input required type="date" value={issueForm.dueDate} onChange={e => setIssueForm({...issueForm, dueDate: e.target.value})} className="admin-input w-full" />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIssueModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Issue Book</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
