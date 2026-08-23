import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, MatchResult } from '../types';
import { Check, X, ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';

interface SwipeCardProps {
  userProfile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>;
  buddy: Student;
  onAccept: (buddy: Student, score: number, explanations: string[]) => void;
  onPass: (buddyId: string) => void;
  onBlock: (buddyId: string) => void;
  onReport: (buddyId: string, reason: string) => void;
}

export default function SwipeCard({
  userProfile,
  buddy,
  onAccept,
  onPass,
  onBlock,
  onReport,
}: SwipeCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate bio');
  const [reportEscalated, setReportEscalated] = useState(false);

  // Calculate matching stats dynamically
  const commonCourses = buddy.courses.filter(c => userProfile.courses.includes(c));
  const commonAvail = buddy.availability.filter(a => userProfile.availability.includes(a));
  const isStyleMatch = buddy.studyStyle === userProfile.studyStyle;
  const isLocationMatch = buddy.locationPreference === userProfile.locationPreference || 
                          buddy.locationPreference === 'Hybrid' || 
                          userProfile.locationPreference === 'Hybrid';

  // Rule-based matching engine scoring (PRD 7.1)
  const courseScore = commonCourses.length * 35; // course is highest weight
  const availScore = commonAvail.length * 8;     // availability is second weight
  const styleScore = isStyleMatch ? 15 : 0;      // study style is third
  const locationScore = isLocationMatch ? 10 : 0;

  const totalScore = Math.min(98, Math.max(45, courseScore + availScore + styleScore + locationScore));

  // Build the "Why matched" explanations
  const explanations: string[] = [];
  if (commonCourses.length > 0) {
    const courseCode = commonCourses[0].split(':')[0];
    explanations.push(`Both take ${courseCode}`);
  }
  if (commonAvail.length > 0) {
    explanations.push(`Overlapping free times (${commonAvail[0]})`);
  }
  if (isStyleMatch) {
    explanations.push(`Same style: ${buddy.studyStyle}`);
  } else {
    explanations.push(`Location matches: ${buddy.locationPreference}`);
  }

  // Trigger animations
  const handleAction = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    setTimeout(() => {
      if (direction === 'right') {
        onAccept(buddy, totalScore, explanations);
      } else {
        onPass(buddy.id);
      }
      setSwipeDirection(null);
    }, 400); // Wait for transition to complete
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportEscalated(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportEscalated(false);
      onReport(buddy.id, reportReason);
    }, 2000);
  };

  return (
    <div className="relative max-w-md mx-auto min-h-[550px]" id={`swipe-card-wrapper-${buddy.id}`}>
      <AnimatePresence mode="wait">
        {!swipeDirection && (
          <motion.div
            key={buddy.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              x: swipeDirection === 'right' ? 350 : swipeDirection === 'left' ? -350 : 0,
              rotate: swipeDirection === 'right' ? 15 : swipeDirection === 'left' ? -15 : 0,
              transition: { duration: 0.35 }
            }}
            id={`active-swipe-card-${buddy.id}`}
            className="w-full min-h-[550px] bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between hover:shadow-sm transition-shadow duration-200 relative"
          >
            {/* Top Row: Major and Match Score Badge */}
            <div className="flex justify-between items-start" id="card-header">
              <div id="card-major-box">
                <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100" id="card-major">
                  {buddy.major}
                </span>
              </div>
              <div 
                id="card-score-badge"
                className="flex flex-col items-end px-3 py-1 rounded-xl border border-slate-100 bg-slate-50 text-slate-900"
              >
                <span className="text-xs font-bold leading-none" id="card-score-num">{totalScore}% Match</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Academic Score</span>
              </div>
            </div>

            {/* Profile Avatar and Name */}
            <div className="text-center my-4" id="card-profile-section">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-2xl relative shadow-inner" id="card-avatar">
                {buddy.avatarSeed}
                {buddy.isCurrentlyFree && (
                  <span 
                    id="pulse-active-dot"
                    className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center cursor-help"
                    title="Currently free & studying now!"
                  >
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-900 mt-3 flex items-center justify-center gap-1.5" id="card-name">
                {buddy.name}
                {buddy.isCurrentlyFree && (
                  <span className="text-[9px] font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-full" id="pulse-active-text">
                    Active
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5" id="card-email">{buddy.email}</p>
            </div>

            {/* Why Matched explanation banner (PRD 7.1) */}
            <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl" id="card-reasons-box">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Why Matched
              </span>
              <div className="flex flex-wrap gap-1.5" id="card-explanations-list">
                {explanations.map((exp, idx) => (
                  <span 
                    key={idx} 
                    id={`card-exp-tag-${idx}`}
                    className="text-[10px] bg-white border border-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-lg"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>

            {/* Profile Details (Courses & preferences) */}
            <div className="space-y-3 my-4 text-xs" id="card-details-section">
              {/* Courses */}
              <div id="card-courses-container">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Taking Courses
                </span>
                <p className="text-slate-800 text-xs font-semibold leading-relaxed" id="card-courses-text">
                  {buddy.courses.map(c => c.split(':')[0]).join(', ')}
                </p>
              </div>

              {/* Bio */}
              <div id="card-bio-container">
                <p className="text-slate-600 text-xs italic leading-relaxed line-clamp-3" id="card-bio">
                  &ldquo;{buddy.bio}&rdquo;
                </p>
              </div>

              {/* Badges row */}
              <div className="flex gap-4 pt-1" id="card-badges-row">
                <div id="card-badge-style">
                  <span className="text-[9px] font-medium text-slate-400 uppercase block">Preferred Style</span>
                  <span className="text-xs text-slate-800 font-bold">{buddy.studyStyle}</span>
                </div>
                <div id="card-badge-location">
                  <span className="text-[9px] font-medium text-slate-400 uppercase block">Study Location</span>
                  <span className="text-xs text-slate-800 font-bold">{buddy.locationPreference}</span>
                </div>
              </div>
            </div>

            {/* Match & Pass Action Controls */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4" id="card-actions">
              <button
                type="button"
                id={`block-btn-${buddy.id}`}
                onClick={() => onBlock(buddy.id)}
                className="text-[10px] text-slate-400 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                title="Block this student profile"
              >
                Block
              </button>

              <div className="flex items-center gap-3" id="card-match-pass-actions">
                {/* Pass (Left) Button */}
                <button
                  type="button"
                  id={`pass-btn-${buddy.id}`}
                  onClick={() => handleAction('left')}
                  className="w-10 h-10 rounded-full border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                  title="Pass match"
                  aria-label={`Pass on ${buddy.name}`}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Match (Right) Button */}
                <button
                  type="button"
                  id={`match-btn-${buddy.id}`}
                  onClick={() => handleAction('right')}
                  className="w-11 h-11 rounded-full bg-slate-950 hover:bg-black text-white flex items-center justify-center transition-all active:scale-95"
                  title="Connect & Study!"
                  aria-label={`Connect with ${buddy.name}`}
                >
                  <Check className="w-6 h-6" />
                </button>
              </div>

              <button
                type="button"
                id={`report-btn-${buddy.id}`}
                onClick={() => setShowReportModal(true)}
                className="text-[10px] text-slate-400 hover:text-slate-950 font-medium flex items-center gap-1 transition-colors"
                title="Report inappropriate profile"
              >
                Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Report Modal Container */}
      <AnimatePresence>
        {showReportModal && (
          <div className="absolute inset-0 bg-white/95 border border-slate-200 rounded-2xl p-6 z-20 flex flex-col justify-between" id="report-modal">
            {reportEscalated ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4" id="report-success-view">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center" id="escalated-icon">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <h5 className="text-base font-bold text-slate-900" id="report-success-title">Escalated to Moderation</h5>
                <p className="text-xs text-slate-600 max-w-xs leading-relaxed" id="report-success-desc">
                  Thank you. This profile has been blocked, and your report has been escalated to the Student Safety & Moderation board. We enforce a zero-tolerance policy.
                </p>
                <div className="w-16 h-1 bg-red-100 rounded-full overflow-hidden" id="report-loading-bar">
                  <div className="h-full bg-red-600 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="flex-1 flex flex-col justify-between" id="report-form-box">
                <div className="space-y-4" id="report-form-inputs">
                  <div className="flex items-center gap-2 text-red-600" id="report-header">
                    <AlertTriangle className="w-5 h-5" />
                    <h5 className="text-sm font-bold text-slate-900">Report Academic Safety Concern</h5>
                  </div>
                  <p className="text-[11px] text-slate-500" id="report-sub">
                    You are reporting <strong className="text-slate-800">{buddy.name}</strong>. Please select the specific category to file your escalation report:
                  </p>

                  <div className="space-y-2 mt-4" id="report-categories-container">
                    {[
                      'Inappropriate bio or profile details',
                      'Not a registered university student / spam',
                      'Harassing study behaviour',
                      'Using app for dating/non-academic purposes'
                    ].map((reason) => (
                      <label
                        key={reason}
                        id={`report-label-${reason.split(' ')[0].toLowerCase()}`}
                        className={`flex items-center p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          reportReason === reason
                            ? 'border-red-500 bg-red-50/50 text-red-900 font-semibold'
                            : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={() => setReportReason(reason)}
                          className="mr-2 text-red-600 focus:ring-red-500"
                        />
                        {reason}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100" id="report-actions">
                  <button
                    type="button"
                    id="cancel-report-btn"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-report-btn"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-sm"
                  >
                    File Report
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
