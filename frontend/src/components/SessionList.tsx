import React, { useState } from 'react';
import { ScheduledSession, Student } from '../types';
import { Calendar, CheckCircle2, Clock, HelpCircle, Link, MapPin, Star, Video } from 'lucide-react';

interface SessionListProps {
  sessions: ScheduledSession[];
  buddies: Student[];
  onRateSession: (sessionId: string, scoreIncrement: number) => void;
  onCancelSession: (sessionId: string) => void;
}

export default function SessionList({ sessions, buddies, onRateSession, onCancelSession }: SessionListProps) {
  const [ratedSessions, setRatedSessions] = useState<Record<string, 'good' | 'bad' | null>>({});
  const upcoming = sessions.filter(session => session.status === 'Scheduled');
  const past = sessions.filter(session => session.status === 'Completed');

  const getBuddyName = (buddyId: string) => buddies.find(buddy => buddy.id === buddyId)?.name || 'Study Buddy';
  const getBuddyInitials = (buddyId: string) => buddies.find(buddy => buddy.id === buddyId)?.avatarSeed || 'SB';
  const handleRate = (sessionId: string, rating: 'good' | 'bad') => {
    setRatedSessions(previous => ({ ...previous, [sessionId]: rating }));
    onRateSession(sessionId, rating === 'good' ? 5 : -5);
  };

  return (
    <div className="space-y-8" id="sessions-list-container">
      <section className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm" id="upcoming-sessions-section">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" />Your Upcoming Study Sessions</h3>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" id="empty-upcoming"><Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs text-slate-500 font-medium">No sessions scheduled</p><p className="text-[10px] text-slate-400 mt-1">Go to My Chats to coordinate a session.</p></div>
        ) : (
          <div className="space-y-4" id="upcoming-sessions-grid">
            {upcoming.map(session => (
              <div key={session.id} id={`upcoming-session-card-${session.id}`} className="p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center shrink-0">{getBuddyInitials(session.buddyId)}</div>
                  <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h4 className="text-xs font-bold text-slate-900">Study with {getBuddyName(session.buddyId)}</h4><span className="text-[9px] bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full font-bold uppercase">{session.course.split(':')[0]}</span></div><p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{session.date} at {session.timeSlot}</p><p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 break-words">{session.locationType === 'Virtual' ? <><Video className="w-3.5 h-3.5 shrink-0" /><a href={`https://${session.locationDetail}`} target="_blank" rel="noreferrer" className="underline font-semibold break-all">{session.locationDetail}<Link className="inline w-2.5 h-2.5 ml-1" /></a></> : <><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="font-semibold">{session.locationDetail}</span></>}</p></div>
                </div>
                <div className="flex items-center gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-2 md:pt-0"><button type="button" onClick={() => onCancelSession(session.id)} className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">Cancel Session</button><button type="button" onClick={() => onRateSession(session.id, 0)} className="px-3.5 py-1.5 bg-slate-950 text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Mark Completed</button></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm" id="past-sessions-section">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Completed Study History & Peer Review</h3>
        {past.length === 0 ? <div className="text-center py-6 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200" id="empty-past"><HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs text-slate-500">No completed sessions logged yet</p></div> : <div className="space-y-4" id="past-sessions-grid">{past.map(session => { const rating = ratedSessions[session.id]; return <div key={session.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h4 className="text-xs font-bold">Study with {getBuddyName(session.buddyId)}</h4><p className="text-[11px] text-slate-500 mt-1">Completed: {session.date} ({session.timeSlot})</p></div>{rating ? <div className="text-xs flex items-center gap-1.5"><Star className={`w-4 h-4 ${rating === 'good' ? 'fill-slate-900' : 'text-slate-200'}`} />{rating === 'good' ? 'Awesome match!' : 'Match feedback logged.'}</div> : <div className="flex flex-col sm:flex-row sm:items-center gap-2"><span className="text-[10px] font-bold uppercase text-slate-400">Was {getBuddyName(session.buddyId)} a good study partner?</span><div className="flex gap-1.5"><button type="button" onClick={() => handleRate(session.id, 'bad')} className="px-2.5 py-1 border rounded-xl text-[10px] font-bold uppercase">No</button><button type="button" onClick={() => handleRate(session.id, 'good')} className="px-2.5 py-1 bg-slate-950 text-white rounded-xl text-[10px] font-bold uppercase">Yes</button></div></div>}</div>; })}</div>}
      </section>
    </div>
  );
}