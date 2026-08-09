import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toast } from './AdminUI';

export default function CommunicationView({ dark }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [content, setContent] = useState('');
  const [toast, setToast] = useState(null);
  
  const messagesEndRef = useRef(null);

  const fetchMessages = async (userId = '') => {
    try {
      setLoading(true);
      const url = userId ? `https://erpzo-backend.onrender.com/api/school/messages?withUser=${userId}` : 'https://erpzo-backend.onrender.com/api/school/messages';
      const res = await axios.get(url);
      setMessages(res.data.messages.reverse() || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [resT, resS] = await Promise.all([
        axios.get('https://erpzo-backend.onrender.com/api/teachers'),
        axios.get('https://erpzo-backend.onrender.com/api/students')
      ]);
      const formatted = [
        ...(resT.data.teachers || []).map(t => ({ id: t.userId, name: t.name, role: 'Teacher' })),
        ...(resS.data.students || []).map(s => ({ id: s.userId, name: s.name, role: 'Student' }))
      ].filter(u => u.id); // ensure they have userIds
      setUsers(formatted);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, []);

  useEffect(() => {
    fetchMessages(selectedUserId);
  }, [selectedUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !content.trim()) return;
    try {
      await axios.post('https://erpzo-backend.onrender.com/api/school/messages', { receiverId: selectedUserId, content });
      setContent('');
      fetchMessages(selectedUserId);
    } catch (err) {
      setToast({ message: 'Failed to send message', type: 'error' });
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 mx-auto w-full max-w-[1600px] h-[calc(100vh-64px)] flex flex-col relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate shrink-0 mb-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Communication Center</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Send and receive messages with teachers and students.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="admin-select h-10 px-3 w-64">
            <option value="">-- All Messages --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
      </section>

      <section className={`flex-1 flex flex-col admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 admin-scrollbar ${dark ? 'bg-[#1a1c1e]' : 'bg-surface-container-lowest'}`}>
          {loading ? (
            <div className="py-8 text-center text-outline">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center text-outline">No messages found.</div>
          ) : (
            messages.map((m, i) => {
              // The API returns senderName and receiverName.
              // We don't have the logged-in user's userId explicitly unless we decode token, but we can guess it: 
              // If selectedUserId matches receiver, then we are sender.
              // Better: Check if senderId matches selectedUserId. If yes, it's incoming. Else, it's outgoing (since we filtered by withUser).
              // For "All Messages", we just show who it's from and to.
              const isOutgoing = selectedUserId ? m.receiverId === selectedUserId : false;

              return (
                <div key={m.id} className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] lg:max-w-[60%] px-4 py-2 rounded-2xl ${isOutgoing ? (dark ? 'bg-[#3c4a46] text-[#f0f0f3]' : 'bg-primary text-white') : (dark ? 'bg-[#2f3133] border border-[#4a5854]' : 'bg-surface-container-low border border-outline-variant/30')}`}>
                    {!selectedUserId && (
                      <div className="text-[10px] font-bold mb-1 opacity-70">
                        From: {m.senderName} • To: {m.receiverName}
                      </div>
                    )}
                    <div className="text-[13px]" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  </div>
                  <span className={`text-[10px] mt-1 ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{formatDate(m.createdAt)}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedUserId && (
          <form onSubmit={handleSend} className={`p-3 border-t flex gap-2 ${dark ? 'bg-[#2f3133] border-[#4a5854]' : 'bg-white border-outline-variant/50'}`}>
            <input 
              required
              type="text" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className={`flex-1 admin-input h-11 rounded-xl px-4 ${dark ? 'bg-[#1a1c1e]' : 'bg-surface-container-lowest'}`}
              placeholder="Type a message..."
            />
            <button type="submit" className="admin-btn-press h-11 px-6 rounded-xl admin-gradient-primary text-white font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
