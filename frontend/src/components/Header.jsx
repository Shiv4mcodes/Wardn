import React from 'react';
import { ShieldCheck, RefreshCw, BarChart2, LayoutDashboard, Download } from 'lucide-react';

export default function Header({ tickets, onSeedDemo, isPolling, onManualRefresh, activeView, setActiveView, onDownloadReport }) {
  const totalTickets = tickets.length;
  const activeEscalations = tickets.filter(t => t.escalated && t.status !== 'RESOLVED' && t.status !== 'VERIFIED').length;
  const resolvedToday = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'VERIFIED').length;

  return (
    <header className="editorial-header-band px-6 py-6 mb-6 relative overflow-hidden m-0 top-0 left-0 w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
        
        {/* Brand Logo & View Toggle */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#f97316] text-white shadow-md border border-[#fb923c]/40 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white wordmark-shadow">
                  Wardn
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0a0a0a]/80 text-[#fb923c] border border-[#f97316]/30 shadow-sm">
                  Autonomous
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#d4d4d8] uppercase mt-0.5 wordmark-shadow">
                AUTONOMOUS TRIAGE • ZERO HUMAN TOUCH
              </p>
            </div>
          </div>

          {/* Board vs Analytics Tab Switch */}
          <div className="flex items-center bg-[#0a0a0a]/90 p-1 rounded-md border border-[#27272a] shadow-md">
            <button
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeView === 'board'
                  ? 'btn-primary-gradient text-white font-bold'
                  : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeView === 'analytics'
                  ? 'btn-primary-gradient text-white font-bold'
                  : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Header Stat Cards */}
        <div className="flex items-center divide-x divide-[#ffffff]/15 text-center md:text-left">
          
          <div className="pr-5">
            <div className="text-xl font-black font-mono text-white wordmark-shadow leading-none">{totalTickets}</div>
            <div className="text-[10px] text-[#e4e4e7] font-semibold mt-1 wordmark-shadow">Total Tickets</div>
          </div>

          <div className="px-5">
            <div className="flex items-center justify-center md:justify-start gap-1.5 leading-none">
              {activeEscalations > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-sm" />
              )}
              <span className={`text-xl font-black font-mono wordmark-shadow ${activeEscalations > 0 ? 'text-[#fca5a5]' : 'text-white'}`}>
                {activeEscalations}
              </span>
            </div>
            <div className="text-[10px] text-[#e4e4e7] font-semibold mt-1 wordmark-shadow">Active Escalations</div>
          </div>

          <div className="px-5">
            <div className="text-xl font-black font-mono text-white wordmark-shadow leading-none">{resolvedToday}</div>
            <div className="text-[10px] text-[#e4e4e7] font-semibold mt-1 wordmark-shadow">Resolved</div>
          </div>

          {/* Secondary Action Buttons */}
          <div className="pl-5 flex items-center gap-2">
            <button
              onClick={onDownloadReport}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-sm"
              title="Download Daily Report CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#a1a1aa]" />
              <span className="hidden sm:inline">Daily Report</span>
            </button>

            <button
              onClick={onManualRefresh}
              className="btn-secondary p-1.5 text-xs shadow-sm"
              title="Refresh Tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#a1a1aa] ${isPolling ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onSeedDemo}
              className="btn-secondary px-3 py-1.5 text-xs shadow-sm"
            >
              Seed Demo
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
