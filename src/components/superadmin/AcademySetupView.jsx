import { useState } from 'react';

export default function AcademySetupView({ dark, setToast }) {
  const [form, setForm] = useState({ year: '2024-2025', grading: 'GPA', terms: 'Semester', attendance: 'Daily', workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const toggleDay = (d) => setForm({ ...form, workingDays: form.workingDays.includes(d) ? form.workingDays.filter(x => x !== d) : [...form.workingDays, d] });
  const handleSave = (e) => { e.preventDefault(); setToast?.({ message: 'Academy settings saved', type: 'success' }); };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[800px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Settings</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Academy Setup</span></div>
        <h1 className="text-2xl font-bold">Academy Setup</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Configure default academic parameters for new schools.</p>
      </div>
      <form onSubmit={handleSave} className={`rounded-2xl border shadow-sm p-6 space-y-5 ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div><label className="block text-sm font-semibold mb-1.5">Academic Year</label><input className="sa-input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold mb-1.5">Grading System</label><select className="sa-input" value={form.grading} onChange={e => setForm({ ...form, grading: e.target.value })}><option>GPA</option><option>Percentage</option><option>Letter Grade</option><option>CGPA</option></select></div>
          <div><label className="block text-sm font-semibold mb-1.5">Term Structure</label><select className="sa-input" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })}><option>Semester</option><option>Trimester</option><option>Quarter</option><option>Annual</option></select></div>
        </div>
        <div><label className="block text-sm font-semibold mb-1.5">Attendance Type</label><select className="sa-input" value={form.attendance} onChange={e => setForm({ ...form, attendance: e.target.value })}><option>Daily</option><option>Period-wise</option><option>Subject-wise</option></select></div>
        <div>
          <label className="block text-sm font-semibold mb-2">Working Days</label>
          <div className="flex gap-2 flex-wrap">
            {days.map(d => (
              <button key={d} type="button" onClick={() => toggleDay(d)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${form.workingDays.includes(d) ? 'bg-[#006b5c] text-white' : dark ? 'bg-[#3c4a46] text-[#bbcac4]' : 'bg-[#eeeef0] text-[#3c4a46]'}`}>{d}</button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg transition-all">Save Settings</button>
      </form>
    </div>
  );
}
