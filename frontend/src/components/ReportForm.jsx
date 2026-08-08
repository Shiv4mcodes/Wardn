import React, { useState, useRef } from 'react';
import { UploadCloud, X, Send, ShieldCheck, CopyCheck, Check, Camera, FileText } from 'lucide-react';

export default function ReportForm({ onSubmitTicket, isLoading, lastResult }) {
  const [textDescription, setTextDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textDescription.trim()) return;

    await onSubmitTicket({
      image: selectedFile,
      text_description: textDescription
    });

    setTextDescription('');
    removeImage();
  };

  return (
    <div className="relative mb-5">
      {/* Soft Blurred Bottom Edge Glow Accent ("Lit from Below") */}
      <div className="card-bottom-glow-bar" />

      {/* Main Warm Outer Container Card (#171211 to #0d0908, zero neutral gray) */}
      <div className="warm-outer-card p-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#f97316]/15 border border-[#f97316]/30 text-[#f97316]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[#fafafa] tracking-wide">Report Incident</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 text-[#fb923c]">
            Vision + LLM Auto-Triage
          </span>
        </div>

        {/* Duplicate / Success Toast Alert */}
        {lastResult && (
          <div className="mb-5 p-4 rounded-xl border border-[#f97316]/20 bg-[#181211] text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              {lastResult.duplicate ? (
                <CopyCheck className="w-4 h-4 text-[#eab308] shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-[#22c55e] shrink-0" />
              )}
              <div>
                <div className="font-semibold text-[#fafafa]">
                  {lastResult.duplicate 
                    ? `Merged with Existing Ticket #${lastResult.id}`
                    : `New Ticket #${lastResult.id} Created & Auto-Assigned`}
                </div>
                <div className="text-[11px] text-[#a1a1aa] mt-0.5">
                  {lastResult.duplicate 
                    ? `TF-IDF Similarity Match (${(lastResult.match_score * 100).toFixed(0)}%). Total reports now: ${lastResult.reported_count}`
                    : `Assigned to ${lastResult.assignee} (${lastResult.category}) | Severity: ${lastResult.severity}`}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Upload Zone */}
          <div>
            {/* Glowing Chip Label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 text-[#fb923c] text-[11px] font-semibold uppercase tracking-wider mb-2.5 shadow-xs">
              <Camera className="w-3 h-3 text-[#f97316]" />
              <span>Attach Photo (Optional)</span>
            </div>

            {previewUrl ? (
              <div className="relative group w-full h-36 rounded-xl overflow-hidden glass-input-panel flex items-center justify-center">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover relative z-10" />
                <div className="absolute inset-0 bg-[#0a0a0a]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 rounded-xl bg-[#ef4444] text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-28 glass-input-panel flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging ? 'scale-[1.01] border-[#f97316]' : ''
                }`}
              >
                {/* Upload Icon Circle with Glowing Radial Depth */}
                <div 
                  className="p-2.5 rounded-full border border-[#f97316]/30 mb-2 relative z-10 shadow-sm"
                  style={{
                    background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.05) 70%, transparent 100%)'
                  }}
                >
                  <UploadCloud className="w-5 h-5 text-[#f97316]" />
                </div>
                <p className="text-xs text-[#d4d4d8] relative z-10">
                  <span className="text-white font-semibold">Click to upload</span> or drag and drop photo
                </p>
                <p className="text-[10px] text-[#a1a1aa] mt-0.5 relative z-10">JPG, PNG or WEBP (Max 10MB)</p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Text Description */}
          <div>
            {/* Glowing Chip Label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 text-[#fb923c] text-[11px] font-semibold uppercase tracking-wider mb-2.5 shadow-xs">
              <FileText className="w-3 h-3 text-[#f97316]" />
              <span>Issue Description</span>
            </div>

            <div className="glass-input-panel p-1">
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="Describe what's broken or needs attention (e.g. Water leaking near 2nd floor server room pipe)..."
                required
                rows={3}
                className="w-full px-3 py-2 bg-transparent text-xs text-[#fafafa] placeholder-[#71717a] resize-none transition-all outline-none border-none relative z-10"
              />
            </div>
          </div>

          {/* Primary CTA Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !textDescription.trim()}
            className="btn-primary-gradient w-full py-3 px-5 text-xs font-bold flex items-center justify-center gap-2 shadow-xl rounded-xl"
          >
            {isLoading ? (
              <span>Analyzing Issue with Wardn AI...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit & Auto-Process Ticket</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
