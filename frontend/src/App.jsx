import React, { useState, useEffect, useCallback } from 'react';
import HeroHeader from './components/HeroHeader';
import ReportForm from './components/ReportForm';
import KanbanBoard from './components/KanbanBoard';
import AnalyticsView from './components/AnalyticsView';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [activeView, setActiveView] = useState('board'); // 'board' | 'analytics'

  // Fetch Tickets from API
  const fetchTickets = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsPolling(true);
    try {
      const res = await fetch(`${API_BASE}/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('[App] Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  }, []);

  // Initial Load & Auto-Polling every 3 seconds
  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(() => {
      fetchTickets(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Submit New Ticket (Photo + Text)
  const handleSubmitTicket = async ({ image, text_description }) => {
    setIsSubmitting(true);
    setLastSubmissionResult(null);

    const formData = new FormData();
    formData.append('text_description', text_description);
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await fetch(`${API_BASE}/submit_ticket`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setLastSubmissionResult(result);
        await fetchTickets(false);
      } else {
        alert('Failed to submit ticket. Please check backend API.');
      }
    } catch (err) {
      console.error('[App] Error submitting ticket:', err);
      alert('Error submitting ticket. Make sure backend is running on http://localhost:8000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Ticket Status via PATCH with optional custom note
  const handleUpdateStatus = async (ticketId, newStatus, customNote = null) => {
    try {
      const payload = { status: newStatus };
      if (customNote) {
        payload.note = customNote;
      }

      const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchTickets(false);
      }
    } catch (err) {
      console.error('[App] Failed to update ticket status:', err);
    }
  };

  // Download Daily Report CSV
  const handleDownloadReport = () => {
    window.open(`${API_BASE}/export_report`, '_blank');
  };

  // Seed Demo Data trigger
  const handleSeedDemo = async () => {
    try {
      await fetchTickets(true);
    } catch (err) {
      console.error('[App] Seed trigger error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 pb-16 m-0 p-0 relative">
      
      {/* Section 1 — Hero Landing Section */}
      <HeroHeader 
        tickets={tickets} 
        onSeedDemo={handleSeedDemo} 
        isPolling={isPolling}
        onManualRefresh={() => fetchTickets(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        onDownloadReport={handleDownloadReport}
      />

      {/* Main Content Area with Ambient Light Rays Layer Behind */}
      <div className="relative w-full">
        {/* Soft Faint Diagonal Light Rays Layer */}
        <div className="body-ambient-rays" />

        <main className="max-w-7xl mx-auto px-6 relative z-10">
          
          {activeView === 'board' ? (
            <>
              {/* Intake Report Form Section */}
              <div id="report-form-section" className="pt-6">
                <ReportForm 
                  onSubmitTicket={handleSubmitTicket} 
                  isLoading={isSubmitting}
                  lastResult={lastSubmissionResult}
                />
              </div>

              {/* Rich Warm Diagonal Light Beam Glow Transition */}
              <div className="section-light-beam" />

              {/* Live Kanban Board with Ambient Corner Glow Frame & Header Row Glow Wash */}
              <section className="mt-2 board-header-wash relative">
                {/* Ambient 4-Corner Glow Frame */}
                <div className="board-corner-glow-frame">
                  <div className="board-corner-glow-tl" />
                  <div className="board-corner-glow-tr" />
                  <div className="board-corner-glow-bl" />
                  <div className="board-corner-glow-br" />
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight wordmark-shadow">Active Resolution Board</h2>
                    <p className="text-xs text-[#a1a1aa] font-medium">Live polling auto-syncs escalations & status updates</p>
                  </div>
                </div>

                <div className="relative z-10">
                  <KanbanBoard 
                    tickets={tickets} 
                    onUpdateStatus={handleUpdateStatus} 
                    isLoading={isLoading}
                  />
                </div>
              </section>
            </>
          ) : (
            /* Analytics Summary Section */
            <section className="mt-6">
              <AnalyticsView tickets={tickets} />
            </section>
          )}

        </main>
      </div>

    </div>
  );
}
