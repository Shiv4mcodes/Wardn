import React from 'react';
import { ShieldCheck, RefreshCw, BarChart2, LayoutDashboard, Download, ArrowDown, Activity, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function HeroHeader({ tickets, onSeedDemo, isPolling, onManualRefresh, activeView, setActiveView, onDownloadReport }) {
  const totalTickets = tickets.length;
  const activeEscalations = tickets.filter(t => t.escalated && t.status !== 'RESOLVED' && t.status !== 'VERIFIED').length;
  const resolvedToday = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'VERIFIED').length;

  // Average Resolution Time (in minutes)
  const resTimes = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'VERIFIED').map(t => {
    try {
      const created = new Date(t.created_at);
      const updated = new Date(t.last_updated);
      return Math.max(0, (updated - created) / 60000);
    } catch {
      return 0;
    }
  });
  const avgResTime = resTimes.length > 0 ? (resTimes.reduce((a, b) => a + b, 0) / resTimes.length).toFixed(1) : '1.5';

  const scrollToReportForm = () => {
    const el = document.getElementById('report-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-editorial-section w-full relative overflow-hidden pt-6 pb-20 px-6 min-h-[85vh] flex flex-col justify-between">
      
      {/* Subtle Vignette Overlay for Depth */}
      <div className="absolute inset-0 hero-vignette pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col justify-between flex-1">
        
        {/* Top Nav Row - Seamless Glassy Floating Layout */}
        <nav className="flex flex-col md:flex-row items-center justify-between gap-4 py-3 bg-transparent border-none">
          
          {/* Logo Brand Lockup */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#f97316] text-white shadow-md border border-white/20 shrink-0">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black tracking-tight text-white wordmark-shadow">Wardn</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-[#fb923c] border border-white/20 shadow-sm">
                Autonomous
              </span>
            </div>
          </div>

          {/* Center Glassy Segmented Control View Switcher */}
          <div className="flex items-center bg-black/30 backdrop-blur-md p-1 rounded-md border border-white/10 shadow-lg">
            <button
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'board'
                  ? 'bg-[#f97316] text-white font-bold shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'analytics'
                  ? 'bg-[#f97316] text-white font-bold shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Right Action Buttons - Translucent Glassy Outlines */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onDownloadReport}
              className="px-3.5 py-1.5 text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm border border-white/15 rounded-md hover:bg-black/40 hover:border-white/30 transition-all shadow-sm flex items-center gap-1.5"
              title="Download Daily Report CSV"
            >
              <Download className="w-3.5 h-3.5 text-white/80" />
              <span className="hidden sm:inline">Daily Report</span>
            </button>

            <button
              onClick={onManualRefresh}
              className="p-1.5 text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm border border-white/15 rounded-md hover:bg-black/40 hover:border-white/30 transition-all shadow-sm flex items-center justify-center"
              title="Refresh Tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white/80 ${isPolling ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onSeedDemo}
              className="px-3.5 py-1.5 text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm border border-white/15 rounded-md hover:bg-black/40 hover:border-white/30 transition-all shadow-sm"
            >
              Seed Demo
            </button>
          </div>

        </nav>

        {/* Hero Main Content Grid Vertically Centered */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 my-auto py-12 items-center">
          
          {/* Left Column: Bold Editorial Headline, Tagline, & CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-none wordmark-shadow">
              Wardn
            </h1>

            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight wordmark-shadow">
              Autonomous Triage. <em className="italic font-normal text-amber-200 opacity-95">Zero Human Touch.</em>
            </p>

            <p className="text-base sm:text-lg text-amber-50/90 font-medium max-w-xl leading-relaxed wordmark-shadow">
              Reports issues, classifies them, and resolves them — automatically. Full end-to-end facilities maintenance engine with instant deduplication and SLA auto-escalation.
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={scrollToReportForm}
                className="btn-primary-gradient px-7 py-3.5 text-sm font-bold shadow-2xl rounded-md flex items-center gap-3 cursor-pointer"
              >
                <span>Report Incident</span>
                <ArrowDown className="w-4.5 h-4.5" />
              </button>

              <span className="text-xs text-amber-200/90 font-semibold hidden sm:inline wordmark-shadow">
                Live Auto-Triage Active
              </span>
            </div>

          </div>

          {/* Right Column: Glowing 3D-ish Warm Rounded Tiles */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-5">
            
            {/* Tile 1: Total Tickets */}
            <div className="glowing-stat-tile p-6 text-left flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-100/90 font-semibold mb-3 wordmark-shadow">
                <span>Total Tickets</span>
                <Activity className="w-5 h-5 text-amber-300" />
              </div>
              <div className="text-4xl font-black text-white font-mono tracking-tight wordmark-shadow">{totalTickets}</div>
              <div className="text-xs text-amber-100/80 font-medium mt-2 wordmark-shadow">Logged & Processed</div>
            </div>

            {/* Tile 2: Active Escalations */}
            <div className="glowing-stat-tile p-6 text-left flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-100/90 font-semibold mb-3 wordmark-shadow">
                <span>Escalations</span>
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <div className="text-4xl font-black text-red-300 font-mono tracking-tight wordmark-shadow">{activeEscalations}</div>
              <div className="text-xs text-amber-100/80 font-medium mt-2 wordmark-shadow">Active Urgent Alerts</div>
            </div>

            {/* Tile 3: Resolved */}
            <div className="glowing-stat-tile p-6 text-left flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-100/90 font-semibold mb-3 wordmark-shadow">
                <span>Resolved</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="text-4xl font-black text-emerald-200 font-mono tracking-tight wordmark-shadow">{resolvedToday}</div>
              <div className="text-xs text-amber-100/80 font-medium mt-2 wordmark-shadow">Closed & Verified</div>
            </div>

            {/* Tile 4: Avg Resolution Time */}
            <div className="glowing-stat-tile p-6 text-left flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-100/90 font-semibold mb-3 wordmark-shadow">
                <span>Avg Speed</span>
                <Clock className="w-5 h-5 text-amber-300" />
              </div>
              <div className="text-4xl font-black text-white font-mono tracking-tight wordmark-shadow">
                {avgResTime}<span className="text-xs font-sans font-semibold text-amber-200 ml-1">min</span>
              </div>
              <div className="text-xs text-amber-100/80 font-medium mt-2 wordmark-shadow">Mean Time to Fix</div>
            </div>

          </div>

        </div>

        {/* Bottom Scroll Cue */}
        <div className="text-center pt-4 opacity-60 hover:opacity-100 transition-opacity">
          <button 
            onClick={scrollToReportForm}
            className="text-xs text-amber-200 font-semibold flex items-center justify-center gap-1.5 mx-auto wordmark-shadow cursor-pointer"
          >
            <span>Scroll for Issue Intake & Live Board</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>

      </div>

    </section>
  );
}
