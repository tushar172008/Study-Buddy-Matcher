import React, { useState } from 'react';
import { Student, StudyPod, StudyStyle, ScheduledSession } from '../types';
import { Users, Plus, Check, X, UserPlus, LogOut, Calendar, Clock, AlertCircle, Sparkles, BookOpen, ChevronRight, Video, MapPin } from 'lucide-react';

interface StudyPodsPanelProps {
  userProfile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>;
  matchedBuddies: Student[];
  allBuddies: Student[];
  pods: StudyPod[];
  scheduledSessions: ScheduledSession[];
  onCreatePod: (name: string, course: string, description: string, style: StudyStyle, maxMembers: number) => void;
  onJoinRequest: (podId: string) => void;
  onLeavePod: (podId: string) => void;
  onAcceptRequest: (podId: string, studentId: string) => void;
  onDeclineRequest: (podId: string, studentId: string) => void;
  onInviteBuddy: (podId: string, studentId: string) => void;
  onScheduleForPod: (pod: StudyPod) => void;
  showToast: (message: string, type: 'success' | 'info') => void;
}

const STUDY_STYLES: StudyStyle[] = ['Quiet Focus', 'Discussion-based', 'Active Recall', 'Problem Solving'];

export default function StudyPodsPanel({
  userProfile,
  matchedBuddies,
  allBuddies,
  pods,
  scheduledSessions,
  onCreatePod,
  onJoinRequest,
  onLeavePod,
  onAcceptRequest,
  onDeclineRequest,
  onInviteBuddy,
  onScheduleForPod,
  showToast,
}: StudyPodsPanelProps) {
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create form state
  const [podName, setPodName] = useState('');
  const [podCourse, setPodCourse] = useState(userProfile.courses[0] || '');
  const [podDesc, setPodDesc] = useState('');
  const [podStyle, setPodStyle] = useState<StudyStyle>('Quiet Focus');
  const [podMaxMembers, setPodMaxMembers] = useState(4); // Default to 4 (as requested 3-4)

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podName.trim() || !podDesc.trim()) {
      showToast("Please fill out all fields.", "info");
      return;
    }
    onCreatePod(podName, podCourse, podDesc, podStyle, podMaxMembers);
    setPodName('');
    setPodDesc('');
    setIsCreating(false);
  };

  const getStudentById = (id: string): Student => {
    if (id === 'me') {
      return {
        id: 'me',
        name: userProfile.name,
        email: userProfile.email,
        major: userProfile.major,
        courses: userProfile.courses,
        studyStyle: userProfile.studyStyle,
        locationPreference: userProfile.locationPreference,
        availability: userProfile.availability,
        bio: userProfile.bio,
        isCurrentlyFree: false,
        avatarSeed: 'ME'
      };
    }
    return allBuddies.find(b => b.id === id) || {
      id,
      name: 'Unknown Student',
      email: '',
      major: 'Undeclared',
      courses: [],
      studyStyle: 'Quiet Focus',
      locationPreference: 'Hybrid',
      availability: [],
      bio: '',
      isCurrentlyFree: false,
      avatarSeed: '??'
    };
  };

  // Separate pods
  const myJoinedPods = pods.filter(p => p.memberIds.includes('me'));
  const browsePods = pods.filter(p => 
    !p.memberIds.includes('me') && 
    userProfile.courses.includes(p.course)
  );

  const activePod = pods.find(p => p.id === selectedPodId);

  // Filter matched buddies who are NOT currently in the selected pod
  const potentialInvites = activePod 
    ? matchedBuddies.filter(b => !activePod.memberIds.includes(b.id) && !activePod.pendingRequestIds.includes(b.id))
    : [];

  // Find scheduled sessions for active pod
  const podSessions = activePod
    ? scheduledSessions.filter(s => s.podId === activePod.id && s.status === 'Scheduled')
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs" id="pods-panel-container">
      {/* Left Pane - Listing / Creator */}
      <div className="lg:col-span-5 space-y-6" id="pods-left-pane">
        
        {/* Create a Study Pod Panel Trigger */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6" id="pods-creator-trigger-card">
          {!isCreating ? (
            <div className="flex items-center justify-between" id="pods-trigger-inactive">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Need a regular Study Group?</h3>
                <p className="text-[11px] text-slate-400 mt-1">Form a small study pod (3-4 people) for active course collaboration.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="p-3 bg-slate-950 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-1 shrink-0 transition-colors"
                id="start-create-pod-btn"
              >
                <Plus className="w-4 h-4" />
                <span className="uppercase tracking-wider text-[10px] pr-1">Create Pod</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4" id="create-pod-form">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="create-pod-header">
                <span className="font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-900" /> Create Study Pod
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-950 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5" id="field-pod-name">
                <label className="font-bold text-slate-900 uppercase tracking-wider">Pod Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chem II Exam Avengers"
                  value={podName}
                  onChange={(e) => setPodName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" id="field-pod-meta">
                <div className="space-y-1.5" id="field-pod-course">
                  <label className="font-bold text-slate-900 uppercase tracking-wider">Course Focus</label>
                  <select
                    value={podCourse}
                    onChange={(e) => setPodCourse(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
                  >
                    {userProfile.courses.map((c) => (
                      <option key={c} value={c}>{c.split(':')[0]}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5" id="field-pod-max">
                  <label className="font-bold text-slate-900 uppercase tracking-wider">Max Group Size</label>
                  <select
                    value={podMaxMembers}
                    onChange={(e) => setPodMaxMembers(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
                  >
                    <option value={3}>3 Peers (Intimate)</option>
                    <option value={4}>4 Peers (Recommended)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3" id="field-pod-style">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 uppercase tracking-wider">Primary Study Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDY_STYLES.map((style) => (
                      <button
                        type="button"
                        key={style}
                        onClick={() => setPodStyle(style)}
                        className={`py-1.5 px-2 rounded-xl border text-[10px] text-center font-bold uppercase tracking-wider transition-all ${
                          podStyle === style
                            ? 'border-slate-950 bg-slate-50 text-slate-900'
                            : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-white'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5" id="field-pod-desc">
                <label className="font-bold text-slate-900 uppercase tracking-wider">Study Goals & Bio</label>
                <textarea
                  required
                  rows={2}
                  placeholder="What is the study schedule and expectation?"
                  value={podDesc}
                  onChange={(e) => setPodDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2" id="create-pod-actions">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 hover:bg-slate-50 text-slate-500 rounded-xl font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-950 hover:bg-black text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
                  id="confirm-create-pod-btn"
                >
                  Launch Pod
                </button>
              </div>
            </form>
          )}
        </div>

        {/* My Joined Pods */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6" id="my-joined-pods-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-slate-950" />
            Your Study Pods
          </h3>

          {myJoinedPods.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" id="empty-my-pods">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">You are not in any study pods yet</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                Create a pod above or request to join active campus pods in your courses.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5" id="my-pods-list">
              {myJoinedPods.map((pod) => {
                const isCreator = pod.creatorId === 'me';
                const courseCode = pod.course.split(':')[0];
                const isSelected = selectedPodId === pod.id;
                return (
                  <button
                    key={pod.id}
                    type="button"
                    onClick={() => setSelectedPodId(pod.id)}
                    className={`w-full text-left p-3.5 border rounded-2xl transition-all flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'border-slate-950 bg-slate-50/80 shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-sm bg-white'
                    }`}
                    id={`joined-pod-item-${pod.id}`}
                  >
                    <div className="truncate" id={`joined-pod-meta-${pod.id}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] bg-slate-950 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {courseCode}
                        </span>
                        {isCreator && (
                          <span className="text-[8px] bg-slate-100 text-slate-800 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-slate-200">
                            Host
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{pod.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {pod.memberIds.length} of {pod.maxMembers} spots filled
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-slate-900' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Details & Browser */}
      <div className="lg:col-span-7 space-y-6" id="pods-right-pane">
        
        {/* Selected Pod Detail View */}
        {activePod ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6" id="selected-pod-details-card">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5" id="selected-pod-header">
              <div>
                <div className="flex items-center gap-2 mb-1.5" id="active-pod-badges">
                  <span className="text-[9px] bg-slate-950 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {activePod.course}
                  </span>
                  <span className="text-[9px] bg-slate-50 text-slate-900 border border-slate-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {activePod.style}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900">{activePod.name}</h2>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                  Group limit: {activePod.maxMembers} students maximum
                </p>
              </div>

              <div className="flex items-center gap-2 self-start shrink-0" id="active-pod-top-actions">
                {activePod.creatorId === 'me' ? (
                  <button
                    type="button"
                    onClick={() => onScheduleForPod(activePod)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
                    id="pod-schedule-session-btn"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule Group Session
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onLeavePod(activePod.id);
                      setSelectedPodId(null);
                    }}
                    className="px-3 py-1.5 hover:bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-red-100 flex items-center gap-1.5"
                    id="pod-leave-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Leave Pod
                  </button>
                )}
              </div>
            </div>

            {/* Description Block */}
            <div id="pod-description-section">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pod Objective & Schedule</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {activePod.description}
              </p>
            </div>

            {/* Group Members List */}
            <div id="pod-members-section">
              <div className="flex items-center justify-between mb-3" id="members-count-title">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Members ({activePod.memberIds.length} of {activePod.maxMembers})
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {activePod.maxMembers - activePod.memberIds.length} open slots remaining
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="pod-members-grid">
                {activePod.memberIds.map((mId) => {
                  const s = getStudentById(mId);
                  const isHost = mId === activePod.creatorId;
                  return (
                    <div 
                      key={mId} 
                      className="p-3 border border-slate-100 rounded-2xl bg-white flex items-center gap-3"
                      id={`pod-member-${mId}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {s.avatarSeed}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 truncate">{s.name}</span>
                          {isHost && (
                            <span className="text-[8px] bg-slate-50 text-slate-900 border border-slate-100 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                              Host
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{s.major}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Join Requests (Host Only) */}
            {activePod.creatorId === 'me' && (
              <div className="border-t border-slate-100 pt-5" id="host-pending-requests-section">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-slate-950" /> Join Requests
                </h4>

                {activePod.pendingRequestIds.length === 0 ? (
                  <p className="text-[11px] text-slate-400 bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                    No pending join requests right now. Allow buddies to request or invite some below!
                  </p>
                ) : (
                  <div className="space-y-2.5" id="pending-requests-list">
                    {activePod.pendingRequestIds.map((rId) => {
                      const rStudent = getStudentById(rId);
                      return (
                        <div 
                          key={rId}
                          className="p-3 border border-slate-100 rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          id={`join-request-${rId}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                              {rStudent.avatarSeed}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900">{rStudent.name}</span>
                              <span className="text-[10px] text-slate-400 block">{rStudent.major}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-center" id={`request-actions-${rId}`}>
                            <button
                              type="button"
                              onClick={() => onDeclineRequest(activePod.id, rId)}
                              className="px-2.5 py-1 hover:bg-slate-50 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-wider rounded-xl transition-colors"
                              id={`decline-req-btn-${rId}`}
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => onAcceptRequest(activePod.id, rId)}
                              className="px-3.5 py-1.5 bg-slate-950 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1"
                              id={`accept-req-btn-${rId}`}
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Invite Buddies Section (Host Only) */}
            {activePod.creatorId === 'me' && (
              <div className="border-t border-slate-100 pt-5" id="host-invite-section">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-900" /> Fast-Invite Swiped Study Partners
                </h4>

                {potentialInvites.length === 0 ? (
                  <p className="text-[10px] text-slate-400">
                    No available swiped study buddies left to invite who aren't already members. Match with more buddies in discovery!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="invite-buddies-grid">
                    {potentialInvites.map((buddy) => (
                      <div 
                        key={buddy.id}
                        className="p-3 border border-slate-100 rounded-2xl bg-white flex items-center justify-between gap-3"
                        id={`potential-invite-${buddy.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {buddy.avatarSeed}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 truncate block">{buddy.name}</span>
                            <span className="text-[9px] text-slate-400 truncate block">{buddy.major}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onInviteBuddy(activePod.id, buddy.id)}
                          className="p-1.5 hover:bg-slate-50 text-slate-900 border border-slate-100 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1 shrink-0"
                          title="Invite buddy"
                          disabled={activePod.memberIds.length >= activePod.maxMembers}
                          id={`invite-buddy-btn-${buddy.id}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Group Sessions (Pod Specific) */}
            <div className="border-t border-slate-100 pt-5" id="pod-sessions-section">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-950" /> Scheduled Group Sessions
              </h4>

              {podSessions.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" id="empty-pod-sessions">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[11px] text-slate-400 font-medium">No sessions scheduled for this pod yet</p>
                  {activePod.creatorId === 'me' && (
                    <button
                      type="button"
                      onClick={() => onScheduleForPod(activePod)}
                      className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-950 underline hover:text-black"
                    >
                      Schedule first session
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2" id="pod-sessions-list">
                  {podSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="p-3 border border-slate-100 rounded-2xl bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      id={`pod-session-row-${session.id}`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{session.date}</span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">{session.timeSlot}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          {session.locationType === 'Virtual' ? (
                            <>
                              <Video className="w-3 h-3 text-slate-900 shrink-0" />
                              <a
                                href={`https://${session.locationDetail}`}
                                target="_blank"
                                rel="referrer"
                                className="text-slate-950 underline hover:text-black font-semibold"
                              >
                                {session.locationDetail}
                              </a>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3 text-slate-900 shrink-0" />
                              <span className="font-semibold text-slate-800">{session.locationDetail}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="self-end sm:self-center text-[8px] bg-slate-950 text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Group Session
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* General Browser for available pods on campus */
          <div className="bg-white border border-slate-100 rounded-3xl p-6" id="pods-browser-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4" id="pods-browser-header">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-slate-950" />
                  Browse Campus Study Pods
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Browse and request to join study pods matching your enrolled courses.</p>
              </div>
            </div>

            {browsePods.length === 0 ? (
              <div className="text-center py-12" id="empty-browser-pods">
                <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No available external study pods for your courses</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Be the trendsetter! Launch a new study pod for one of your courses using the "Create Pod" form.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="browser-pods-grid">
                {browsePods.map((pod) => {
                  const hasRequested = pod.pendingRequestIds.includes('me');
                  const isFull = pod.memberIds.length >= pod.maxMembers;
                  const creatorStudent = getStudentById(pod.creatorId);
                  return (
                    <div 
                      key={pod.id}
                      className="p-4 border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-2xl bg-white flex flex-col justify-between gap-4"
                      id={`browser-pod-item-${pod.id}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[9px] bg-slate-950 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {pod.course.split(':')[0]}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {pod.memberIds.length}/{pod.maxMembers} spots
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{pod.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                          {pod.description}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400" id={`browser-pod-creator-${pod.id}`}>
                          <span>Hosted by</span>
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 text-[9px] font-bold flex items-center justify-center border border-slate-200">
                            {creatorStudent.avatarSeed}
                          </div>
                          <span className="font-bold text-slate-700 truncate">{creatorStudent.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50" id={`browser-pod-footer-${pod.id}`}>
                        <span className="text-[9px] bg-slate-50 text-slate-900 border border-slate-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {pod.style}
                        </span>

                        {hasRequested ? (
                          <button
                            type="button"
                            onClick={() => onLeavePod(pod.id)} // Leaver/canceller uses leave helper
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors"
                            id={`cancel-req-btn-${pod.id}`}
                          >
                            Requested
                          </button>
                        ) : isFull ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2.5 py-1 rounded-xl">
                            Full
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onJoinRequest(pod.id)}
                            className="px-3.5 py-1.5 bg-slate-950 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors"
                            id={`join-req-btn-${pod.id}`}
                          >
                            Join Group
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
