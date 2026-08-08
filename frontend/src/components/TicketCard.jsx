import React, { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, ChevronRight, UserCheck, 
  MapPin, X, Check, CopyCheck, AlertTriangle, Footprints, Play
} from 'lucide-react';
import { getImageUrl } from '../config';

const ESCALATION_THRESHOLD_SECONDS = 45;

export default function TicketCard({ ticket, onUpdateStatus }) {
  const [secondsRemaining, setSecondsRemaining] = useState(ESCALATION_THRESHOLD_SECONDS);
  const [showTrailModal, setShowTrailModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationText, setSimulationText] = useState('');

  // Live Escalation Countdown calculation
  useEffect(() => {
    if (ticket.status === 'RESOLVED' || ticket.status === 'VERIFIED') return;

    const updateCountdown = () => {
      const lastUpdatedDate = new Date(ticket.last_updated);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - lastUpdatedDate) / 1000);
      const remaining = Math.max(0, ESCALATION_THRESHOLD_SECONDS - elapsedSeconds);
      setSecondsRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [ticket.last_updated, ticket.status]);

  const isCompleted = ticket.status === 'RESOLVED' || ticket.status === 'VERIFIED';
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / ESCALATION_THRESHOLD_SECONDS) * 100));

  // Simulate Field Update Handler
  const handleSimulateFieldUpdate = () => {
    if (isSimulating) return;

    if (ticket.status === 'ASSIGNED') {
      setIsSimulating(true);
      setSimulationText('Technician en route to site...');
      setTimeout(() => {
        onUpdateStatus(ticket.id, 'IN_PROGRESS', `Field update simulated: Technician (${ticket.assignee}) en route to site.`);
        setIsSimulating(false);
      }, 3000);
    } else if (ticket.status === 'IN_PROGRESS') {
      setIsSimulating(true);
      setSimulationText(`Issue being fixed by ${ticket.assignee}...`);
      setTimeout(() => {
        onUpdateStatus(ticket.id, 'RESOLVED', `Field update simulated: Marked resolved by ${ticket.assignee}.`);
        setIsSimulating(false);
      }, 3000);
    } else if (ticket.status === 'RESOLVED') {
      onUpdateStatus(ticket.id, 'VERIFIED', `Field update simulated: Verified & closed.`);
    }
  };

  // Severity Dot & Text Color
  const getSeverityInfo = (sev) => {
    switch (sev) {
      case 'HIGH': return { dot: 'bg-[#ef4444]', text: 'text-[#ef4444]' };
      case 'MEDIUM': return { dot: 'bg-[#eab308]', text: 'text-[#eab308]' };
      case 'LOW': return { dot: 'bg-[#22c55e]', text: 'text-[#22c55e]' };
      default: return { dot: 'bg-[#a1a1aa]', text: 'text-[#a1a1aa]' };
    }
  };

  const sevInfo = getSeverityInfo(ticket.severity);

  return (
    <div className="relative mb-4">
      {/* Soft Blurred Bottom-Edge Glow Accent ("Lit from Below") */}
      <div className="ticket-card-bottom-glow-bar" />

      {/* Frosted Warm Glassmorphic Ticket Card (#1a1210 to #0f0b0a) */}
      <div 
        className={`glass-ticket-card p-4.5 rounded-2xl relative z-10 cursor-pointer overflow-hidden ${
          ticket.escalated ? 'border-l-2 border-l-[#ef4444]' : ''
        }`}
        onClick={() => setShowTrailModal(true)}
      >
        
        {/* Header Row: Category (Bright White) & Right-Aligned Severity / Duplicate */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#fafafa] capitalize tracking-wide">{ticket.category}</span>
            <span className="text-[11px] font-mono text-[#a1a1aa]">#{ticket.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Duplicate Count Tag */}
            {ticket.reported_count > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f97316]/15 border border-[#f97316]/30 text-[#fb923c]">
                Reported {ticket.reported_count}x
              </span>
            )}

            {/* Severity Small Solid Dot + High Contrast Text */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              <span className={`w-2 h-2 rounded-full ${sevInfo.dot} shadow-xs`} />
              <span className={sevInfo.text}>{ticket.severity}</span>
            </div>
          </div>
        </div>

        {/* Image Preview Thumbnail if available */}
        {ticket.image_path && (
          <div className="mb-3 rounded-xl bg-[#0d0908] border border-[#f97316]/15 overflow-hidden h-28 shadow-inner">
            <img 
              src={getImageUrl(ticket.image_path)} 
              alt="Ticket Evidence" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Description (Near White High Contrast) */}
        <p className="text-xs text-[#f4f4f5] font-normal line-clamp-2 leading-relaxed mb-3">
          {ticket.description}
        </p>

        {/* Location & Assignee (Warm Tinted Divider Line: rgba(249,115,22,0.15)) */}
        <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-3 pt-2.5 border-t border-[#f97316]/15">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#fb923c]/70" />
            <span className="truncate max-w-[130px]">{ticket.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#fb923c]/70" />
            <span className="text-[#fafafa] font-medium">{ticket.assignee}</span>
          </div>
        </div>

        {/* Alert / Escalation Box: 2px bright red left border, background #1a1112, border 1px solid #3f1719, text #ef4444 */}
        {!isCompleted && (
          <div className="mb-3">
            {ticket.escalated ? (
              <div className="border-l-2 border-l-[#ef4444] bg-[#1a1112] border border-[#3f1719] text-[#ef4444] px-3 py-2 text-xs rounded-xl font-semibold flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#ef4444]" />
                  AUTO-ESCALATED (UNRESOLVED)
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#a1a1aa]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#fb923c]/70" />
                    Auto-Escalates in:
                  </span>
                  <span className="font-mono text-[#fafafa] font-semibold">{secondsRemaining}s</span>
                </div>
                <div className="w-full h-1 bg-[#120e10] rounded-full overflow-hidden border border-[#f97316]/15">
                  <div 
                    className="h-full bg-[#f97316] transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Secondary Action: View Decision Trail (Warm Dark Gradient #2a1a12 -> #1a1210) */}
        <div className="mb-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowTrailModal(false); setShowTrailModal(true); }}
            className="btn-trail-warm w-full py-1.5 text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-xs"
          >
            <Footprints className="w-3.5 h-3.5 text-[#fb923c]/70" />
            <span>View Decision Trail</span>
          </button>
        </div>

        {/* Primary Action: Simulate Field Update */}
        {!isCompleted && (
          <div className="pt-2 border-t border-[#f97316]/15" onClick={(e) => e.stopPropagation()}>
            {isSimulating ? (
              <div className="py-2 px-3 rounded-xl bg-[#1d1412] border border-[#f97316]/30 text-[#f97316] text-xs font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                <span>{simulationText}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimulateFieldUpdate}
                className="btn-primary-gradient w-full py-2 text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-md"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate Field Update</span>
              </button>
            )}
          </div>
        )}

        {/* Verify & Close Action (Warm Green Gradient #1a2418 -> #12160f) */}
        {ticket.status === 'RESOLVED' && (
          <div className="pt-2 border-t border-[#f97316]/15" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleSimulateFieldUpdate}
              className="btn-verify-warm w-full py-1.5 text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Verify & Close Ticket</span>
            </button>
          </div>
        )}

      </div>

      {/* Decision Trail Modal */}
      {showTrailModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/85 p-4 backdrop-blur-sm"
          onClick={() => setShowTrailModal(false)}
        >
          <div 
            className="bg-[#171211] border border-[#f97316]/25 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Small-Scale Warm Gradient Band */}
            <div className="modal-header-band p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Footprints className="w-4.5 h-4.5 text-[#f97316]" />
                <h3 className="text-sm font-bold text-[#fafafa]">Automated Decision Trail</h3>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#0d0908] text-[#fb923c] border border-[#f97316]/30">
                  #{ticket.id}
                </span>
              </div>
              <button
                onClick={() => setShowTrailModal(false)}
                className="p-1 text-[#a1a1aa] hover:text-[#fafafa] transition-colors rounded-lg hover:bg-[#f97316]/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Ticket Context Overview */}
              <div className="p-3.5 rounded-xl bg-[#0d0908] border border-[#f97316]/20 text-xs space-y-1">
                <div className="text-[#fafafa] font-semibold">{ticket.description}</div>
                <div className="flex items-center gap-3 text-[#a1a1aa] pt-1 text-[11px]">
                  <span>Category: <strong className="text-[#fafafa] capitalize">{ticket.category}</strong></span>
                  <span>Assignee: <strong className="text-[#fafafa]">{ticket.assignee}</strong></span>
                  <span>Severity: <strong className="text-[#fafafa]">{ticket.severity}</strong></span>
                </div>
              </div>

              {/* Decision Trail Vertical Timeline */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-px before:bg-[#f97316]/20">
                {ticket.decision_trail && ticket.decision_trail.length > 0 ? (
                  ticket.decision_trail.map((step, idx) => {
                    const isWarning = step.type === 'warning' || step.step.includes('Escalation');

                    return (
                      <div key={idx} className="relative flex items-start gap-3 pl-0.5">
                        
                        {/* Step Indicator Dot */}
                        <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                          isWarning ? 'bg-[#1a1112] border-[#ef4444] text-[#ef4444]' : 'bg-[#0d0908] border-[#22c55e]/40 text-[#22c55e]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`} />
                        </div>

                        {/* Step Content */}
                        <div className={`flex-1 p-3 rounded-xl border text-xs ${
                          isWarning ? 'bg-[#1a1112] border-[#ef4444]/40 text-[#ef4444]' : 'bg-[#0d0908] border-[#f97316]/15 text-[#fafafa]'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[#fafafa] text-xs">{step.step}</span>
                            <span className="font-mono text-[10px] text-[#a1a1aa]">
                              {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-[#a1a1aa] font-normal">
                            {step.detail}
                          </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-[#a1a1aa] text-center py-4">No decision trail records found.</div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-[#f97316]/20 bg-[#171211] flex justify-end shrink-0">
              <button
                onClick={() => setShowTrailModal(false)}
                className="btn-trail-warm px-3.5 py-1.5 text-xs font-semibold rounded-xl"
              >
                Close Trail
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
