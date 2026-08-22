export type StudyStyle = 'Quiet Focus' | 'Discussion-based' | 'Active Recall' | 'Problem Solving';
export type LocationPref = 'In-person' | 'Virtual' | 'Hybrid';

export interface Student {
  id: string;
  name: string;
  email: string;
  courses: string[];
  studyStyle: StudyStyle;
  locationPreference: LocationPref;
  availability: string[]; // e.g. ["Mon Morning", "Tue Afternoon", "Thu Evening"]
  bio: string;
  isCurrentlyFree: boolean; // For "quick session" pulse affordance
  avatarSeed: string; // Used to generate nice initials/colored background
  major: string;
}

export interface MatchResult {
  student: Student;
  score: number;
  reasons: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  file?: {
    name: string;
    size: string;
    type: string; // 'pdf' | 'image' | 'doc' | 'other'
  };
  poll?: {
    question: string;
    options: { slot: string; votes: string[] }[]; // Voter student IDs or "me"
  };
}

export interface ChatSession {
  buddyId: string;
  messages: ChatMessage[];
  lastInteraction: string;
}

export interface ScheduledSession {
  id: string;
  buddyId?: string; // Optional if podId is present
  podId?: string;   // Optional, present if it is a group session for a study pod
  course: string;
  date: string;
  timeSlot: string;
  locationType: 'Virtual' | 'In-person';
  locationDetail: string; // Zoom link or Campus library room, etc.
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  rated?: boolean;
}

export interface StudyPod {
  id: string;
  name: string;
  course: string;
  creatorId: string; // "me" for the user, or student-id for mock buddies
  memberIds: string[]; // Student IDs (including creator)
  pendingRequestIds: string[]; // Student IDs requesting to join
  maxMembers: number; // 3 or 4 for small groups
  description: string;
  style: StudyStyle;
}
