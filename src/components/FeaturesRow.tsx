import React from 'react';
import { Target, Zap, ShieldCheck } from 'lucide-react';

export default function FeaturesRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="features-row-container">
      {/* Feature 1: Matching Score */}
      <div 
        id="feature-card-smart-match"
        className="p-6 bg-white border border-slate-100 rounded-3xl transition-all duration-200 hover:shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center mb-4 border border-slate-100" id="feature-icon-1">
          <Target className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2" id="feature-title-1">Smart Match Score</h3>
        <p className="text-xs text-slate-500 leading-relaxed" id="feature-desc-1">
          Our algorithm weighs course sections (40%), overlapping free slots (30%), study style (20%), and location (10%) to suggest the best peer matches.
        </p>
      </div>

      {/* Feature 2: Quick Session */}
      <div 
        id="feature-card-quick-session"
        className="p-6 bg-white border border-slate-100 rounded-3xl transition-all duration-200 hover:shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center mb-4 border border-slate-100" id="feature-icon-2">
          <Zap className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2" id="feature-title-2">Instant Study Sprints</h3>
        <p className="text-xs text-slate-500 leading-relaxed" id="feature-desc-2">
          Spotted a peer marked available right now? Tap the Quick Session pulse indicator to launch an instant 30-minute quiet focus or co-working study room.
        </p>
      </div>

      {/* Feature 3: Verified Safety */}
      <div 
        id="feature-card-verified-safety"
        className="p-6 bg-white border border-slate-100 rounded-3xl transition-all duration-200 hover:shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center mb-4 border border-slate-100" id="feature-icon-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2" id="feature-title-3">Safe & Academic Focused</h3>
        <p className="text-xs text-slate-500 leading-relaxed" id="feature-desc-3">
          Exclusively for registered student accounts. Block, report, or restrict matches at any time. No public profiles or social media linking.
        </p>
      </div>
    </div>
  );
}
