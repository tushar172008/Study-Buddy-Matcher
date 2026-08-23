import React, { useState } from 'react';
import { Student, StudyStyle, LocationPref } from '../types';
import { PROGRAM_GROUPS } from '../data';
import { User, Mail, GraduationCap, Clock, Award, BookOpen, AlertCircle } from 'lucide-react';

interface ProfileFormProps {
  profile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>;
  onSaveProfile: (profile: Omit<Student, 'id' | 'avatarSeed' | 'isCurrentlyFree'>) => void;
  message?: string;
}

const AVAILABILITY_OPTIONS = [
  "Mon Morning", "Mon Afternoon", "Mon Evening",
  "Tue Morning", "Tue Afternoon", "Tue Evening",
  "Wed Morning", "Wed Afternoon", "Wed Evening",
  "Thu Morning", "Thu Afternoon", "Thu Evening",
  "Fri Morning", "Fri Afternoon", "Fri Evening",
  "Sat Morning", "Sat Afternoon", "Sat Evening",
  "Sun Morning", "Sun Afternoon", "Sun Evening"
];

const STUDY_STYLES: StudyStyle[] = [
  'Quiet Focus', 'Discussion-based', 'Active Recall', 'Problem Solving'
];

const LOCATION_PREFS: LocationPref[] = [
  'In-person', 'Virtual', 'Hybrid'
];

export default function ProfileForm({ profile, onSaveProfile, message }: ProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(profile.studyStyle);
  const [locationPreference, setLocationPreference] = useState<LocationPref>(profile.locationPreference);
  const [courses, setCourses] = useState<string[]>(profile.courses);
  const [availability, setAvailability] = useState<string[]>(profile.availability);
  const [bio, setBio] = useState(profile.bio);

  const [emailError, setEmailError] = useState('');

  const handleCourseToggle = (course: string) => {
    if (courses.includes(course)) {
      setCourses(courses.filter(c => c !== course));
    } else {
      setCourses([...courses, course]);
    }
  };

  const handleAvailabilityToggle = (slot: string) => {
    if (availability.includes(slot)) {
      setAvailability(availability.filter(a => a !== slot));
    } else {
      setAvailability([...availability, slot]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');

    onSaveProfile({
      name,
      email,
      major: profile.major,
      studyStyle,
      locationPreference,
      courses,
      availability,
      bio
    });
  };

  return (
    <form onSubmit={handleSubmit} id="profile-setup-form" className="space-y-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8">
      <div className="border-b border-slate-100 pb-5" id="profile-form-header">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-slate-900" />
          Academic Profile Setup & Verification
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Provide your student preferences to match with peers in your exact classes.
        </p>
      </div>

      {message && (
        <div id="profile-save-success-alert" className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-900 rounded-full animate-ping"></span>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="profile-basic-fields">
        {/* Name input */}
        <div className="space-y-1.5" id="field-group-name">
          <label htmlFor="student-name" className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Full Name
          </label>
          <input
            type="text"
            id="student-name"
            required
            placeholder="e.g. Alex Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
          />
        </div>

        {/* Email input */}
        <div className="space-y-1.5" id="field-group-email">
          <label htmlFor="student-email" className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Student Email
          </label>
          <input
            type="email"
            id="student-email"
            required
            placeholder="arjun.sharma@university.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(e.target.value)) {
                setEmailError('');
              }
            }}
            className={`w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white ${
              emailError ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-slate-950'
            }`}
          />
          {emailError ? (
            <p className="text-red-500 text-[10px] flex items-center gap-1 mt-1" id="email-error-text">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {emailError}
            </p>
          ) : (
            <span className="text-[10px] text-slate-400 block mt-1" id="email-verification-sub">
              Used for account recovery and study matches.
            </span>
          )}
        </div>

      </div>

      {/* Course enrollment chips selector */}
      <div className="space-y-2" id="field-group-courses">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          Enrolled Programs (Select all that apply)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2" id="course-chips-container">
          {Object.entries(PROGRAM_GROUPS).map(([group, programs]) => (
            <React.Fragment key={group}>
              <div className="sm:col-span-2 pt-2 text-[10px] font-black uppercase tracking-wider text-slate-950 border-b border-slate-200">
                {group}
              </div>
              {programs.map((program) => {
                const isSelected = courses.includes(program);
                return (
                  <button
                    type="button"
                    key={program}
                    id={`course-option-${program.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => handleCourseToggle(program)}
                    className={`text-left text-[11px] p-3 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'border-slate-950 bg-slate-50 text-slate-900 font-semibold'
                        : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    <span>{program}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                      isSelected ? 'bg-slate-950 border-slate-950 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && "✓"}
                    </span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="profile-preferences-fields">
        {/* Study style selector */}
        <div className="space-y-1.5" id="field-group-style">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            Preferred Study Style
          </label>
          <div className="grid grid-cols-2 gap-2" id="style-buttons-container">
            {STUDY_STYLES.map((style) => (
              <button
                type="button"
                key={style}
                id={`style-option-${style.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setStudyStyle(style)}
                className={`py-2 px-3 text-xs rounded-xl border text-center transition-all duration-150 ${
                  studyStyle === style
                    ? 'border-slate-950 bg-slate-50 text-slate-900 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-white'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Location preference selector */}
        <div className="space-y-1.5" id="field-group-location">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Location Preference
          </label>
          <div className="grid grid-cols-3 gap-2" id="location-buttons-container">
            {LOCATION_PREFS.map((pref) => (
              <button
                type="button"
                key={pref}
                id={`location-option-${pref.toLowerCase()}`}
                onClick={() => setLocationPreference(pref)}
                className={`py-2 px-2 text-[11px] rounded-xl border text-center transition-all duration-150 ${
                  locationPreference === pref
                    ? 'border-slate-950 bg-slate-50 text-slate-900 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-white'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Availability Selector */}
      <div className="space-y-2" id="field-group-availability">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Weekly General Availability Slots (Used for overlapping checks)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5" id="availabilities-grid-container">
          {AVAILABILITY_OPTIONS.map((slot) => {
            const isSelected = availability.includes(slot);
            return (
              <button
                type="button"
                key={slot}
                id={`avail-option-${slot.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleAvailabilityToggle(slot)}
                className={`py-1.5 px-2 rounded-lg text-[10px] text-center border transition-all duration-150 truncate ${
                  isSelected
                    ? 'border-slate-950 bg-slate-950 text-white font-semibold'
                    : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-white'
                }`}
                title={slot}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio text area */}
      <div className="space-y-1.5" id="field-group-bio">
        <label htmlFor="student-bio" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Personal Bio & Study Goals
        </label>
        <textarea
          id="student-bio"
          required
          rows={3}
          placeholder="Briefly describe what you're working on, your favorite study spaces, and what you look for in a partner..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
        />
      </div>

      {/* Submit button */}
      <div className="pt-4 flex justify-end border-t border-slate-100" id="profile-form-footer">
        <button
          type="submit"
          id="save-profile-btn"
          className="px-6 py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors duration-150"
        >
          Verify & Save Profile Settings
        </button>
      </div>
    </form>
  );
}
