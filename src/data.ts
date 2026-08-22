import { Student } from './types';

export const POPULAR_COURSES = [
  "CS 101: Introduction to Computer Science",
  "MATH 290: Linear Algebra",
  "CHEM 210: Organic Chemistry II",
  "PSYC 150: Introduction to Psychology",
  "PHYS 201: General Physics I",
  "ECON 101: Principles of Microeconomics",
  "BIO 110: Cellular Biology"
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: "student-1",
    name: "Ishaan Sharma",
    email: "ishaan.sharma@university.edu",
    major: "Computer Science & Math",
    courses: ["CS 101: Introduction to Computer Science", "MATH 290: Linear Algebra"],
    studyStyle: "Quiet Focus",
    locationPreference: "Virtual",
    availability: ["Mon Afternoon", "Tue Evening", "Thu Afternoon"],
    bio: "Hey! Double majoring in CS & Math. I usually love quiet focus sessions where we both work in silence with periodic 5-minute check-ins. Working towards building a neural net startup!",
    isCurrentlyFree: true,
    avatarSeed: "IS"
  },
  {
    id: "student-2",
    name: "Priya Nair",
    email: "priya.nair@university.edu",
    major: "Biochemistry",
    courses: ["CHEM 210: Organic Chemistry II", "BIO 110: Cellular Biology"],
    studyStyle: "Discussion-based",
    locationPreference: "In-person",
    availability: ["Tue Evening", "Thu Evening", "Fri Morning"],
    bio: "Pre-med biochemistry major. Orgo II is kicking my butt, so I prefer discussion-based peer explanation. Best study spot is the 3rd floor chemistry lab lounge!",
    isCurrentlyFree: true,
    avatarSeed: "PN"
  },
  {
    id: "student-3",
    name: "Aarav Patel",
    email: "aarav.patel@university.edu",
    major: "Cognitive Psychology",
    courses: ["PSYC 150: Introduction to Psychology", "BIO 110: Cellular Biology"],
    studyStyle: "Active Recall",
    locationPreference: "Hybrid",
    availability: ["Mon Morning", "Wed Morning", "Fri Afternoon"],
    bio: "Psych student. Big fan of active recall using flashcards and mutual quiz sessions. I believe in active testing rather than just reading notes over and over again.",
    isCurrentlyFree: false,
    avatarSeed: "AP"
  },
  {
    id: "student-4",
    name: "Dev Patel",
    email: "dpatel@university.edu",
    major: "Software Engineering",
    courses: ["CS 101: Introduction to Computer Science", "MATH 290: Linear Algebra"],
    studyStyle: "Problem Solving",
    locationPreference: "Virtual",
    availability: ["Wed Afternoon", "Thu Evening", "Sat Morning"],
    bio: "Code enthusiast. Love working through complex algorithm problems together on whiteboards or virtual Miro screens. Let's solve some tough problems!",
    isCurrentlyFree: true,
    avatarSeed: "DP"
  },
  {
    id: "student-5",
    name: "Meera Sen",
    email: "meera.sen@university.edu",
    major: "Chemical Engineering",
    courses: ["CHEM 210: Organic Chemistry II", "PHYS 201: General Physics I"],
    studyStyle: "Problem Solving",
    locationPreference: "In-person",
    availability: ["Tue Afternoon", "Thu Afternoon", "Fri Afternoon"],
    bio: "Hey there! Looking for someone to crack through Physics problem sets and Orgo reaction mechanisms. Very chill, happy to grab bubble tea while studying.",
    isCurrentlyFree: false,
    avatarSeed: "MS"
  },
  {
    id: "student-6",
    name: "Rohan Mehta",
    email: "rohan.mehta@university.edu",
    major: "Economics",
    courses: ["ECON 101: Principles of Microeconomics", "MATH 290: Linear Algebra"],
    studyStyle: "Quiet Focus",
    locationPreference: "In-person",
    availability: ["Mon Morning", "Tue Morning", "Wed Afternoon"],
    bio: "Economics minor, doing a lot of micro/macro modeling. I love quiet library sessions. Usually at the main library basement study booths. Hit me up if you want a reliable quiet study partner.",
    isCurrentlyFree: true,
    avatarSeed: "RM"
  },
  {
    id: "student-7",
    name: "Ananya Rao",
    email: "ananya.rao@university.edu",
    major: "Cognitive Science",
    courses: ["PSYC 150: Introduction to Psychology", "CS 101: Introduction to Computer Science"],
    studyStyle: "Discussion-based",
    locationPreference: "Hybrid",
    availability: ["Wed Afternoon", "Thu Evening", "Fri Afternoon"],
    bio: "Combining psychology and CS. I enjoy discussing lectures and brainstorming paper topics. I study best with fresh coffee and deep conceptual discussions.",
    isCurrentlyFree: false,
    avatarSeed: "AR"
  }
];

export const MOCK_REPLIES: Record<string, string[]> = {
  "student-1": [
    "Hey! Thanks for matching. I'm actually reviewing some linear algebra questions right now. Want to study virtual?",
    "Perfect! For quiet focus, I usually set a timer: 50 minutes of pure coding/studying, then a 10 min break. Does that work for you?",
    "Great! Let's schedule a session using the scheduling tab. I will generate a Google Meet link for us.",
    "Awesome. Looking forward to our study session!"
  ],
  "student-2": [
    "Yo! Awesome match. I am struggling with the chemical synthesis pathway assignment. When are you free to meet in-person?",
    "Nice! Chemistry lounge is usually quiet on Tue evenings. Let's reserve room 304.",
    "Perfect, sounds like a plan. Propose the time and I'll accept immediately!",
    "Got it! Let's meet then. Don't forget your organic chemistry textbook!"
  ],
  "student-3": [
    "Hello! I am preparing some flashcards for PSYC 150. Would you want to quiz each other?",
    "Yes! Quizzing each other is so much more effective. Are you free this Wed morning?",
    "Sweet. Let's schedule that. I've got some good Anki decks ready.",
    "Can't wait! See you then."
  ],
  "student-4": [
    "Hey friend! Ready to write some code? I'm working on the recursion assignment.",
    "Virtual whiteboards are the best. I can share my VS Code Live Share link too.",
    "Awesome, let's lock in a time slot.",
    "Sounds great. Talk to you soon!"
  ],
  "student-5": [
    "Hi! Nice to meet you. I'm actually grabbing a coffee at the campus center. Are you free soon?",
    "Totally! Let's grab some tea and go over the physics problem set.",
    "Sweet, scheduling is set. See you soon!",
    "See you!"
  ],
  "student-6": [
    "Hello. I'll be at the main library basement booth for the next couple of hours. Very quiet, plenty of power outlets.",
    "That works perfectly. I'll keep an eye out for you. Let's do some quiet microeconomics reading.",
    "Sounds solid. Let's book the session so we track our study hours.",
    "Awesome. See you at the library."
  ],
  "student-7": [
    "Hey! Psychology is so fascinating. Let's discuss the cognitive bias lecture.",
    "Hybrid or virtual is perfect for me. Let's meet up soon.",
    "Great, scheduling sent. Looking forward to it!",
    "Awesome, talk soon!"
  ]
};
