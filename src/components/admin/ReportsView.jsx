import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Simple SVG Line Chart Component
function LineChart({ data, color, height = 200 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = 0;
  
  const width = 1000;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full relative group">
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        {[0, 0.5, 1].map(ratio => (
          <line key={ratio} x1="0" y1={height * ratio} x2={width} y2={height * ratio} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="4"
          points={points}
          className="drop-shadow-lg"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - ((d.value - min) / (max - min)) * height;
          return (
            <g key={i} className="hover:opacity-100 transition-opacity cursor-pointer">
              <circle cx={x} cy={y} r="6" fill={color} stroke="white" strokeWidth="2" className="drop-shadow" />
              <text x={x} y={y - 15} textAnchor="middle" fontSize="12" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">{d.label}: {d.value}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-4 text-xs opacity-70">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

// Simple SVG Bar Chart Component
function BarChart({ data, color, height = 200 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const width = 1000;
  const barWidth = width / data.length * 0.6;
  const spacing = width / data.length;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        {[0, 0.5, 1].map(ratio => (
          <line key={ratio} x1="0" y1={height * ratio} x2={width} y2={height * ratio} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / max) * height;
          const x = (i * spacing) + (spacing - barWidth) / 2;
          const y = height - barHeight;
          return (
            <g key={i} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                className="transition-all duration-300 group-hover:brightness-110"
              />
              <text x={x + barWidth/2} y={y - 10} textAnchor="middle" fontSize="14" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">{d.value}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-4 text-xs opacity-70">
        {data.map((d, i) => <span key={i} style={{width: (100/data.length) + '%', textAlign: 'center'}}>{d.label}</span>)}
      </div>
    </div>
  );
}

export default function ReportsView({ dark }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reports/dashboard-stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Dummy data for charts to make it look premium
  const revenueData = [
    { label: 'Jan', value: 45000 },
    { label: 'Feb', value: 52000 },
    { label: 'Mar', value: 48000 },
    { label: 'Apr', value: 61000 },
    { label: 'May', value: 59000 },
    { label: 'Jun', value: 75000 },
  ];

  const attendanceData = [
    { label: 'Mon', value: 95 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 96 },
    { label: 'Thu', value: 94 },
    { label: 'Fri', value: 89 },
  ];

  return (
    <div className={`p-5 lg:p-10 flex-1 space-y-8 animate-fadeIn ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-background text-on-surface'}`}>
      {/* Header */}
      <div>
        <nav className={`flex items-center gap-2 text-label-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>
          <span>Admin Portal</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Reports & Analytics</span>
        </nav>
        <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Reports & Analytics</h2>
        <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>School performance, financial metrics, and operational insights.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center opacity-70">Loading analytics data...</div>
      ) : (
        <>
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats?.stats?.map((stat, i) => (
              <div key={i} className={`p-6 rounded-[24px] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-10 transition-transform group-hover:scale-110`} style={{ backgroundColor: stat.color }}></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className={`text-sm font-semibold mb-1 ${dark ? 'text-[#bbcac4]' : 'text-on-surface-variant'}`}>{stat.label}</div>
                    <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-on-surface'}`}>{stat.value}</div>
                    <div className="text-xs mt-2 flex items-center gap-1 font-medium" style={{ color: stat.isHealth ? '#006b5c' : 'inherit' }}>
                      <span className="material-symbols-outlined text-[14px]">{stat.isHealth ? 'trending_up' : 'info'}</span>
                      {stat.change} <span className="opacity-70 font-normal">{stat.changeLabel}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: stat.color }}>
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className={`p-8 rounded-[24px] shadow-sm ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className={`font-bold text-lg ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Revenue Growth</h3>
                  <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Monthly fee collections</p>
                </div>
                <button className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-outline-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
              <LineChart data={revenueData} color="#00c2a8" height={220} />
            </div>

            {/* Attendance Chart */}
            <div className={`p-8 rounded-[24px] shadow-sm ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className={`font-bold text-lg ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Weekly Attendance</h3>
                  <p className={`text-xs ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Average student attendance percentage</p>
                </div>
                <button className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${dark ? 'border-[#3c4a46] hover:bg-[#3c4a46]' : 'border-outline-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
              <BarChart data={attendanceData} color="#0060ac" height={220} />
            </div>
          </div>

          {/* Detailed Reports Table */}
          <div className={`p-6 rounded-[24px] shadow-sm ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold text-lg ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Top Performing Classes</h3>
              <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${dark ? 'bg-[#3c4a46] text-white hover:bg-[#4a5c57]' : 'bg-surface-container text-[#1a1c1e] hover:bg-surface-container-high'}`}>
                Export Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b text-xs uppercase ${dark ? 'border-[#3c4a46] text-[#bbcac4]' : 'border-outline-variant text-outline'}`}>
                  <tr>
                    <th className="p-3 font-semibold">Class Name</th>
                    <th className="p-3 font-semibold">Students</th>
                    <th className="p-3 font-semibold">Attendance Rate</th>
                    <th className="p-3 font-semibold">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stats?.topClasses?.map((cls, i) => (
                    <tr key={i} className={`border-b last:border-0 ${dark ? 'border-[#3c4a46]' : 'border-outline-variant/30'}`}>
                      <td className="p-3 font-bold">{cls.name}</td>
                      <td className="p-3">{cls.students} students</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full overflow-hidden bg-outline-variant/30">
                            <div className="h-full bg-primary" style={{ width: cls.attendance + '%' }}></div>
                          </div>
                          <span className="text-xs font-medium">{cls.attendance}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${dark ? 'bg-[#00c2a8]/20 text-[#00c2a8]' : 'bg-[#00c2a8]/10 text-[#006b5c]'}`}>
                          Excellent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
