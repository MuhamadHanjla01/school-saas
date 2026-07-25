import { useState } from 'react';

const PLANS = ['Starter', 'Growth', 'Enterprise'];
const initialFeatures = [
  { id: 1, name: 'Attendance Management', icon: 'event_available', plans: { Starter: true, Growth: true, Enterprise: true } },
  { id: 2, name: 'Fee Collection', icon: 'payments', plans: { Starter: true, Growth: true, Enterprise: true } },
  { id: 3, name: 'Student Management', icon: 'school', plans: { Starter: true, Growth: true, Enterprise: true } },
  { id: 4, name: 'Parent Portal', icon: 'family_restroom', plans: { Starter: true, Growth: true, Enterprise: true } },
  { id: 5, name: 'HR Management', icon: 'badge', plans: { Starter: false, Growth: true, Enterprise: true } },
  { id: 6, name: 'Transport Tracking', icon: 'directions_bus', plans: { Starter: false, Growth: true, Enterprise: true } },
  { id: 7, name: 'Library System', icon: 'local_library', plans: { Starter: false, Growth: true, Enterprise: true } },
  { id: 8, name: 'Exam Management', icon: 'quiz', plans: { Starter: false, Growth: true, Enterprise: true } },
  { id: 9, name: 'Timetable Builder', icon: 'calendar_month', plans: { Starter: false, Growth: false, Enterprise: true } },
  { id: 10, name: 'Hostel Management', icon: 'hotel', plans: { Starter: false, Growth: false, Enterprise: true } },
  { id: 11, name: 'API Access', icon: 'api', plans: { Starter: false, Growth: false, Enterprise: true } },
  { id: 12, name: 'White-label Branding', icon: 'palette', plans: { Starter: false, Growth: false, Enterprise: true } },
  { id: 13, name: 'Multi-branch Support', icon: 'account_tree', plans: { Starter: false, Growth: false, Enterprise: true } },
  { id: 14, name: 'Custom Integrations', icon: 'integration_instructions', plans: { Starter: false, Growth: false, Enterprise: true } },
];

export default function FeaturesView({ dark, setToast }) {
  const [features, setFeatures] = useState(initialFeatures);

  const toggle = (featureId, plan) => {
    setFeatures(features.map(f => f.id === featureId ? { ...f, plans: { ...f.plans, [plan]: !f.plans[plan] } } : f));
    const feat = features.find(f => f.id === featureId);
    const next = !feat.plans[plan];
    setToast?.({ message: `${feat.name} ${next ? 'enabled' : 'disabled'} for ${plan}`, type: 'success' });
  };

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 mx-auto w-full max-w-[1600px] font-['Inter'] ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>
      <div>
        <div className={`flex items-center gap-2 text-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
          <span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span>Packages</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-[#006b5c] font-medium">Features</span>
        </div>
        <h1 className="text-2xl font-bold">Feature Matrix</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>Toggle platform features per subscription plan.</p>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60' : 'bg-white border-[#e8e8ea]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[11px] font-bold tracking-wider uppercase border-b ${dark ? 'text-[#bbcac4] border-[#3c4a46]' : 'text-[#6c7a76] border-[#e2e2e5]'}`}>
                <th className="px-6 py-4 w-1/2">Feature</th>
                {PLANS.map(p => <th key={p} className="px-6 py-4 text-center">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {features.map(f => (
                <tr key={f.id} className={`border-b transition-colors ${dark ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30' : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#006b5c]/10 text-[#006b5c]">
                        <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                      </div>
                      <span className="font-medium text-sm">{f.name}</span>
                    </div>
                  </td>
                  {PLANS.map(p => (
                    <td key={p} className="px-6 py-3 text-center">
                      <button onClick={() => toggle(f.id, p)} className={`w-10 h-6 rounded-full relative transition-colors ${f.plans[p] ? 'bg-[#006b5c]' : dark ? 'bg-[#3c4a46]' : 'bg-[#e2e2e5]'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${f.plans[p] ? 'left-5' : 'left-1'}`} />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
