import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Toast } from './AdminUI';

export default function CalendarView({ dark }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ title: '', date: '', type: 'event' });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://school-backend-70ny.onrender.com/api/school/events');
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://school-backend-70ny.onrender.com/api/school/events', form);
      setToast({ message: 'Event added successfully', type: 'success' });
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to save event', type: 'error' });
    }
  };

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px] relative">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Academic Calendar</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage school events, holidays, and deadlines.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setForm({ title: '', date: '', type: 'event' }); setModalOpen(true); }} className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add Event
          </button>
        </div>
      </section>

      <section className={`admin-card rounded-xl border overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <div className="overflow-x-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-outline">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-outline">No events found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map((e, i) => (
                <div key={e.id || i} className={`admin-row-enter p-4 rounded-xl border flex flex-col gap-2 ${dark ? 'bg-[#3c4a46]/30 border-[#4a5854]' : 'bg-surface-container-lowest border-outline-variant/50'}`} style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${dark ? 'bg-[#2f3133]' : 'bg-white shadow-sm'}`}>
                      <span className="text-[10px] font-bold text-error uppercase">{e.month}</span>
                      <span className="text-[18px] font-black leading-none">{e.dateNum}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${e.type === 'exam' ? 'bg-error/10 text-error' : e.type === 'deadline' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>{e.type}</span>
                  </div>
                  <h4 className="text-[14px] font-bold mt-2 leading-tight">{e.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <Modal title="Add Event" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Event Title</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="admin-input w-full" placeholder="e.g. Science Fair" />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Date</label>
                <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="admin-input w-full" />
              </div>
              <div className="flex-1">
                <label className={`block text-[12px] font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>Type</label>
                <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="admin-select w-full">
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold ${dark ? 'bg-[#3c4a46] hover:bg-[#4a5854] text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>Cancel</button>
              <button type="submit" className="admin-gradient-primary px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:shadow-lg transition-all">Save Event</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
