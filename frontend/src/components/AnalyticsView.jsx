import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Clock, ShieldAlert, CheckCircle2, Layers, TrendingUp, Cpu } from 'lucide-react';

export default function AnalyticsView({ tickets }) {
  const totalTickets = tickets.length;
  const escalatedTickets = tickets.filter(t => t.escalated);
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'VERIFIED');

  // Escalation Rate
  const escalationRate = totalTickets > 0 ? ((escalatedTickets.length / totalTickets) * 100).toFixed(1) : 0;

  // Average Resolution Time (in minutes)
  const resTimes = resolvedTickets.map(t => {
    try {
      const created = new Date(t.created_at);
      const updated = new Date(t.last_updated);
      return Math.max(0, (updated - created) / 60000);
    } catch {
      return 0;
    }
  });
  const avgResTime = resTimes.length > 0 ? (resTimes.reduce((a, b) => a + b, 0) / resTimes.length).toFixed(1) : 0;

  // Tickets Handled Today
  const todayStr = new Date().toISOString().split('T')[0];
  const ticketsToday = tickets.filter(t => t.created_at?.startsWith(todayStr)).length || totalTickets;

  // Category Counts Data for Bar Chart
  const categoryCounts = tickets.reduce((acc, t) => {
    const cat = (t.category || 'other').toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.keys(categoryCounts).map(cat => ({
    category: cat.toUpperCase(),
    count: categoryCounts[cat]
  }));

  // Severity Data for Pie Chart
  const severityCounts = tickets.reduce((acc, t) => {
    const sev = t.severity || 'LOW';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  const severityChartData = [
    { name: 'HIGH', value: severityCounts['HIGH'] || 0, color: '#ef4444' },
    { name: 'MEDIUM', value: severityCounts['MEDIUM'] || 0, color: '#eab308' },
    { name: 'LOW', value: severityCounts['LOW'] || 0, color: '#22c55e' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Analytics Section Header Band */}
      <div className="analytics-header-band p-5 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight wordmark-shadow">System Performance & Analytics</h2>
          <p className="text-xs text-[#d4d4d8] font-medium mt-0.5">Real-time resolution metrics, escalation rates, and category distribution</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0a0a0a]/80 text-[#fb923c] border border-[#f97316]/30 shadow-sm">
          Live Telemetry
        </span>
      </div>

      {/* Top Glowing Widget Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Card 1: Avg Resolution Time (Orange Glow) */}
        <div 
          className="p-5 rounded-2xl border border-[#f97316]/30 flex items-center gap-4 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(124, 45, 18, 0.22) 50%, #0d0908 100%)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(249, 115, 22, 0.08)'
          }}
        >
          <div className="p-3 rounded-2xl bg-[#f97316]/15 border border-[#f97316]/35 text-[#f97316] shadow-md shadow-[#f97316]/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#fb923c] font-semibold uppercase tracking-wider">Avg Resolution Time</div>
            <div className="text-2xl font-bold font-mono text-[#fafafa] mt-0.5">{avgResTime} <span className="text-xs text-[#d4d4d8] font-sans">min</span></div>
          </div>
        </div>

        {/* Stat Card 2: Escalation Rate (Red Glow) */}
        <div 
          className="p-5 rounded-2xl border border-[#ef4444]/30 flex items-center gap-4 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(153, 27, 27, 0.22) 50%, #0d0908 100%)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.08)'
          }}
        >
          <div className="p-3 rounded-2xl bg-[#ef4444]/15 border border-[#ef4444]/35 text-[#ef4444] shadow-md shadow-[#ef4444]/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#fca5a5] font-semibold uppercase tracking-wider">Escalation Rate</div>
            <div className="text-2xl font-bold font-mono text-[#fafafa] mt-0.5">{escalationRate}%</div>
          </div>
        </div>

        {/* Stat Card 3: Handled Today (Green Glow) */}
        <div 
          className="p-5 rounded-2xl border border-[#22c55e]/30 flex items-center gap-4 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(20, 83, 45, 0.22) 50%, #0d0908 100%)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(34, 197, 94, 0.08)'
          }}
        >
          <div className="p-3 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/35 text-[#22c55e] shadow-md shadow-[#22c55e]/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#86efac] font-semibold uppercase tracking-wider">Handled Today</div>
            <div className="text-2xl font-bold font-mono text-[#fafafa] mt-0.5">{ticketsToday}</div>
          </div>
        </div>

        {/* Stat Card 4: Total Volume (Amber/Orange Glow) */}
        <div 
          className="p-5 rounded-2xl border border-[#fb923c]/30 flex items-center gap-4 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.18) 0%, rgba(154, 52, 18, 0.22) 50%, #0d0908 100%)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(251, 146, 60, 0.08)'
          }}
        >
          <div className="p-3 rounded-2xl bg-[#fb923c]/15 border border-[#fb923c]/35 text-[#fb923c] shadow-md shadow-[#fb923c]/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#fdba74] font-semibold uppercase tracking-wider">Total Volume</div>
            <div className="text-2xl font-bold font-mono text-[#fafafa] mt-0.5">{totalTickets}</div>
          </div>
        </div>

      </div>

      {/* Analytics Charts in Warm Glowing Widget Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Volume Bar Chart */}
        <div 
          className="p-6 rounded-2xl border border-[#f97316]/20 relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #171211 0%, #0d0908 100%)',
            boxShadow: '0 0 35px rgba(249, 115, 22, 0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#f97316]" />
              Incidents by Category
            </h3>
            <span className="text-[11px] font-medium text-[#a1a1aa] bg-[#f97316]/10 px-2.5 py-0.5 rounded-full border border-[#f97316]/20">
              Volume Breakdown
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="category" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171211', borderColor: 'rgba(249, 115, 22, 0.3)', borderRadius: '12px', fontSize: '12px', color: '#fafafa', boxShadow: '0 10px 25px rgba(0,0,0,0.6)' }} 
                  itemStyle={{ color: '#fb923c' }}
                />
                <Bar dataKey="count" fill="url(#barOrangeGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie Chart */}
        <div 
          className="p-6 rounded-2xl border border-[#f97316]/20 relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #171211 0%, #0d0908 100%)',
            boxShadow: '0 0 35px rgba(249, 115, 22, 0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#fb923c]" />
              Severity Distribution
            </h3>
            <span className="text-[11px] font-medium text-[#a1a1aa] bg-[#f97316]/10 px-2.5 py-0.5 rounded-full border border-[#f97316]/20">
              Risk Profiling
            </span>
          </div>

          <div 
            className="h-64 w-full flex items-center justify-center relative rounded-xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.10) 0%, transparent 70%)'
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171211', borderColor: 'rgba(249, 115, 22, 0.3)', borderRadius: '12px', fontSize: '12px', color: '#fafafa', boxShadow: '0 10px 25px rgba(0,0,0,0.6)' }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', color: '#d4d4d8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
