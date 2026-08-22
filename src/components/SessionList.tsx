import React, { useState } from 'react';
import { ScheduledSession, Student } from '../types';
import { CAMPUS_MAP_SPOTS, CampusSpot } from '../data/campusData';
import { 
  Calendar, Video, MapPin, CheckCircle2, Star, Clock, 
  HelpCircle, Map, Layers, RefreshCw, Compass, Info, Check, Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SessionListProps {
  sessions: ScheduledSession[];
  buddies: Student[];
  onRateSession: (sessionId: string, scoreIncrement: number) => void;
  onCancelSession: (sessionId: string) => void;
}

export default function SessionList({
  sessions,
  buddies,
  onRateSession,
  onCancelSession,
}: SessionListProps) {
  const [ratedSessions, setRatedSessions] = useState<Record<string, 'good' | 'bad' | null>>({});
  const [selectedSpotFilter, setSelectedSpotFilter] = useState<string | null>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

  const getBuddyName = (buddyId: string) => {
    return buddies.find(b => b.id === buddyId)?.name || 'Study Buddy';
  };

  const getBuddyInitials = (buddyId: string) => {
    return buddies.find(b => b.id === buddyId)?.avatarSeed || 'SB';
  };

  const handleRate = (sessionId: string, rating: 'good' | 'bad') => {
    setRatedSessions(prev => ({ ...prev, [sessionId]: rating }));
    const scoreIncrement = rating === 'good' ? 5 : -5;
    onRateSession(sessionId, scoreIncrement);
  };

  const upcoming = sessions.filter(s => s.status === 'Scheduled');
  const past = sessions.filter(s => s.status === 'Completed');

  // Count upcoming sessions at each predefined spot
  const getSessionCountAtSpot = (spotName: string) => {
    return upcoming.filter(s => s.locationType === 'In-person' && s.locationDetail === spotName).length;
  };

  // Filtered upcoming list
  const filteredUpcoming = selectedSpotFilter
    ? upcoming.filter(s => s.locationType === 'In-person' && s.locationDetail === selectedSpotFilter)
    : upcoming;

  return (
    <div className="space-y-8" id="sessions-list-container">
      {/* 1. INTERACTIVE CAMPUS MAP DASHBOARD */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="campus-map-dashboard">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4" id="map-dashboard-header">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-slate-950 animate-spin-slow" />
              Interactive Campus Study Map
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Visualize your upcoming in-person meetings. Click building pins on the map to filter.
            </p>
          </div>
          
          {selectedSpotFilter && (
            <button
              type="button"
              onClick={() => setSelectedSpotFilter(null)}
              className="self-start sm:self-auto px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Show All Spots ({upcoming.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="map-dashboard-body">
          {/* Map Vector Stage */}
          <div className="lg:col-span-2 relative bg-sky-50/50 border border-slate-100 rounded-2xl overflow-hidden h-64 md:h-80" id="map-stage">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 250" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Soft grassy campus base */}
              <rect x="0" y="0" width="500" height="250" fill="#f0fdf4" />
              
              {/* Campus Roads and Walkways */}
              <path d="M 0 50 Q 200 60 250 110 T 500 170" stroke="#f1f5f9" strokeWidth="18" strokeLinecap="round" />
              <path d="M 150 0 L 250 250" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round" />
              <path d="M 0 180 Q 250 100 500 50" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round" />
              
              {/* Central Campus Quad lawn (Circle) */}
              <circle cx="250" cy="115" r="45" fill="#bbf7d0" opacity="0.6" />
              <circle cx="250" cy="115" r="45" stroke="#86efac" strokeWidth="2.5" strokeDasharray="6 6" />
              <text x="250" y="120" fill="#22c55e" fontSize="8" fontWeight="bold" letterSpacing="1" textAnchor="middle" opacity="0.8">CAMPUS QUAD</text>

              {/* Campus Buildings (Refined Blueprint Vectors) */}
              {/* 1. Main Library Building */}
              <rect x="130" y="40" width="70" height="40" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="135" y="45" width="60" height="30" rx="3" fill="#e2e8f0" opacity="0.5" />
              <text x="165" y="63" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">MAIN LIBRARY</text>
              
              {/* 2. Science & Chemistry Building */}
              <rect x="40" y="130" width="80" height="50" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="45" y="135" width="70" height="40" rx="3" fill="#e2e8f0" opacity="0.5" />
              <text x="80" y="158" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">CHEMISTRY HALL</text>

              {/* 3. Engineering Complex */}
              <rect x="360" y="30" width="90" height="45" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="365" y="35" width="80" height="35" rx="3" fill="#e2e8f0" opacity="0.5" />
              <text x="405" y="56" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">ENGINEERING</text>

              {/* 4. Student Union Center */}
              <rect x="310" y="145" width="100" height="60" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="315" y="150" width="90" height="50" rx="3" fill="#e2e8f0" opacity="0.5" />
              <text x="360" y="178" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">STUDENT UNION</text>
            </svg>

            {/* Pulsing Coordinates Over Map */}
            {CAMPUS_MAP_SPOTS.map((spot) => {
              const activeCount = getSessionCountAtSpot(spot.name);
              const isSelected = selectedSpotFilter === spot.name;
              const isHovered = hoveredSpotId === spot.id;

              return (
                <button
                  key={spot.id}
                  type="button"
                  id={`campus-map-pin-${spot.id}`}
                  onClick={() => setSelectedSpotFilter(isSelected ? null : spot.name)}
                  onMouseEnter={() => setHoveredSpotId(spot.id)}
                  onMouseLeave={() => setHoveredSpotId(null)}
                  style={{ left: `${spot.coords.x}%`, top: `${spot.coords.y}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 transition-all"
                  aria-label={`Filter sessions at ${spot.shortName}`}
                >
                  {/* Dynamic Pulsing Rings */}
                  <span className={`absolute inset-0 rounded-full w-8 h-8 -m-2 opacity-30 ${
                    activeCount > 0 ? 'animate-ping bg-slate-950' : 'bg-slate-400'
                  }`} />
                  
                  {/* Pin Circle */}
                  <div className={`w-6 h-6 rounded-full border shadow-md flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-white text-white scale-125 ring-4 ring-slate-950/25'
                      : isHovered
                      ? 'bg-slate-900 border-white text-white scale-115'
                      : activeCount > 0
                      ? 'bg-white border-slate-950 text-slate-950 scale-110'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <MapPin className={`w-3 h-3 ${isSelected || isHovered ? 'fill-current' : ''}`} />

                    {/* Session Count Indicator Badge */}
                    {activeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-slate-950 border border-white text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </div>

                  {/* Desktop Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-950 text-white rounded-lg p-2 shadow-xl pointer-events-none z-30 min-w-[120px]">
                    <span className="text-[9px] font-black whitespace-nowrap block">{spot.shortName}</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">{activeCount} Upcoming Study Session{activeCount !== 1 ? 's' : ''}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Spots Directory */}
          <div className="flex flex-col bg-slate-50/40 border border-slate-100 rounded-2xl p-4 divide-y divide-slate-100" id="spots-directory">
            <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 pb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Campus Locations
            </h4>

            <div className="flex-1 overflow-y-auto space-y-2 pt-2.5 max-h-64" id="spots-items-wrapper">
              {CAMPUS_MAP_SPOTS.map((spot) => {
                const count = getSessionCountAtSpot(spot.name);
                const isSelected = selectedSpotFilter === spot.name;
                const isHovered = hoveredSpotId === spot.id;

                return (
                  <button
                    key={spot.id}
                    type="button"
                    id={`spot-item-${spot.id}`}
                    onClick={() => setSelectedSpotFilter(isSelected ? null : spot.name)}
                    onMouseEnter={() => setHoveredSpotId(spot.id)}
                    onMouseLeave={() => setHoveredSpotId(null)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-slate-950 text-white border-slate-950'
                        : isHovered
                        ? 'bg-slate-100 border-slate-200'
                        : 'bg-white border-slate-100 hover:border-slate-150'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                      isSelected ? 'bg-white' : spot.color.split(' ')[0]
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold truncate block">{spot.shortName}</span>
                        {count > 0 && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {count} ACTIVE
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] block mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {spot.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING SESSIONS LIST */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="upcoming-sessions-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4" id="upcoming-header">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-slate-900" />
            Your Upcoming Study Sessions
            {selectedSpotFilter && (
              <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded-full">
                Filtered: {selectedSpotFilter.split(' (')[0]}
              </span>
            )}
          </h3>
        </div>

        {filteredUpcoming.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" id="empty-upcoming">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No sessions scheduled for this location</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
              {selectedSpotFilter 
                ? "Try resetting the campus map filter to view all scheduled virtual and in-person slots."
                : "Go to the My Chats tab to coordinate a virtual or in-person session with your matches."}
            </p>
          </div>
        ) : (
          <div className="space-y-4" id="upcoming-sessions-grid">
            {filteredUpcoming.map((session) => {
              const buddyName = getBuddyName(session.buddyId);
              const initials = getBuddyInitials(session.buddyId);
              
              // Match predefined campus spot to draw corresponding visual badge
              const matchedSpot = CAMPUS_MAP_SPOTS.find(spot => spot.name === session.locationDetail);

              return (
                <div
                  key={session.id}
                  id={`upcoming-session-card-${session.id}`}
                  className="p-4 border border-slate-100 rounded-2xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all duration-150"
                >
                  <div className="flex items-start gap-3.5" id={`session-left-${session.id}`}>
                    <div className="w-10 h-10 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div id={`session-details-${session.id}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900">Study with {buddyName}</h4>
                        <span className="text-[9px] bg-slate-50 text-slate-900 border border-slate-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {session.course.split(':')[0]}
                        </span>

                        {/* Location spot badge representing selected popular spot */}
                        {matchedSpot && (
                          <span className={`text-[8px] border font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${matchedSpot.color}`}>
                            <MapPin className="w-2.5 h-2.5" />
                            {matchedSpot.shortName} Campus Spot
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 font-medium mt-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {session.date} at {session.timeSlot}
                      </p>
                      
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        {session.locationType === 'Virtual' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                            <a
                              href={`https://${session.locationDetail}`}
                              target="_blank"
                              rel="referrer"
                              className="text-slate-950 underline font-semibold hover:text-black flex items-center gap-0.5"
                              id={`session-link-${session.id}`}
                            >
                              {session.locationDetail}
                              <Link className="w-2.5 h-2.5" />
                            </a>
                            <span className="text-[9px] text-slate-400">(Click to join room)</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                            <span className="font-semibold text-slate-800">{session.locationDetail}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0" id={`session-actions-${session.id}`}>
                    <button
                      type="button"
                      id={`cancel-session-btn-${session.id}`}
                      onClick={() => onCancelSession(session.id)}
                      className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors"
                    >
                      Cancel Session
                    </button>
                    <button
                      type="button"
                      id={`finish-session-btn-${session.id}`}
                      onClick={() => onRateSession(session.id, 0)}
                      className="px-3.5 py-1.5 bg-slate-950 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-none transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-200" />
                      Mark Completed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PAST SESSIONS REVIEW HISTORY */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="past-sessions-section">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-slate-900" />
          Completed Study History & Peer Review
        </h3>

        {past.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200" id="empty-past">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No completed sessions logged yet</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Completed study session feedback helps optimize future partner matches.
            </p>
          </div>
        ) : (
          <div className="space-y-4" id="past-sessions-grid">
            {past.map((session) => {
              const buddyName = getBuddyName(session.buddyId);
              const isRated = ratedSessions[session.id] !== undefined;
              const feedbackValue = ratedSessions[session.id];

              return (
                <div
                  key={session.id}
                  id={`past-session-card-${session.id}`}
                  className="p-4 border border-slate-100 rounded-2xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm"
                >
                  <div id={`past-left-${session.id}`}>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">Study with {buddyName}</h4>
                      <span className="text-[9px] bg-slate-50 text-slate-900 border border-slate-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {session.course.split(':')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Completed: {session.date} ({session.timeSlot})
                    </p>
                  </div>

                  <div className="border-t md:border-t-0 pt-2 md:pt-0" id={`past-feedback-${session.id}`}>
                    {isRated ? (
                      <div className="text-xs font-medium flex items-center gap-1.5" id={`rated-feedback-${session.id}`}>
                        <Star className={`w-4 h-4 ${feedbackValue === 'good' ? 'text-slate-900 fill-slate-900' : 'text-slate-200'}`} />
                        <span className={feedbackValue === 'good' ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                          {feedbackValue === 'good' ? 'Awesome match! Match score weights enhanced.' : 'Match feedback logged.'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2" id={`rating-prompt-box-${session.id}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          Was {buddyName} a good study partner?
                        </span>
                        <div className="flex items-center gap-1.5" id={`rating-buttons-${session.id}`}>
                          <button
                            type="button"
                            id={`rate-bad-btn-${session.id}`}
                            onClick={() => handleRate(session.id, 'bad')}
                            className="px-2.5 py-1 border border-slate-100 hover:bg-slate-50 rounded-xl text-[10px] text-slate-900 font-bold uppercase tracking-wider transition-colors"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            id={`rate-good-btn-${session.id}`}
                            onClick={() => handleRate(session.id, 'good')}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
