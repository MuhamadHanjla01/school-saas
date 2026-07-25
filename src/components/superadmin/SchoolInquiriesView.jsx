import React, { useState } from 'react';

const mockInquiries = [
  {
    id: 1,
    schoolName: 'Oakridge International',
    domain: 'oakridge.edu.in',
    contactName: 'Sarah Jenkins',
    contactEmail: 's.jenkins@oakridge.edu',
    source: 'Website',
    sourceColor: 'bg-blue-100 text-blue-600',
    date: 'Oct 24, 2023',
    status: 'Activated',
    statusColor: 'bg-emerald-100 text-emerald-600',
    statusDot: 'bg-emerald-500'
  },
  {
    id: 2,
    schoolName: 'Maple Leaf Academy',
    domain: 'mapleleaf.ca',
    contactName: 'David Chen',
    contactEmail: 'd.chen@mapleleaf.ca',
    source: 'Referral',
    sourceColor: 'bg-orange-100 text-orange-600',
    date: 'Oct 23, 2023',
    status: 'Rejected',
    statusColor: 'bg-red-100 text-red-600',
    statusDot: 'bg-red-500'
  },
  {
    id: 3,
    schoolName: "St. Patrick's High",
    domain: 'stpatricks.edu',
    contactName: "Michael O'Connor",
    contactEmail: 'admin@stpatricks.edu',
    source: 'Website',
    sourceColor: 'bg-blue-100 text-blue-600',
    date: 'Oct 22, 2023',
    status: 'Activated',
    statusColor: 'bg-emerald-100 text-emerald-600',
    statusDot: 'bg-emerald-500'
  }
];

export default function SchoolInquiriesView({ dark, setShowDemoOnboardModal }) {
  const [search, setSearch] = useState('');
  const [reviewingInquiry, setReviewingInquiry] = useState(null);

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1200px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">School Inquiries</h1>
          <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
            Manage and track demo requests from prospective institutions.
          </p>
        </div>
        <button
          onClick={() => setShowDemoOnboardModal?.(true)}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#006b5c]/25 hover:scale-[1.02] transition-all shrink-0"
          style={{ background: 'linear-gradient(135deg, #006b5c 0%, #00897b 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rocket_launch</span>
          Demo Onboarding
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Inquiries */}
        <div className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm hover:shadow-md transition-shadow ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}>
            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '24px' }}>forum</span>
          </div>
          <div>
            <p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Total Inquiries</p>
            <h3 className="text-2xl font-bold">1,248</h3>
          </div>
        </div>

        {/* New Today */}
        <div className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm hover:shadow-md transition-shadow ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
            <span className="material-symbols-outlined text-teal-600" style={{ fontSize: '24px' }}>new_releases</span>
          </div>
          <div>
            <p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>New Today</p>
            <h3 className="text-2xl font-bold">24</h3>
          </div>
        </div>

        {/* Pending Follow-up */}
        <div className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm hover:shadow-md transition-shadow ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #ffedd5, #fed7aa)' }}>
            <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '24px' }}>schedule</span>
          </div>
          <div>
            <p className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Pending Follow-up</p>
            <h3 className="text-2xl font-bold">86</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        
        {/* Table Toolbar */}
        <div className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: '18px' }}>search</span>
            <input 
              type="text" 
              placeholder="Filter inquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 h-10 rounded-xl border text-sm focus:outline-none focus:border-gray-400 transition-colors ${
                dark ? 'bg-[#1a1c1e] border-[#3c4a46] placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
              }`}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium transition-colors ${
              dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
              Filter
            </button>
            <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium transition-colors ${
              dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              Export
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-gray-500 border-gray-100'} border-b`}>
                <th className="px-6 py-4">School Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Date Received</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#3c4a46]">
              {mockInquiries.map((inq) => (
                <tr key={inq.id} className={`transition-colors ${dark ? 'hover:bg-[#3c4a46]/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm mb-0.5">{inq.schoolName}</p>
                    <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>{inq.domain}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm mb-0.5">{inq.contactName}</p>
                    <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>{inq.contactEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-md ${inq.sourceColor}`}>
                      {inq.source}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${dark ? 'text-[#bbcac4]' : 'text-gray-600'}`}>
                    <div className="max-w-[80px] leading-snug">
                      {inq.date.replace(', ', ',\n')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${inq.statusColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${inq.statusDot}`}></span>
                      {inq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setReviewingInquiry(inq)} className="text-[#006b5c] font-semibold text-sm hover:underline">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className={`px-6 py-4 flex items-center justify-between border-t ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
          <span className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>
            Showing 1 to 3 of 1,248
          </span>
          <div className="flex gap-2">
            <button className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-[#bbcac4] hover:bg-[#3c4a46]' : 'text-gray-400 hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>
            <button className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-[#bbcac4] hover:bg-[#3c4a46]' : 'text-gray-400 hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── Review Proposal Modal ── */}
      {reviewingInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]'}`}>
            
            <div className={`p-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
              <h3 className="text-lg font-bold">Review Proposal</h3>
              <button onClick={() => setReviewingInquiry(null)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-[#3c4a46]' : 'hover:bg-gray-100'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>School Information</p>
                <p className="text-base font-semibold">{reviewingInquiry.schoolName}</p>
                <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>{reviewingInquiry.domain}</p>
              </div>

              <div>
                <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>Contact Person</p>
                <p className="text-base font-semibold">{reviewingInquiry.contactName}</p>
                <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>{reviewingInquiry.contactEmail}</p>
              </div>

              <div>
                <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-gray-500'}`}>Proposal Details</p>
                <div className={`p-3 rounded-lg text-sm border ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-[#bbcac4]' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                  Requested a product demonstration for their institution. Expected usage is roughly 800 students. Lead originated from: <span className="font-semibold">{reviewingInquiry.source}</span>.
                </div>
              </div>
            </div>

            <div className={`p-5 border-t flex gap-3 ${dark ? 'border-[#3c4a46] bg-[#1a1c1e]/50' : 'border-[#e2e2e5] bg-gray-50/50'}`}>
              <button onClick={() => setReviewingInquiry(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${dark ? 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                Reject
              </button>
              <button onClick={() => setReviewingInquiry(null)} className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all">
                Accept & Onboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
