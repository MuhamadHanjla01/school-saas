import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { binaryInsert } from '../../hooks/useDataCache';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import io from 'socket.io-client';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ─── Messaging View (Shared between Student & Teacher) ─────────────────────
export default function MessagingView({ dark, role }) {
  const { user, accessToken } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  // HashMap: userId → Message[] for O(1) conversation lookup
  const conversationsRef = useRef(new Map());
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  // ── Contact search with Trie ──
  const { query: searchQuery, setQuery: setSearchQuery, results: filteredContacts } = useDebouncedSearch({
    items: contacts,
    nameKey: 'name',
    delay: 200,
  });

  // ── Fetch contacts ──
  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const promises = [axios.get('/api/teachers')];
        if (role === 'Teacher') promises.push(axios.get('/api/students'));

        const results = await Promise.all(promises);
        const teacherContacts = (results[0].data.teachers || []).map(t => ({
          id: t.user?.id, name: t.name, role: 'Teacher', department: t.department, userId: t.user?.id,
        })).filter(c => c.id && c.id !== user?.id);

        let studentContacts = [];
        if (results[1]) {
          studentContacts = (results[1].data.students || []).map(s => ({
            id: s.user?.id, name: s.name, role: 'Student', className: s.className, userId: s.user?.id,
          })).filter(c => c.id && c.id !== user?.id);
        }

        setContacts([...teacherContacts, ...studentContacts]);
      } catch (err) {
        console.error('Failed to fetch contacts', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [role, user?.id]);

  // ── Fetch unread count ──
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get('/api/school/messages/unread-count');
      // We get total count, but we can also get per-sender by fetching all unread
      const allMessages = await axios.get('/api/school/messages');
      const unread = new Map();
      (allMessages.data.messages || []).forEach(m => {
        if (m.receiverId === user?.id && !m.read) {
          unread.set(m.senderId, (unread.get(m.senderId) || 0) + 1);
        }
      });
      setUnreadCounts(unread);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, [user?.id]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  // ── Socket.io for real-time messages ──
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(apiBase || window.location.origin, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      // Binary insert into the correct conversation maintaining chronological order
      const contactId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
      const conv = conversationsRef.current.get(contactId) || [];
      binaryInsert(conv, msg, (a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      conversationsRef.current.set(contactId, conv);

      // If this conversation is currently open, update the view
      if (selectedContact?.id === contactId) {
        setMessages([...conv]);
        // Mark as read
        if (msg.senderId !== user?.id) {
          axios.put('/api/school/messages/read', { senderId: msg.senderId }).catch(() => {});
        }
      } else if (msg.senderId !== user?.id) {
        // Update unread count for the sender
        setUnreadCounts(prev => {
          const next = new Map(prev);
          next.set(msg.senderId, (next.get(msg.senderId) || 0) + 1);
          return next;
        });
      }
    });

    socket.on('messages_read', ({ readBy }) => {
      // The other user read our messages — update UI if needed
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user?.id, selectedContact?.id]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load conversation with selected contact ──
  const loadConversation = useCallback(async (contact) => {
    setSelectedContact(contact);
    setMobileShowChat(true);
    setLoadingMessages(true);
    setNewMessage('');

    // Check cache first — O(1) lookup
    const cached = conversationsRef.current.get(contact.id);
    if (cached && cached.length > 0) {
      setMessages([...cached]);
    }

    try {
      const res = await axios.get(`/api/school/messages?withUser=${contact.id}`);
      const sorted = (res.data.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      conversationsRef.current.set(contact.id, sorted);
      setMessages(sorted);

      // Mark as read
      await axios.put('/api/school/messages/read', { senderId: contact.id }).catch(() => {});
      setUnreadCounts(prev => {
        const next = new Map(prev);
        next.delete(contact.id);
        return next;
      });
    } catch (err) {
      console.error('Failed to load conversation', err);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  // ── Send message ──
  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedContact || sending) return;
    setSending(true);
    try {
      const res = await axios.post('/api/school/messages', {
        receiverId: selectedContact.id,
        content: newMessage.trim(),
      });
      const sentMsg = {
        ...res.data.message,
        senderName: user?.name || user?.email || 'You',
        receiverName: selectedContact.name,
      };

      // Insert into conversation cache using binary insert — O(log n)
      const conv = conversationsRef.current.get(selectedContact.id) || [];
      binaryInsert(conv, sentMsg, (a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      conversationsRef.current.set(selectedContact.id, conv);
      setMessages([...conv]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedContact, sending, user]);

  // ── Total unread badge ──
  const totalUnread = useMemo(() => {
    let count = 0;
    for (const v of unreadCounts.values()) count += v;
    return count;
  }, [unreadCounts]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Contact List ── */}
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[340px] border-r shrink-0 ${dark ? 'border-[#3c4a46] bg-[#1a1c1e]' : 'border-outline-variant/40 bg-[#f7f7fa]'}`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/40'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold tracking-tight">Messages</h2>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">{totalUnread}</span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '16px' }}>search</span>
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border ${dark ? 'bg-[#2f3133] border-[#3c4a46] text-white placeholder-[#8b9896]' : 'bg-white border-outline-variant placeholder-outline'}`}
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <p className="text-sm text-outline p-4">Loading contacts...</p>
          ) : filteredContacts.length === 0 ? (
            <p className="text-sm text-outline p-4">No contacts found.</p>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = selectedContact?.id === contact.id;
              const unread = unreadCounts.get(contact.id) || 0;
              return (
                <button
                  key={contact.id}
                  onClick={() => loadConversation(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b ${dark ? 'border-[#3c4a46]/50' : 'border-outline-variant/20'}
                    ${isSelected
                      ? dark ? 'bg-primary/10 border-l-[3px] border-l-primary' : 'bg-primary/5 border-l-[3px] border-l-primary'
                      : dark ? 'hover:bg-[#2f3133]' : 'hover:bg-white'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${contact.role === 'Teacher' ? 'bg-gradient-to-br from-[#0060ac] to-[#00897b]' : 'bg-gradient-to-br from-[#6a4c93] to-[#9d4edd]'}`}>
                    {(contact.name || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : ''}`}>{contact.name}</span>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">{unread}</span>
                      )}
                    </div>
                    <span className={`text-[11px] ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>
                      {contact.role}{contact.department ? ` · ${contact.department}` : ''}{contact.className ? ` · ${contact.className}` : ''}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 ${dark ? 'bg-[#1a1c1e]' : 'bg-surface'}`}>
        {!selectedContact ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '64px' }}>chat</span>
            <p className={`text-sm ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>Select a contact to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${dark ? 'border-[#3c4a46] bg-[#2f3133]' : 'border-outline-variant/40 bg-white'}`}>
              <button className="md:hidden p-1" onClick={() => setMobileShowChat(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedContact.role === 'Teacher' ? 'bg-gradient-to-br from-[#0060ac] to-[#00897b]' : 'bg-gradient-to-br from-[#6a4c93] to-[#9d4edd]'}`}>
                {(selectedContact.name || '?').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold">{selectedContact.name}</h3>
                <p className={`text-[11px] ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>{selectedContact.role}{selectedContact.department ? ` · ${selectedContact.department}` : ''}</p>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${dark ? 'bg-[#1a1c1e]' : 'bg-[#f7f7fa]'}`}>
              {loadingMessages && messages.length === 0 ? (
                <p className="text-sm text-outline text-center py-8">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-outline mb-2 block" style={{ fontSize: '40px' }}>waving_hand</span>
                  <p className={`text-sm ${dark ? 'text-[#8b9896]' : 'text-outline'}`}>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl ${isMine
                        ? 'bg-primary text-white rounded-br-md'
                        : dark ? 'bg-[#2f3133] text-white rounded-bl-md' : 'bg-white text-on-surface rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className={`text-[10px] ${isMine ? 'text-white/70' : dark ? 'text-[#8b9896]' : 'text-outline'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <span className="material-symbols-outlined text-white/70" style={{ fontSize: '12px' }}>
                              {msg.read ? 'done_all' : 'done'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className={`flex items-center gap-2 px-4 py-3 border-t shrink-0 ${dark ? 'border-[#3c4a46] bg-[#2f3133]' : 'border-outline-variant/40 bg-white'}`}>
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm border ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white placeholder-[#8b9896]' : 'bg-[#f7f7fa] border-outline-variant placeholder-outline'} focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-all active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{sending ? 'hourglass_empty' : 'send'}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
