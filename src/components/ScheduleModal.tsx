import React, { useState, useEffect } from 'react';
import { Student, ScheduledSession } from '../types';
import { X, Calendar, Video, MapPin, Zap, Clock, Info } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddy: Student | null;
  pod?: StudyPod | null;
  userProfile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>;
  isQuickSessionMode: boolean;
  onConfirmSchedule: (session: Omit<ScheduledSession, 'id' | 'status'>) => void;
}

import { StudyPod } from '../types';

export default function ScheduleModal({
  isOpen,
  onClose,
  buddy,
  pod,
  userProfile,
  isQuickSessionMode,
  onConfirmSchedule,
}: ScheduleModalProps) {
  const [course, setCourse] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [locationType, setLocationType] = useState<'Virtual' | 'In-person'>('Virtual');
  const [locationDetail, setLocationDetail] = useState('');

  // Auto-fill fields based on buddy, pod & mode
  useEffect(() => {
    if (pod) {
      setCourse(pod.course);
      setDate("Tomorrow");
      setTimeSlot("Afternoon (2-4 PM)");
      setLocationType("Virtual");
      setLocationDetail("meet.google.com/pod-" + Math.random().toString(36).substring(2, 7));
    } else if (buddy) {
      // Find a common course
      const shared = buddy.courses.filter(c => userProfile.courses.includes(c));
      setCourse(shared[0] || buddy.courses[0] || '');

      // Find common availability
      const sharedAvail = buddy.availability.filter(a => userProfile.availability.includes(a));
      
      if (isQuickSessionMode) {
        setDate("Today");
        setTimeSlot("Right Now (30-min sprint)");
        setLocationType("Virtual");
        setLocationDetail("meet.google.com/co-working-" + Math.random().toString(36).substring(2, 7));
      } else {
        setDate("Tomorrow");
        setTimeSlot(sharedAvail[0] || buddy.availability[0] || "Mon Morning");
        setLocationType(buddy.locationPreference === 'Virtual' ? 'Virtual' : 'In-person');
        setLocationDetail(
          buddy.locationPreference === 'Virtual'
            ? "meet.google.com/study-" + Math.random().toString(36).substring(2, 7)
            : ""
        );
      }
    }
  }, [buddy, pod, isQuickSessionMode, userProfile]);

  const handleLocationTypeChange = (type: 'Virtual' | 'In-person') => {
    setLocationType(type);
    if (type === 'Virtual') {
      const pfx = pod ? 'pod' : 'study';
      setLocationDetail(`meet.google.com/${pfx}-` + Math.random().toString(36).substring(2, 7));
    } else {
      setLocationDetail('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buddy && !pod) return;

    if (pod) {
      onConfirmSchedule({
        podId: pod.id,
        course,
        date,
        timeSlot,
        locationType,
        locationDetail
      });
    } else if (buddy) {
      onConfirmSchedule({
        buddyId: buddy.id,
        course,
        date,
        timeSlot,
        locationType,
        locationDetail
      });
    }
    onClose();
  };

  if (!isOpen || (!buddy && !pod)) return null;

  // Compute shared availability to display as suggestions (PRD 7.3)
  const sharedAvail = buddy ? buddy.availability.filter(a => userProfile.availability.includes(a)) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="schedule-modal-overlay">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md overflow-hidden shadow-xl" id="schedule-modal-card">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white" id="schedule-modal-header">
          <div className="flex items-center gap-2" id="schedule-modal-title-box">
            {isQuickSessionMode ? (
              <Zap className="w-5 h-5 text-slate-950 fill-slate-900" />
            ) : (
              <Calendar className="w-5 h-5 text-slate-950" />
            )}
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              {pod ? `Schedule Pod Session: ${pod.name}` : isQuickSessionMode ? 'Launch Quick 30-min co-study' : 'Propose Peer Study Session'}
            </h4>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs" id="schedule-proposal-form">
          {/* Quick session info banner */}
          {isQuickSessionMode && buddy && (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex items-start gap-2.5" id="quick-session-banner">
              <Zap className="w-4 h-4 text-slate-950 shrink-0 mt-0.5" />
              <div id="quick-banner-text">
                <span className="font-bold text-slate-950 block">Instant Session Overlap</span>
                <span className="text-[10px] text-slate-500 leading-relaxed block mt-0.5">
                  Both you and {buddy.name} are free right now! Launches an immediate 30-minute co-working space.
                </span>
              </div>
            </div>
          )}

          {/* Group study pod banner */}
          {pod && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5" id="pod-info-banner">
              <Info className="w-4 h-4 text-slate-950 shrink-0 mt-0.5" />
              <div id="pod-banner-text">
                <span className="font-bold text-slate-950 block">Group Pod Session Info</span>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                  This session will be scheduled for all members of the <strong className="font-bold">{pod.name}</strong> study pod (focused on {pod.style}).
                </p>
              </div>
            </div>
          )}

          {/* Smart overlapping slot indicator */}
          {!isQuickSessionMode && !pod && buddy && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5" id="smart-overlap-banner">
              <Info className="w-4 h-4 text-slate-950 shrink-0 mt-0.5" />
              <div id="smart-banner-text">
                <span className="font-bold text-slate-950 block">Overlapping Availability Suggestion</span>
                {sharedAvail.length > 0 ? (
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                    We suggest scheduling on <strong className="font-bold">{sharedAvail.join(', ')}</strong> as both of you listed these slots!
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                    No exact overlapping slots found, but {buddy.name} is generally free during: {buddy.availability.slice(0, 3).join(', ')}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Study Target Course */}
          <div className="space-y-1.5" id="schedule-field-course">
            <label className="font-bold text-slate-900 uppercase tracking-wider">Course / Section</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
            >
              {buddy.courses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3" id="schedule-datetime-fields">
            {/* Date Selection */}
            <div className="space-y-1.5" id="schedule-field-date">
              <label className="font-bold text-slate-900 uppercase tracking-wider">Study Date</label>
              <input
                type="text"
                required
                disabled={isQuickSessionMode}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Wed, August 26"
                className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-1.5" id="schedule-field-time">
              <label className="font-bold text-slate-900 uppercase tracking-wider">Time Block</label>
              {isQuickSessionMode ? (
                <input
                  type="text"
                  required
                  disabled
                  value={timeSlot}
                  className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              ) : (
                <select
                  required
                  value={["Morning", "Afternoon", "Evening", "Night"].includes(timeSlot) ? timeSlot : ""}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
                >
                  <option value="" disabled>Select Time Block...</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  {!["Morning", "Afternoon", "Evening", "Night"].includes(timeSlot) && timeSlot && (
                    <option value={timeSlot}>{timeSlot}</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Location Type Selector */}
          <div className="space-y-1.5" id="schedule-field-loctype">
            <label className="font-bold text-slate-900 uppercase tracking-wider">Session Location Type</label>
            <div className="grid grid-cols-2 gap-2" id="loctype-buttons">
              <button
                type="button"
                id="loctype-virtual-btn"
                disabled={isQuickSessionMode}
                onClick={() => handleLocationTypeChange('Virtual')}
                className={`py-2 px-3 rounded-xl border text-center font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  locationType === 'Virtual'
                    ? 'border-slate-950 bg-slate-50 text-slate-900'
                    : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Virtual Room
              </button>
              <button
                type="button"
                id="loctype-inperson-btn"
                disabled={isQuickSessionMode}
                onClick={() => handleLocationTypeChange('In-person')}
                className={`py-2 px-3 rounded-xl border text-center font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  locationType === 'In-person'
                    ? 'border-slate-950 bg-slate-50 text-slate-900'
                    : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                In-person Spot
              </button>
            </div>
          </div>

          {/* Location Details/Suggest list */}
          <div className="space-y-2" id="schedule-field-locdetail">
            <label className="font-bold text-slate-900 uppercase tracking-wider block">
              {locationType === 'Virtual' ? 'Meeting Room URL' : 'Campus Study Location'}
            </label>
            {locationType === 'Virtual' ? (
              <input
                type="text"
                required
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="Google Meet or Discord invite"
                className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
              />
            ) : (
              <input
                type="text"
                required
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g. Science Library Room 204, Coffee Shop..."
                className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
              />
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2" id="schedule-submit-footer">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-50 text-slate-500 rounded-xl font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-schedule-btn"
              className="px-5 py-2 bg-slate-950 hover:bg-black text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
            >
              {isQuickSessionMode ? 'Book Instant Session' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
