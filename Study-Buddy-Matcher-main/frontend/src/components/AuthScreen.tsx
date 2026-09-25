import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, LogIn, UserPlus, GraduationCap, Calendar, Clock, BookOpen, MapPin, User, Sparkles, CheckCircle } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  
  // Basic states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [university, setUniversity] = useState('');
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

    if (isSignUp && !university.trim()) {
      showToast('Please enter your university.', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
    const payload = isSignUp ? {
      email,
      password,
      name,
      major: major || 'Undecided',
      university: university.trim(),
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
        university: data.user.university || data.user.email.split('@')[1] || '',
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

  const handleResetPassword = () => {
    showToast('Password reset is not configured for this local project yet.', 'info');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f7fb] flex flex-col justify-center items-center relative overflow-y-auto" id="auth-root-container">
      {/* Mathematical grid background patterns to mimic engineering/academic rigor */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-900/[0.02] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800/[0.03] rounded-full filter blur-3xl pointer-events-none" />

      {!isSignUp ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 flex min-h-[100dvh] w-full max-w-none overflow-hidden rounded-none border-0 bg-white shadow-none"
          id="auth-signin-layout"
        >
          <section className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <div className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-white"><Sparkles className="h-3.5 w-3.5" /></span>
                  Study Buddy Matcher
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Welcome back</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">Sign in to find your next study partner and continue building your academic circle.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" id="auth-signin-form">
                <div className="space-y-2">
                  <label htmlFor="auth-email-input" className="text-sm font-semibold text-slate-700">Email address</label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-violet-400 focus-within:bg-violet-50/40">
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password-input" className="text-sm font-semibold text-slate-700">Password</label>
                    <button type="button" onClick={handleResetPassword} className="text-xs font-semibold text-violet-600 transition-colors hover:text-violet-800 hover:underline">Reset password</button>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-violet-400 focus-within:bg-violet-50/40">
                    <div className="relative">
                      <input
                        id="auth-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl bg-transparent px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                      <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 flex items-center rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-900" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
                  Keep me signed in
                </label>

                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <LogIn className="h-4 w-4" />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">New to Study Buddy?{' '}
                <button type="button" onClick={() => setIsSignUp(true)} className="font-semibold text-violet-600 hover:underline">Create an account</button>
              </p>
            </div>
          </section>

          <section className="relative hidden overflow-hidden bg-[#211635] lg:block lg:w-1/2" aria-label="Study together">
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85" alt="Students studying together" className="absolute inset-0 h-full w-full object-cover opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211635] via-[#211635]/25 to-transparent" />
            <div className="absolute inset-x-10 bottom-10 text-white xl:inset-x-14">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-violet-200">Learn together</p>
              <h2 className="max-w-lg text-3xl font-semibold leading-tight xl:text-4xl">Find the people who make studying feel less like studying.</h2>
              <div className="mt-7 flex gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md"><strong className="block text-lg">1:1</strong><span className="text-xs text-violet-100">Peer matches</span></div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md"><strong className="block text-lg">24/7</strong><span className="text-xs text-violet-100">Study community</span></div>
              </div>
            </div>
          </section>
        </motion.div>
      ) : (
      /* Main Authentication Card wrapped in high-fidelity reveal animation */
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative z-10 min-h-[100dvh] w-full max-w-none bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-16"
        id="auth-card-panel"
      >
        {/* Academic Platform Header */}
        <div className="mx-auto mb-8 max-w-3xl text-center" id="auth-card-header">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#28203c] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md" id="auth-logo-badge">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            University Peer Matcher
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#28203c] sm:text-2xl" id="auth-title">
            {isSignUp ? "Create Your Student Deck" : "Peer Portal Sign In"}
          </h1>
          <p className="text-xs text-slate-500 mt-1" id="auth-subtitle">
            {isSignUp ? "Set your enrolled courses, style preferences, and match with campus study partners" : "Sign in to access study pods, peer messenger rooms, and calendar schedules"}
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 text-xs" id="auth-form-handler">
          
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
                  className="w-full rounded-xl border border-slate-200 bg-[#faf8ff] px-4 py-2.5 font-bold tracking-tight text-slate-900 outline-none transition-all focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/10"
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
                  className="w-full rounded-xl border border-slate-200 bg-[#faf8ff] px-4 py-2.5 font-bold tracking-tight text-slate-900 outline-none transition-all focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/10"
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
                        className="w-full rounded-xl border border-slate-200 bg-[#faf8ff] px-4 py-2.5 font-bold tracking-tight text-slate-900 outline-none transition-all focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/10"
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
                        className="w-full rounded-xl border border-slate-200 bg-[#faf8ff] px-4 py-2.5 font-bold tracking-tight text-slate-900 outline-none transition-all focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/10"
                        id="auth-major-input"
                      />
                      <GraduationCap className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">University</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Thapar Institute of Engineering & Technology"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-[#faf8ff] px-4 py-2.5 font-bold tracking-tight text-slate-900 outline-none transition-all focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/10"
                      id="auth-university-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Student Bio (About Me)</label>
                  <textarea
                    placeholder="Describe your research directions, startup visions, or what topics you want to tackle quietly with peers..."
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-[#faf8ff] px-4 py-3 font-bold leading-relaxed tracking-tight text-slate-900 outline-none transition-all focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/10"
                    id="auth-bio-input"
                  />
                </div>

                {/* Course Enrollment Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-fuchsia-600" />
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-900">Enrolled Programs (Select all that apply)</label>
                  </div>
                  <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-violet-100 bg-[#faf8ff] p-3 sm:grid-cols-2" id="auth-courses-box">
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
                                  ? 'border-fuchsia-500 bg-fuchsia-500 text-white shadow-sm'
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
                              ? 'border-fuchsia-500 bg-fuchsia-50 font-bold text-[#55406f]'
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
                            className="accent-fuchsia-500"
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
                              ? 'border-fuchsia-500 bg-fuchsia-50 font-bold text-[#55406f]'
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
                            className="accent-fuchsia-500"
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
                                  ? 'border-fuchsia-500 bg-fuchsia-500 text-white shadow-sm'
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-fuchsia-200 transition-all hover:bg-fuchsia-600 hover:shadow-xl disabled:opacity-50"
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
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-fuchsia-600"
              id="auth-switch-btn"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-fuchsia-600 underline">Sign In Here</span></>
              ) : (
                <>New to Study Buddy? <span className="text-fuchsia-600 underline">Create Your Student Deck</span></>
              )}
            </button>
          </div>
        </form>

      </motion.div>
      )}
    </div>
  );
}
