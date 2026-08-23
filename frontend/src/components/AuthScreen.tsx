import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, GraduationCap, Calendar, Clock, BookOpen, MapPin, User, Sparkles, CheckCircle } from 'lucide-react';
import { PROGRAM_GROUPS } from '../data';
import { Student, StudyStyle, LocationPref } from '../types';
import { apiUrl } from '../api';

interface AuthScreenProps {
  onAuthSuccess: (userProfile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>, token: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STUDY_STYLES: StudyStyle[] = ['Quiet Focus', 'Discussion-based', 'Active Recall', 'Problem Solving'];
const LOCATION_PREFS: LocationPref[] = ['In-person', 'Virtual', 'Hybrid'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = ['Morning', 'Afternoon', 'Evening'];

export default function AuthScreen({ onAuthSuccess, showToast }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Basic states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  
  // Preference states for SignUp
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [studyStyle, setStudyStyle] = useState<StudyStyle>('Quiet Focus');
  const [locationPref, setLocationPref] = useState<LocationPref>('Hybrid');
  const [availability, setAvailability] = useState<string[]>([]);

  const toggleCourse = (course: string) => {
    setSelectedCourses(prev =>
      prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]
    );
  };

  const toggleAvailability = (day: string, period: string) => {
    const slot = `${day} ${period}`;
    setAvailability(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in email and password.', 'error');
      return;
    }

    if (isSignUp && !name) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
    const payload = isSignUp ? {
      email,
      password,
      name,
      major: major || 'Undecided',
      bio,
      courses: selectedCourses,
      studyStyle,
      locationPreference: locationPref,
      availability
    } : {
      email,
      password
    };

    try {
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast(isSignUp ? 'Registration successful! Welcome to Study Buddy Matcher.' : 'Signed in successfully!', 'success');
      
      // Map user object from API to userProfile state
      const profile = {
        name: data.user.name,
        email: data.user.email,
        major: data.user.major,
        courses: data.user.courses,
        studyStyle: data.user.studyStyle,
        locationPreference: data.user.locationPreference,
        availability: data.user.availability,
        bio: data.user.bio
      };

      onAuthSuccess(profile, data.token);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden" id="auth-root-container">
      {/* Mathematical grid background patterns to mimic engineering/academic rigor */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-900/[0.02] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800/[0.03] rounded-full filter blur-3xl pointer-events-none" />

      {/* Main Authentication Card wrapped in high-fidelity reveal animation */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 p-6 sm:p-8 z-10 relative"
        id="auth-card-panel"
      >
        {/* Academic Platform Header */}
        <div className="text-center mb-8" id="auth-card-header">
          <div className="inline-flex items-center gap-2 mb-3 bg-slate-950 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-full shadow-md" id="auth-logo-badge">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            University Peer Matcher
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase" id="auth-title">
            {isSignUp ? "Create Your Student Deck" : "Peer Portal Sign In"}
          </h1>
          <p className="text-xs text-slate-500 mt-1" id="auth-subtitle">
            {isSignUp ? "Set your enrolled courses, style preferences, and match with campus study partners" : "Sign in to access study pods, peer messenger rooms, and calendar schedules"}
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-xs" id="auth-form-handler">
          
          {/* Main Credentials Sub-section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="auth-credentials-grid">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="arjun.sharma@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 outline-none font-bold tracking-tight transition-all"
                  id="auth-email-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Secret Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 outline-none font-bold tracking-tight transition-all"
                  id="auth-password-input"
                />
              </div>
            </div>
          </div>

          {/* Expandable SignUp Preferences Panel with beautiful stagger animations */}
          <AnimatePresence initial={false}>
            {isSignUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="overflow-hidden space-y-6 pt-2 border-t border-slate-100"
                id="auth-signup-fields-section"
              >
                {/* Name, Major, Bio Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="auth-extended-credentials">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Alex Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 outline-none font-bold tracking-tight transition-all"
                        id="auth-name-input"
                      />
                      <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Academic Major</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Computer Science & Math"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 outline-none font-bold tracking-tight transition-all"
                        id="auth-major-input"
                      />
                      <GraduationCap className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Student Bio (About Me)</label>
                  <textarea
                    placeholder="Describe your research directions, startup visions, or what topics you want to tackle quietly with peers..."
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 focus:bg-white text-slate-900 rounded-xl px-4 py-3 outline-none font-bold tracking-tight transition-all resize-none leading-relaxed"
                    id="auth-bio-input"
                  />
                </div>

                {/* Course Enrollment Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-900" />
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Enrolled Programs (Select all that apply)</label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl max-h-40 overflow-y-auto" id="auth-courses-box">
                    {Object.entries(PROGRAM_GROUPS).map(([group, programs]) => (
                      <React.Fragment key={group}>
                        <div className="sm:col-span-2 pt-2 text-[10px] font-black uppercase tracking-wider text-slate-950 border-b border-slate-200">
                          {group}
                        </div>
                        {programs.map((program) => {
                          const isSelected = selectedCourses.includes(program);
                          return (
                            <button
                              key={program}
                              type="button"
                              onClick={() => toggleCourse(program)}
                              className={`p-2 rounded-xl border text-left text-[10px] font-bold flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              <span className="pr-1">{program}</span>
                              <span className="text-[9px] text-slate-400 truncate max-w-[100px] font-normal italic">
                                {isSelected ? '✓ Added' : 'Select'}
                              </span>
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Style & Location Preferences row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="auth-preferences-row">
                  {/* Study Style */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Study Style Archetype</label>
                    <div className="space-y-1.5" id="auth-styles-radio-container">
                      {STUDY_STYLES.map((style) => (
                        <label
                          key={style}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            studyStyle === style
                              ? 'bg-slate-50 border-slate-950 font-bold text-slate-950'
                              : 'bg-white border-slate-150 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px]">{style}</span>
                          <input
                            type="radio"
                            name="studyStyle"
                            value={style}
                            checked={studyStyle === style}
                            onChange={() => setStudyStyle(style)}
                            className="accent-slate-950"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Location Preferences */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Location Preference</label>
                    <div className="space-y-1.5" id="auth-locations-radio-container">
                      {LOCATION_PREFS.map((pref) => (
                        <label
                          key={pref}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            locationPref === pref
                              ? 'bg-slate-50 border-slate-950 font-bold text-slate-950'
                              : 'bg-white border-slate-150 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px]">{pref}</span>
                          <input
                            type="radio"
                            name="locationPref"
                            value={pref}
                            checked={locationPref === pref}
                            onChange={() => setLocationPref(pref)}
                            className="accent-slate-950"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid-based Availability Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-900" />
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Weekly Common Availability Windows</label>
                  </div>
                  <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50" id="auth-avail-grid-box">
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-slate-400 mb-1">
                      <div>Day</div>
                      <div>Morning</div>
                      <div>Afternoon</div>
                      <div>Evening</div>
                    </div>
                    {DAYS.map((day) => (
                      <div key={day} className="grid grid-cols-4 gap-2 items-center text-center py-1 border-b border-slate-100 last:border-0">
                        <div className="text-[10px] font-bold text-slate-900 text-left pl-2">{day}</div>
                        {PERIODS.map((period) => {
                          const slot = `${day} ${period}`;
                          const isSelected = availability.includes(slot);
                          return (
                            <button
                              key={period}
                              type="button"
                              onClick={() => toggleAvailability(day, period)}
                              className={`py-1.5 px-1 rounded-lg border text-[9px] font-bold transition-all ${
                                isSelected
                                  ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-150 hover:border-slate-300'
                              }`}
                            >
                              {isSelected ? '✓' : period[0]}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-black text-white py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Complete Account & Match!
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In to My Deck
              </>
            )}
          </button>

          {/* Switch Mode Action */}
          <div className="text-center pt-2" id="auth-switch-section">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors"
              id="auth-switch-btn"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-slate-900 underline">Sign In Here</span></>
              ) : (
                <>New to Study Buddy? <span className="text-slate-900 underline">Create Your Student Deck</span></>
              )}
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
