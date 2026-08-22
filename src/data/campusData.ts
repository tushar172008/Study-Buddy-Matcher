export interface CampusSpot {
  id: string;
  name: string;
  shortName: string;
  coords: { x: number; y: number }; // Percentage coordinate on our interactive SVG campus grid
  color: string;
  desc: string;
}

export const CAMPUS_MAP_SPOTS: CampusSpot[] = [
  {
    id: "library",
    name: "Main Library 3rd Floor co-working cubes",
    shortName: "Main Library",
    coords: { x: 32, y: 28 },
    color: "bg-indigo-600 border-indigo-200 text-indigo-600",
    desc: "Silent study pods and cooperative desks on the 3rd Floor."
  },
  {
    id: "science",
    name: "Science & Chemistry Lounge Room 304",
    shortName: "Science Lounge",
    coords: { x: 18, y: 65 },
    color: "bg-emerald-600 border-emerald-200 text-emerald-600",
    desc: "Academic lounge equipped with full-height whiteboard walls."
  },
  {
    id: "engineering",
    name: "Engineering Plaza Starbucks patio",
    shortName: "Engineering Starbucks",
    coords: { x: 82, y: 24 },
    color: "bg-amber-600 border-amber-200 text-amber-600",
    desc: "Lively outdoor seating with coffee and heavy-duty power outlets."
  },
  {
    id: "student_center",
    name: "Student Center Basement study lounge",
    shortName: "Student Center",
    coords: { x: 68, y: 76 },
    color: "bg-rose-600 border-rose-200 text-rose-600",
    desc: "Comfy couches, ambient hum, and direct snack access."
  },
  {
    id: "quad",
    name: "Campus Quad Lawn (Outdoor Zone)",
    shortName: "Campus Quad",
    coords: { x: 50, y: 48 },
    color: "bg-teal-600 border-teal-200 text-teal-600",
    desc: "Open grassy workspace perfect for reading groups."
  }
];
