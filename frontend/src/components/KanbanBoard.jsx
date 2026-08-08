import React from 'react';
import TicketCard from './TicketCard';
import { UserCheck, Wrench, CheckCircle2, ShieldCheck, Inbox } from 'lucide-react';

const COLUMNS = [
  { 
    id: 'ASSIGNED', 
    title: 'Assigned', 
    icon: UserCheck,
    accentGradient: 'linear-gradient(90deg, #f97316 0%, rgba(249, 115, 22, 0) 100%)',
    iconColor: 'text-[#f97316]'
  },
  { 
    id: 'IN_PROGRESS', 
    title: 'In Progress', 
    icon: Wrench,
    accentGradient: 'linear-gradient(90deg, #eab308 0%, rgba(234, 179, 8, 0) 100%)',
    iconColor: 'text-[#eab308]'
  },
  { 
    id: 'RESOLVED', 
    title: 'Resolved', 
    icon: CheckCircle2,
    accentGradient: 'linear-gradient(90deg, #22c55e 0%, rgba(34, 197, 94, 0) 100%)',
    iconColor: 'text-[#22c55e]'
  },
  { 
    id: 'VERIFIED', 
    title: 'Verified', 
    icon: ShieldCheck,
    accentGradient: 'linear-gradient(90deg, #3b82f6 0%, rgba(59, 130, 246, 0) 100%)',
    iconColor: 'text-[#3b82f6]'
  },
];

export default function KanbanBoard({ tickets, onUpdateStatus, isLoading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {COLUMNS.map((col) => {
        const ColumnIcon = col.icon;
        const columnTickets = tickets.filter((t) => t.status === col.id);

        return (
          <div key={col.id} className="flex flex-col min-h-[520px] bg-[#141417] p-4 rounded-md border border-[#222227] shadow-sm relative overflow-hidden">
            
            {/* Subtle Column Accent Line at Top */}
            <div 
              className="absolute top-0 left-0 right-0 h-[2px]" 
              style={{ background: col.accentGradient }} 
            />

            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#222227]">
              <div className="flex items-center gap-2">
                <ColumnIcon className={`w-4 h-4 ${col.iconColor}`} />
                <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">{col.title}</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0a0a0a] text-[#fafafa] border border-[#222227]">
                {columnTickets.length}
              </span>
            </div>

            {/* Column Content Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
              {isLoading && columnTickets.length === 0 ? (
                // Skeleton Loader
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-md bg-[#18181c] border border-[#222227] animate-pulse" />
                  ))}
                </div>
              ) : columnTickets.length === 0 ? (
                // Empty State
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#222227] bg-[#0d0d0f] rounded-md">
                  <Inbox className="w-6 h-6 text-[#52525b] mb-1.5" />
                  <p className="text-xs font-medium text-[#71717a]">No {col.title.toLowerCase()} tickets</p>
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onUpdateStatus={onUpdateStatus}
                  />
                ))
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
