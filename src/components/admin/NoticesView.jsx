import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function NoticesView({ dark }) {
  const [filter, setFilter] = useState('All');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ title: '', type: 'General', audience: 'All', priority: 'Medium', content: '' });
  
  const editorRef = useRef(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/school/notices');
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error('Failed to fetch notices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filtered = filter === 'All' ? notices : notices.filter(n => n.type === filter);

  const handleDelete = async (noticeId) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://school-backend-70ny.onrender.com/api/school/notices/${noticeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Notice deleted', type: 'success' });
      fetchNotices();
    } catch (err) {
      setToast({ message: 'Failed to delete notice', type: 'error' });
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    const finalContent = editorRef.current ? editorRef.current.innerHTML : form.content;
    if (!finalContent || finalContent.trim() === '') {
      return setToast({ message: 'Content is required', type: 'error' });
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://school-backend-70ny.onrender.com/api/school/notices', { ...form, content: finalContent, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Notice posted', type: 'success' });
      setModalOpen(false);
      fetchNotices();
    } catch (err) {
      setToast({ message: 'Failed to post notice', type: 'error' });
    }
  };

  const execCmd = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    editorRef.current.focus();
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Notices & Events</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Post announcements and manage school events.</p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="admin-select h-10 px-3">
            <option>All</option>
            <option>Event</option>
            <option>Academic</option>
            <option>General</option>
          </select>
          <button onClick={() => {
            setForm({ title: '', type: 'General', audience: 'All', priority: 'Medium', content: '' });
            setModalOpen(true);
          }} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Post Notice
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-outline">Loading notices...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-outline">No notices found.</div>
        ) : (
          filtered.map((n, i) => (
            <div key={n.id} className={`admin-card admin-row-enter p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-[14px] font-bold">{n.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.type === 'Event' ? 'bg-primary/10 text-primary' : n.type === 'Academic' ? 'bg-secondary/10 text-secondary' : 'bg-outline/10 text-outline'}`}>{n.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.priority === 'High' ? 'bg-error/10 text-error' : n.priority === 'Medium' ? 'bg-tertiary/10 text-tertiary' : 'bg-outline/10 text-outline'}`}>{n.priority}</span>
                  </div>
                  <div className={`text-[12px] mt-2 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`} dangerouslySetInnerHTML={{ __html: n.content }} />
                  <div className="flex gap-3 mt-3">
                    <span className={`text-[10px] flex items-center gap-1 ${dark ? 'text-[#6c7a76]' : 'text-outline'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>event</span>{n.date}
                    </span>
                    <span className={`text-[10px] flex items-center gap-1 ${dark ? 'text-[#6c7a76]' : 'text-outline'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>group</span>{n.audience}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleDelete(n.id)} className="text-error text-[11px] font-semibold hover:underline px-2 py-1 rounded hover:bg-error/10 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <Modal title="Post New Notice" onClose={() => setModalOpen(false)}>
          <form onSubmit={handlePostNotice} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Title</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="admin-input w-full" placeholder="e.g. Annual Sports Day" />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Type</label>
                <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="admin-select w-full">
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Event">Event</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Priority</label>
                <select required value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="admin-select w-full">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Audience</label>
                <select required value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="admin-select w-full">
                  <option value="All">All</option>
                  <option value="Students">Students</option>
                  <option value="Teachers">Teachers</option>
                  <option value="Parents">Parents</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Content</label>
              <div className={`border rounded-xl overflow-hidden flex flex-col ${dark ? 'border-[#4a5854]' : 'border-outline-variant/50'}`}>
                {/* Toolbar */}
                <div className={`flex items-center gap-1 p-2 border-b ${dark ? 'bg-[#2f3133] border-[#4a5854]' : 'bg-surface-container-low border-outline-variant/50'}`}>
                  <button type="button" onClick={() => execCmd('bold')} className={`p-1.5 rounded-lg hover:bg-black/5 ${dark ? 'hover:bg-white/10' : ''}`} title="Bold"><span className="material-symbols-outlined text-[16px]">format_bold</span></button>
                  <button type="button" onClick={() => execCmd('italic')} className={`p-1.5 rounded-lg hover:bg-black/5 ${dark ? 'hover:bg-white/10' : ''}`} title="Italic"><span className="material-symbols-outlined text-[16px]">format_italic</span></button>
                  <button type="button" onClick={() => execCmd('underline')} className={`p-1.5 rounded-lg hover:bg-black/5 ${dark ? 'hover:bg-white/10' : ''}`} title="Underline"><span className="material-symbols-outlined text-[16px]">format_underlined</span></button>
                  <div className={`w-px h-4 mx-1 ${dark ? 'bg-[#4a5854]' : 'bg-outline-variant'}`} />
                  <button type="button" onClick={() => execCmd('insertUnorderedList')} className={`p-1.5 rounded-lg hover:bg-black/5 ${dark ? 'hover:bg-white/10' : ''}`} title="Bullet List"><span className="material-symbols-outlined text-[16px]">format_list_bulleted</span></button>
                  <button type="button" onClick={() => execCmd('insertOrderedList')} className={`p-1.5 rounded-lg hover:bg-black/5 ${dark ? 'hover:bg-white/10' : ''}`} title="Numbered List"><span className="material-symbols-outlined text-[16px]">format_list_numbered</span></button>
                </div>
                {/* Editor Area */}
                <div 
                  ref={editorRef}
                  contentEditable
                  className={`p-3 min-h-[120px] max-h-[250px] overflow-y-auto outline-none text-[13px] ${dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-white text-on-surface'}`}
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Post Notice</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
