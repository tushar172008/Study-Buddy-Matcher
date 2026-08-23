import React, { useState, useEffect, useRef } from 'react';
import { Student, ChatSession, ScheduledSession, MatchResult, StudyPod, StudyStyle } from './types';
import ProfileForm from './components/ProfileForm';
import SwipeCard from './components/SwipeCard';
import ChatPanel from './components/ChatPanel';
import SessionList from './components/SessionList';
import ScheduleModal from './components/ScheduleModal';
import StudyPodsPanel from './components/StudyPodsPanel';
import AuthScreen from './components/AuthScreen';
import DataImportWidget from './components/DataImportWidget';
import { courseKey } from './courseUtils';
import { apiUrl } from './api';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, MessagesSquare, CalendarRange, UserCircle, Sparkles, AlertCircle, Check, Users, LogOut } from 'lucide-react';

const EMPTY_PROFILE = {
  name: "",
  email: "",
  major: "",
  courses: [],
  studyStyle: "Quiet Focus" as const,
  locationPreference: "Hybrid" as const,
  availability: [],
  bio: ""
};

export default function App() {
  // Authentication & Session States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('study_buddy_token'));
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const loadedEmailRef = useRef<string>('');

  // State variables backed by localStorage
  const [userProfile, setUserProfile] = useState<Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>>(EMPTY_PROFILE);

  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [swipedIds, setSwipedIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);

  const handleImportStudents = (newStudents: Student[]) => {
    setStudentsList(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const filteredNew = newStudents.filter(s => !existingIds.has(s.id));
      return [...prev, ...filteredNew];
    });
    showToast(`Successfully imported ${newStudents.length} peer profiles!`, 'success');
  };

  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});

  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);

  // Current UI navigation tab
  const [activeTab, setActiveTab] = useState<'discover' | 'chats' | 'sessions' | 'profile' | 'pods'>('discover');

  // Interactive Match Popup state
  const [justMatchedBuddy, setJustMatchedBuddy] = useState<Student | null>(null);

  // Profile save feedback message
  const [profileSaveMsg, setProfileSaveMsg] = useState('');

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Session Recovery Effect
  useEffect(() => {
    const recoverSession = async () => {
      const storedToken = localStorage.getItem('study_buddy_token');
      if (storedToken) {
        try {
          const res = await fetch(apiUrl('/api/auth/me'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setUserProfile(data.user);
          } else {
            localStorage.removeItem('study_buddy_token');
            setToken(null);
          }
        } catch (e) {
          console.error("Failed to recover authenticated session", e);
        }
      }
      setIsAuthLoading(false);
    };
    recoverSession();
  }, [token]);

  const handleAuthSuccess = (profile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>, newToken: string) => {
    setUserProfile(profile);
    setToken(newToken);
    localStorage.setItem('study_buddy_token', newToken);
  };

  const handleLogout = () => {
    // Save current states first before logging out
    const email = userProfile.email;
    if (email) {
      localStorage.setItem(`study_buddy_${email}_profile`, JSON.stringify(userProfile));
      localStorage.setItem(`study_buddy_${email}_blocked`, JSON.stringify(blockedIds));
      localStorage.setItem(`study_buddy_${email}_reported`, JSON.stringify(reportedIds));
      localStorage.setItem(`study_buddy_${email}_swiped`, JSON.stringify(swipedIds));
      localStorage.setItem(`study_buddy_${email}_matched`, JSON.stringify(matchedIds));
      localStorage.setItem(`study_buddy_${email}_custom_students`, JSON.stringify(studentsList));
      localStorage.setItem(`study_buddy_${email}_chats`, JSON.stringify(chatSessions));
      localStorage.setItem(`study_buddy_${email}_sessions`, JSON.stringify(scheduledSessions));
      localStorage.setItem(`study_buddy_${email}_pods`, JSON.stringify(pods));
    }

    loadedEmailRef.current = '';
    localStorage.removeItem('study_buddy_token');
    setToken(null);
    setUserProfile(EMPTY_PROFILE);
    setBlockedIds([]);
    setReportedIds([]);
    setSwipedIds([]);
    setMatchedIds([]);
    setStudentsList([]);
    setChatSessions({});
    setScheduledSessions([]);
    setPods([]);

    showToast("Logged out of your peer account", "info");
  };

  // Schedule modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleBuddy, setScheduleBuddy] = useState<Student | null>(null);
  const [schedulePod, setSchedulePod] = useState<StudyPod | null>(null);
  const [isQuickScheduleMode, setIsQuickScheduleMode] = useState(false);

  // Study Pods State
  const [pods, setPods] = useState<StudyPod[]>([]);

  // Load user-specific state upon login or session recovery
  useEffect(() => {
    if (!token || !userProfile.email) {
      loadedEmailRef.current = '';
      return;
    }

    const email = userProfile.email;
    
    // Prevent redundant loads
    if (loadedEmailRef.current === email) return;

    // Load from local storage
    const savedProfile = localStorage.getItem(`study_buddy_${email}_profile`);
    const savedBlocked = localStorage.getItem(`study_buddy_${email}_blocked`);
    const savedReported = localStorage.getItem(`study_buddy_${email}_reported`);
    const savedSwiped = localStorage.getItem(`study_buddy_${email}_swiped`);
    const savedMatched = localStorage.getItem(`study_buddy_${email}_matched`);
    const savedCustomStudents = localStorage.getItem(`study_buddy_${email}_custom_students`);
    const savedChats = localStorage.getItem(`study_buddy_${email}_chats`);
    const savedSessions = localStorage.getItem(`study_buddy_${email}_sessions`);
    const savedPods = localStorage.getItem(`study_buddy_${email}_pods`);

    // Set loaded reference BEFORE modifying states to allow subsequent save triggers
    loadedEmailRef.current = email;

    if (savedProfile) {
      try { setUserProfile(JSON.parse(savedProfile)); } catch (e) { console.error(e); }
    }
    
    if (savedBlocked) {
      try { setBlockedIds(JSON.parse(savedBlocked)); } catch (e) { console.error(e); }
    } else {
      setBlockedIds([]);
    }

    if (savedReported) {
      try { setReportedIds(JSON.parse(savedReported)); } catch (e) { console.error(e); }
    } else {
      setReportedIds([]);
    }

    if (savedSwiped) {
      try { setSwipedIds(JSON.parse(savedSwiped)); } catch (e) { console.error(e); }
    } else {
      setSwipedIds([]);
    }

    if (savedMatched) {
      try { setMatchedIds(JSON.parse(savedMatched)); } catch (e) { console.error(e); }
    } else setMatchedIds([]);

    if (savedCustomStudents) {
      try { setStudentsList(JSON.parse(savedCustomStudents)); } catch (e) { console.error(e); }
    } else setStudentsList([]);

    if (savedChats) {
      try { setChatSessions(JSON.parse(savedChats)); } catch (e) { console.error(e); }
    } else setChatSessions({});

    if (savedSessions) {
      try { setScheduledSessions(JSON.parse(savedSessions)); } catch (e) { console.error(e); }
    } else setScheduledSessions([]);

    if (savedPods) {
      try { setPods(JSON.parse(savedPods)); } catch (e) { console.error(e); }
    } else setPods([]);
  }, [userProfile.email, token]);

  // Load profiles belonging to other registered accounts into discovery.
  useEffect(() => {
    if (!token || !userProfile.email) return;

    const loadRegisteredStudents = async () => {
      try {
        const response = await fetch(apiUrl('/api/students'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!Array.isArray(data.students)) return;

        setStudentsList(prev => {
          const studentsById = new Map(prev.map(student => [student.id, student]));
          data.students.forEach((student: Student) => studentsById.set(student.id, student));
          return Array.from(studentsById.values());
        });
      } catch (error) {
        console.error('Failed to load registered student profiles', error);
      }
    };

    loadRegisteredStudents();
  }, [token, userProfile.email]);

  useEffect(() => {
    if (!token || matchedIds.length === 0) return;

    const loadChats = async () => {
      const loadedChats = await Promise.all(matchedIds.map(async buddyId => {
        try {
          const response = await fetch(apiUrl(`/api/chats/${buddyId}`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) return null;
          const data = await response.json();
          return [buddyId, {
            buddyId,
            messages: Array.isArray(data.messages) ? data.messages : [],
            lastInteraction: data.messages?.at(-1)?.timestamp || ''
          }] as const;
        } catch (error) {
          console.error('Failed to load shared chat', error);
          return null;
        }
      }));

      setChatSessions(previous => ({
        ...previous,
        ...Object.fromEntries(loadedChats.filter((chat): chat is NonNullable<typeof chat> => chat !== null))
      }));
    };

    loadChats();
  }, [matchedIds, token]);

  useEffect(() => {
    if (!token) return;
    fetch(apiUrl('/api/matches'), { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (Array.isArray(data?.matchedIds)) setMatchedIds(previous => Array.from(new Set([...previous, ...data.matchedIds])));
      })
      .catch(error => console.error('Failed to load shared matches', error));
  }, [token]);

  // Synchronize states to local storage under user-specific keys
  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_profile`, JSON.stringify(userProfile));
  }, [userProfile, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_blocked`, JSON.stringify(blockedIds));
  }, [blockedIds, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_reported`, JSON.stringify(reportedIds));
  }, [reportedIds, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_swiped`, JSON.stringify(swipedIds));
  }, [swipedIds, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_matched`, JSON.stringify(matchedIds));
  }, [matchedIds, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_custom_students`, JSON.stringify(studentsList));
  }, [studentsList, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_chats`, JSON.stringify(chatSessions));
  }, [chatSessions, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_sessions`, JSON.stringify(scheduledSessions));
  }, [scheduledSessions, userProfile.email, token]);

  useEffect(() => {
    if (!token || !userProfile.email) return;
    if (loadedEmailRef.current !== userProfile.email) return;

    localStorage.setItem(`study_buddy_${userProfile.email}_pods`, JSON.stringify(pods));
  }, [pods, userProfile.email, token]);

  const [availabilityFilter, setAvailabilityFilter] = useState<string>(() => {
    return localStorage.getItem('study_buddy_avail_filter') || 'All';
  });

  useEffect(() => {
    localStorage.setItem('study_buddy_avail_filter', availabilityFilter);
  }, [availabilityFilter]);

  // Filter out students who are blocked, reported, or swiped
  const baseDiscoverable = studentsList.filter(
    s => !blockedIds.includes(s.id) && 
         !reportedIds.includes(s.id) && 
         !swipedIds.includes(s.id) &&
         !matchedIds.includes(s.id) &&
         s.courses.some(course => userProfile.courses.some(userCourse => courseKey(course) === courseKey(userCourse)))
  );

  const discoverableStudents = baseDiscoverable.filter(s => {
    if (availabilityFilter === 'All') return true;

    if (availabilityFilter === 'Shared') {
      // Must share at least one exact slot or general period with user
      return s.availability.some(slot => 
        userProfile.availability.some(uSlot => {
          if (slot === uSlot) return true;
          const slotPeriod = slot.split(' ')[1];
          const uSlotPeriod = uSlot.split(' ')[1];
          return slotPeriod && slotPeriod === uSlotPeriod;
        })
      );
    }

    // Specific period filter: e.g. 'Morning', 'Afternoon', 'Evening'
    return s.availability.some(slot => slot.toLowerCase().includes(availabilityFilter.toLowerCase()));
  });

  // Active chat buddies
  const activeChatBuddies = studentsList.filter(
    s => matchedIds.includes(s.id) && !blockedIds.includes(s.id) && !reportedIds.includes(s.id)
  );

  // Match Action handler
  const handleAcceptMatch = (buddy: Student, score: number, explanations: string[]) => {
    setSwipedIds(prev => [...prev, buddy.id]);
    
    setMatchedIds(prev => [...prev, buddy.id]);
    if (token) {
      fetch(apiUrl(`/api/matches/${buddy.id}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(error => console.error('Failed to save shared match', error));
    }
    setJustMatchedBuddy(buddy);
    setChatSessions(prev => ({
      ...prev,
      [buddy.id]: prev[buddy.id] || { buddyId: buddy.id, lastInteraction: '', messages: [] }
    }));
  };

  const handlePassMatch = (buddyId: string) => {
    setSwipedIds(prev => [...prev, buddyId]);
  };

  const handleBlockBuddy = (buddyId: string) => {
    setBlockedIds(prev => [...prev, buddyId]);
    // Remove from matches if exists
    setMatchedIds(prev => prev.filter(id => id !== buddyId));
    // Remove active tabs if necessary
    showToast("This user has been blocked. They will not be suggested again.", 'info');
  };

  const handleReportBuddy = (buddyId: string, reason: string) => {
    setReportedIds(prev => [...prev, buddyId]);
    setMatchedIds(prev => prev.filter(id => id !== buddyId));
  };

  // Chat message send handler
  const handleSendMessage = (buddyId: string, text: string, file?: any, poll?: any) => {
    const newMsg = {
      id: `user-msg-${Date.now()}`,
      senderId: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file,
      poll
    };

    setChatSessions(prev => {
      const session = prev[buddyId] || { buddyId, messages: [], lastInteraction: '' };
      return {
        ...prev,
        [buddyId]: {
          ...session,
          messages: [...session.messages, newMsg],
          lastInteraction: "Just Now"
        }
      };
    });

    if (token) {
      fetch(apiUrl(`/api/chats/${buddyId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newMsg)
      }).catch(error => console.error('Failed to save shared chat message', error));
    }
  };

  // Chat message receive handler
  const handleReceiveMessage = (buddyId: string, text: string, file?: any, poll?: any) => {
    const newMsg = {
      id: `buddy-msg-${Date.now()}`,
      senderId: buddyId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file,
      poll
    };

    setChatSessions(prev => {
      const session = prev[buddyId] || { buddyId, messages: [], lastInteraction: '' };
      return {
        ...prev,
        [buddyId]: {
          ...session,
          messages: [...session.messages, newMsg],
          lastInteraction: "Just Now"
        }
      };
    });
  };

  // Chat poll option vote handler
  const handleVotePoll = (buddyId: string, messageId: string, slot: string) => {
    setChatSessions(prev => {
      const session = prev[buddyId];
      if (!session) return prev;
      const updatedMessages = session.messages.map(msg => {
        if (msg.id === messageId && msg.poll) {
          const updatedOptions = msg.poll.options.map(opt => {
            if (opt.slot === slot) {
              const hasVoted = opt.votes.includes('me');
              const newVotes = hasVoted 
                ? opt.votes.filter(v => v !== 'me') 
                : [...opt.votes, 'me'];
              return { ...opt, votes: newVotes };
            }
            return opt;
          });
          return {
            ...msg,
            poll: {
              ...msg.poll,
              options: updatedOptions
            }
          };
        }
        return msg;
      });
      return {
        ...prev,
        [buddyId]: {
          ...session,
          messages: updatedMessages
        }
      };
    });
  };

  // Schedule appointment confirmer
  const handleConfirmSchedule = (sessionData: Omit<ScheduledSession, 'id' | 'status'>) => {
    const newSession: ScheduledSession = {
      ...sessionData,
      id: `session-${Date.now()}`,
      status: 'Scheduled'
    };

    setScheduledSessions(prev => [newSession, ...prev]);

    if (sessionData.buddyId) {
      // Send automated text in chat clarifying the booking
      const locIconText = sessionData.locationType === 'Virtual' ? '💻 Virtual link: ' : '📍 Location: ';
      const proposalText = `📅 Proposed a study session for ${sessionData.course.split(':')[0]}! \nTime: ${sessionData.date} during ${sessionData.timeSlot}. \n${locIconText}${sessionData.locationDetail}`;
      
      handleSendMessage(sessionData.buddyId, proposalText);

      setTimeout(() => {
        handleReceiveMessage(sessionData.buddyId, "That sounds awesome! I've added it to my study calendar and accepted the invite.");
      }, 1500);

      showToast(`Study session scheduled with ${studentsList.find(s => s.id === sessionData.buddyId)?.name}!`, 'success');
    } else if (sessionData.podId) {
      const targetPod = pods.find(p => p.id === sessionData.podId);
      showToast(`Group session scheduled for study pod: ${targetPod?.name || 'Your Pod'}!`, 'success');
    }
  };

  // Study Pod Handlers
  const handleCreatePod = (name: string, course: string, description: string, style: StudyStyle, maxMembers: number) => {
    const newPod: StudyPod = {
      id: `pod-${Date.now()}`,
      name,
      course,
      description,
      style,
      maxMembers,
      creatorId: 'me',
      memberIds: ['me'],
      pendingRequestIds: []
    };
    setPods(prev => [newPod, ...prev]);
    showToast(`Successfully launched your new study pod: ${name}!`, 'success');
  };

  const handleJoinRequest = (podId: string) => {
    setPods(prev => prev.map(p => {
      if (p.id === podId) {
        if (p.pendingRequestIds.includes('me')) return p;
        return {
          ...p,
          pendingRequestIds: [...p.pendingRequestIds, 'me']
        };
      }
      return p;
    }));
    showToast("Join request submitted to pod creator!", "success");
  };

  const handleLeavePod = (podId: string) => {
    setPods(prev => prev.map(p => {
      if (p.id === podId) {
        return {
          ...p,
          memberIds: p.memberIds.filter(id => id !== 'me'),
          pendingRequestIds: p.pendingRequestIds.filter(id => id !== 'me')
        };
      }
      return p;
    }));
    showToast("Left the study pod.", "info");
  };

  const handleAcceptRequest = (podId: string, studentId: string) => {
    let alreadyFull = false;
    setPods(prev => prev.map(p => {
      if (p.id === podId) {
        if (p.memberIds.length >= p.maxMembers) {
          alreadyFull = true;
          return p;
        }
        return {
          ...p,
          memberIds: [...p.memberIds, studentId],
          pendingRequestIds: p.pendingRequestIds.filter(id => id !== studentId)
        };
      }
      return p;
    }));
    if (alreadyFull) {
      showToast("Study pod is already full!", "info");
    } else {
      const studentName = studentsList.find(s => s.id === studentId)?.name || "Student";
      showToast(`Approved ${studentName} to join your study pod!`, "success");
    }
  };

  const handleDeclineRequest = (podId: string, studentId: string) => {
    setPods(prev => prev.map(p => {
      if (p.id === podId) {
        return {
          ...p,
          pendingRequestIds: p.pendingRequestIds.filter(id => id !== studentId)
        };
      }
      return p;
    }));
    showToast("Declined the join request.", "info");
  };

  const handleInviteBuddy = (podId: string, studentId: string) => {
    let alreadyFull = false;
    setPods(prev => prev.map(p => {
      if (p.id === podId) {
        if (p.memberIds.length >= p.maxMembers) {
          alreadyFull = true;
          return p;
        }
        if (p.memberIds.includes(studentId)) return p;
        return {
          ...p,
          memberIds: [...p.memberIds, studentId]
        };
      }
      return p;
    }));
    if (alreadyFull) {
      showToast("Study pod is already full!", "info");
    } else {
      const studentName = studentsList.find(s => s.id === studentId)?.name || "Student";
      showToast(`Instantly invited ${studentName} into your study pod!`, "success");
    }
  };

  const handleScheduleForPod = (pod: StudyPod) => {
    setSchedulePod(pod);
    setScheduleBuddy(null); // Clear buddy
    setIsQuickScheduleMode(false);
    setIsScheduleOpen(true);
  };

  // Cancel upcoming study session
  const handleCancelSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to cancel this scheduled study session?")) {
      setScheduledSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  // Rate completed session (Feedback Loop, PRD 7.5)
  const handleRateSession = (sessionId: string, scoreIncrement: number) => {
    setScheduledSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, status: 'Completed', rated: true };
      }
      return s;
    }));
  };

  // Handle saving of profile
  const handleSaveProfile = async (updatedProfile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>) => {
    setUserProfile(updatedProfile);
    if (token) {
      try {
        const response = await fetch(apiUrl('/api/auth/profile'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedProfile)
        });
        if (!response.ok) throw new Error('Profile update failed');
      } catch (error) {
        console.error('Failed to save profile to the shared database', error);
      }
    }
    setProfileSaveMsg('Academic profile updated successfully! Re-calculating peer match compatibility...');
    setTimeout(() => setProfileSaveMsg(''), 4000);
  };

  const handleOpenSchedule = (buddy: Student, isQuick: boolean) => {
    setScheduleBuddy(buddy);
    setSchedulePod(null); // Clear pod
    setIsQuickScheduleMode(isQuick);
    setIsScheduleOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden" id="app-auth-loading">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="text-center z-10 space-y-4">
          <div className="w-8 h-8 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verifying peer matcher session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 font-sans" id="app-root-container">
      {/* Top Banner Navigation (Academic design, pure white background, crisp borders) */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-40" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" id="header-inner">
          <div className="flex items-center gap-2.5" id="header-logo-container">
            <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-sm" id="logo-icon">
              S
            </div>
            <div id="logo-text">
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-900 leading-none">Study Buddy Matcher</h1>
              <span className="text-[9px] text-slate-400 mt-0.5 block font-bold uppercase tracking-wider">Academic Peer Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-3" id="header-meta-actions">
            <button
              type="button"
              id="logout-btn"
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl text-xs flex items-center gap-1 border border-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main-content">
        
        {/* Navigation Tabs (Horizontal slide feel, clear contrast) */}
        <div className="flex border-b border-slate-100 mb-8 overflow-x-auto scrollbar-none gap-2" id="nav-tabs">
          <button
            type="button"
            id="tab-discover"
            onClick={() => setActiveTab('discover')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'discover'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-400 hover:text-slate-950'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Find Buddy
            {discoverableStudents.length > 0 && (
              <span className="bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {discoverableStudents.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-chats"
            onClick={() => setActiveTab('chats')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'chats'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-400 hover:text-slate-950'
            }`}
          >
            <MessagesSquare className="w-4 h-4" />
            My Chats
            {activeChatBuddies.length > 0 && (
              <span className="bg-slate-100 text-slate-900 border border-slate-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold relative flex h-4 items-center justify-center">
                {activeChatBuddies.length}
                {activeChatBuddies.some(b => b.isCurrentlyFree) && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
                  </span>
                )}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-sessions"
            onClick={() => setActiveTab('sessions')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'sessions'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-400 hover:text-slate-950'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Schedules
            {scheduledSessions.filter(s => s.status === 'Scheduled').length > 0 && (
              <span className="bg-slate-50 text-slate-900 border border-slate-100 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {scheduledSessions.filter(s => s.status === 'Scheduled').length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-pods"
            onClick={() => setActiveTab('pods')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'pods'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-400 hover:text-slate-950'
            }`}
          >
            <Users className="w-4 h-4" />
            Study Pods
            {pods.filter(p => p.memberIds.includes('me')).length > 0 && (
              <span className="bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {pods.filter(p => p.memberIds.includes('me')).length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-400 hover:text-slate-950'
            }`}
          >
            <UserCircle className="w-4 h-4" />
            My Profile
          </button>
        </div>

        {/* Tab Views Panel */}
        <div className="mt-4" id="tab-views-root">
          {activeTab === 'discover' && (
            <div className="space-y-6" id="view-discover">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4" id="discover-header">
                <div id="discover-header-text">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Discover Study Buddies</h2>
                  <p className="text-xs text-slate-500">Swipe right to match. Only students taking your exact courses are suggested.</p>
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider" id="discover-stats">
                  User Account: <span className="text-slate-900">{userProfile.email}</span>
                </div>
              </div>

              {/* Robust Availability Filter dropdown (PRD 5.3) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4" id="discover-filters-container">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-slate-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Filter Availability Window:</span>
                </div>
                <div className="relative">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-xs text-slate-950 px-4 py-2 pr-10 rounded-xl font-bold uppercase tracking-wider cursor-pointer hover:border-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-950"
                    id="availability-filter-select"
                  >
                    <option value="All">All Availabilities</option>
                    <option value="Morning">Morning Only (8 AM - 12 PM)</option>
                    <option value="Afternoon">Afternoon Only (12 PM - 4 PM)</option>
                    <option value="Evening">Evening Only (4 PM - 8 PM)</option>
                    <option value="Shared">Shared Windows with Me</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {discoverableStudents.length > 0 ? (
                  <motion.div
                    key={`${discoverableStudents[0].id}-${availabilityFilter}`}
                    initial={{ opacity: 0, y: 35, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -25, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                    className="py-4"
                    id="discover-active-deck"
                  >
                    <SwipeCard
                      userProfile={userProfile}
                      buddy={discoverableStudents[0]}
                      onAccept={handleAcceptMatch}
                      onPass={handlePassMatch}
                      onBlock={handleBlockBuddy}
                      onReport={handleReportBuddy}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-12 bg-white border border-slate-100 rounded-3xl max-w-md mx-auto p-8"
                    id="deck-empty-state"
                  >
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950">No More Profiles Available</h4>
                    <p className="text-xs text-slate-500 mt-2 px-6 leading-relaxed">
                      No compatible student profiles are available for your courses and "{availabilityFilter}" filter window yet. Invite classmates to create accounts and complete their profiles.
                    </p>
                  <div className="mt-6 flex justify-center gap-3" id="deck-empty-actions">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      Update My Courses
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-4" id="view-chats">
              <div id="chats-header">
                <h2 className="text-lg font-bold text-slate-900">Connections & Study Rooms</h2>
                <p className="text-xs text-slate-500">Message your study buddies and book immediate co-working sessions or calendar invitations.</p>
              </div>
              <ChatPanel
                matchedBuddies={activeChatBuddies}
                chatSessions={chatSessions}
                onSendMessage={handleSendMessage}
                onReceiveMessage={handleReceiveMessage}
                onBlockBuddy={handleBlockBuddy}
                onOpenSchedule={handleOpenSchedule}
                onVotePoll={handleVotePoll}
              />
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4" id="view-sessions">
              <div id="sessions-header">
                <h2 className="text-lg font-bold text-slate-900">Study Sessions & Co-working Calendar</h2>
                <p className="text-xs text-slate-500">Track scheduled co-study sessions and rate your study partners to fine-tune matching accuracy.</p>
              </div>
              <SessionList
                sessions={scheduledSessions}
                buddies={studentsList}
                onRateSession={handleRateSession}
                onCancelSession={handleCancelSession}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6" id="view-profile">
              <div id="profile-header">
                <h2 className="text-lg font-bold text-slate-900">My Study Buddy Settings</h2>
                <p className="text-xs text-slate-500">Configure your active classes and study style to find matching peers on campus.</p>
              </div>
              <ProfileForm
                profile={userProfile}
                onSaveProfile={handleSaveProfile}
                message={profileSaveMsg}
              />
              <DataImportWidget
                onImportStudents={handleImportStudents}
                existingCount={studentsList.length}
              />
            </div>
          )}

          {activeTab === 'pods' && (
            <div className="space-y-4" id="view-pods">
              <div id="pods-header" className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Study Pods & Peer Circles</h2>
                <p className="text-xs text-slate-500">Collaborate in small groups (3-4 people) for course-specific study sessions on campus or virtually.</p>
              </div>
              <StudyPodsPanel
                userProfile={userProfile}
                matchedBuddies={activeChatBuddies}
                allBuddies={studentsList}
                pods={pods}
                scheduledSessions={scheduledSessions}
                onCreatePod={handleCreatePod}
                onJoinRequest={handleJoinRequest}
                onLeavePod={handleLeavePod}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                onInviteBuddy={handleInviteBuddy}
                onScheduleForPod={handleScheduleForPod}
                showToast={showToast}
              />
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white py-8 mt-16 text-xs text-slate-400" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" id="footer-inner">
          <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500">© 2026 Study Buddy Matcher Applet. Bound strictly to college .edu networks.</p>
          <p className="mt-1 font-medium">Designed with a deliberate mathematical layout for optimal focus & co-working discovery.</p>
        </div>
      </footer>

      {/* CALM MUTUAL MATCH NOTIFICATION OVERLAY MODAL (PRD 9, checkmark + short text, not gamified/flirty) */}
      {justMatchedBuddy && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="match-notification-overlay">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative animate-[scaleIn_0.3s_ease-out]" id="match-notification-card">
            
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-100" id="match-checkmark-box">
              <Check className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900" id="match-notification-title">Mutual Study Connection Made!</h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mt-2" id="match-notification-desc">
              Both you and <strong className="text-slate-800 font-bold">{justMatchedBuddy.name}</strong> opted to study together. 
              The study room and private chat are now unlocked.
            </p>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 text-left" id="match-notification-buddy">
              <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {justMatchedBuddy.avatarSeed}
              </div>
              <div id="match-buddy-info">
                <span className="text-xs font-bold text-slate-900 block">{justMatchedBuddy.name}</span>
                <span className="text-[10px] text-slate-400 font-semibold block">{justMatchedBuddy.major}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5" id="match-notification-actions">
              <button
                type="button"
                id="match-close-btn"
                onClick={() => setJustMatchedBuddy(null)}
                className="w-full py-2 border border-slate-100 hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
              >
                Keep Browsing
              </button>
              <button
                type="button"
                id="match-chat-btn"
                onClick={() => {
                  setJustMatchedBuddy(null);
                  setActiveTab('chats');
                }}
                className="w-full py-2 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl shadow-none transition-colors uppercase tracking-wider"
              >
                Open Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study scheduling Proposal Modal */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setScheduleBuddy(null);
          setSchedulePod(null);
        }}
        buddy={scheduleBuddy}
        pod={schedulePod}
        userProfile={userProfile}
        isQuickSessionMode={isQuickScheduleMode}
        onConfirmSchedule={handleConfirmSchedule}
      />

      {/* FLOATING CUSTOM TOAST ALERT */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2.5 border animate-fade-in ${
            toast.type === 'error' 
              ? 'bg-red-950 border-red-800' 
              : toast.type === 'success' 
                ? 'bg-emerald-950 border-emerald-800'
                : 'bg-slate-950 border-slate-800'
          }`} 
          id="custom-app-toast"
        >
          <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
            toast.type === 'error' ? 'bg-red-800' : toast.type === 'success' ? 'bg-emerald-800' : 'bg-slate-800'
          }`}>
            {toast.type === 'error' ? '!' : '✓'}
          </div>
          {toast.message}
        </div>
      )}
    </div>
  );
}
