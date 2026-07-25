import { useState } from 'react';

export default function SchoolSettingsView({ dark, tab }) {
  const [activeTab, setActiveTab] = useState(tab || 'profile');

  return (
    <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1200px]">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 admin-section-animate">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">School Settings</h2>
          <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Configure school profile, academic year, and grading rules.</p>
        </div>
        <button className="admin-btn-press flex items-center gap-1.5 admin-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
          Save Changes
        </button>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2 mb-4" style={{ borderColor: dark ? '#3c4a46' : '#e2e2e5' }}>
        {[
          { id: 'profile', label: 'School Profile' },
          { id: 'academic', label: 'Academic Year' },
          { id: 'grading', label: 'Grading System' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === t.id ? 'bg-primary/10 text-primary' : dark ? 'text-[#bbcac4] hover:bg-[#3c4a46]' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-section-animate">
        {activeTab === 'profile' && (
          <div className={`admin-card p-5 lg:p-6 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
            <h4 className="text-[15px] font-semibold mb-4 border-b pb-2" style={{ borderColor: dark ? '#3c4a46' : '#e2e2e5' }}>Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>School Name</label>
                <input className="admin-input" defaultValue="iNiLabs School" />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Registration Number</label>
                <input className="admin-input" defaultValue="REG-2024-001X" />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Contact Email</label>
                <input className="admin-input" defaultValue="admin@inilabsschool.edu" />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Phone Number</label>
                <input className="admin-input" defaultValue="+1 234 567 8900" />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Address</label>
                <textarea className="admin-input min-h-[80px] resize-none" defaultValue="123 Education Lane, Learning District, Cityville" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className={`admin-card p-5 lg:p-6 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
            <h4 className="text-[15px] font-semibold mb-4 border-b pb-2" style={{ borderColor: dark ? '#3c4a46' : '#e2e2e5' }}>Academic Terms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Current Academic Year</label>
                <select className="admin-select w-full h-10">
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Term Name</label>
                <input className="admin-input" defaultValue="Term 1 (Fall)" />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>Start Date</label>
                <input className="admin-input" type="date" defaultValue="2024-08-01" />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-on-surface'}`}>End Date</label>
                <input className="admin-input" type="date" defaultValue="2024-12-15" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grading' && (
          <div className={`admin-card p-5 lg:p-6 rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
            <h4 className="text-[15px] font-semibold mb-4 border-b pb-2" style={{ borderColor: dark ? '#3c4a46' : '#e2e2e5' }}>Grading Rules</h4>
            <div className="space-y-3">
              {[
                { grade: 'A+', min: 90, max: 100, point: 4.0 },
                { grade: 'A', min: 80, max: 89, point: 3.5 },
                { grade: 'B', min: 70, max: 79, point: 3.0 },
                { grade: 'C', min: 60, max: 69, point: 2.0 },
                { grade: 'F', min: 0, max: 59, point: 0.0 },
              ].map((g, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <input className="admin-input w-20 text-center font-bold" defaultValue={g.grade} />
                  <span className={dark ? 'text-outline' : 'text-on-surface-variant'}>Min %</span>
                  <input className="admin-input w-24 text-center" defaultValue={g.min} type="number" />
                  <span className={dark ? 'text-outline' : 'text-on-surface-variant'}>Max %</span>
                  <input className="admin-input w-24 text-center" defaultValue={g.max} type="number" />
                  <span className={dark ? 'text-outline' : 'text-on-surface-variant'}>GPA</span>
                  <input className="admin-input w-24 text-center" defaultValue={g.point} type="number" step="0.1" />
                  <button className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              ))}
              <button className="text-primary text-[13px] font-semibold hover:underline mt-2 inline-flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Add Grade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
