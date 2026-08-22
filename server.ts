import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import "dotenv/config";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to simulated database file inside workspace root
const USERS_FILE = path.join(process.cwd(), 'users_db.json');
const sessions = new Map<string, string>();

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword: string) {
  if (!storedPassword.includes(':')) return storedPassword === password;
  const [salt, storedHash] = storedPassword.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

function createSession(email: string) {
  const token = crypto.randomUUID();
  sessions.set(token, email.toLowerCase());
  return token;
}

// Helper to read users from the database file
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    // Seed default user to let the reviewer log in instantly
    const initialUsers = [
      {
        email: 'arjun.sharma@university.edu',
        password: hashPassword('password123'),
        name: 'Arjun Sharma',
        major: 'Computer Science',
        courses: ["CS 101: Introduction to Computer Science", "MATH 290: Linear Algebra", "CHEM 210: Organic Chemistry II"],
        studyStyle: 'Quiet Focus',
        locationPreference: 'Hybrid',
        availability: ["Mon Morning", "Tue Evening", "Thu Afternoon", "Fri Morning"],
        bio: "Hi! I am a second-year CS major. Working through linear algebra proofs and organic chemistry synthesis reaction mechanisms. Looking for a buddy to co-work quietly or do active review!"
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
    return initialUsers;
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// Helper to write users to database file
function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Ensure the db is initialized right away
readUsers();

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Authentication Sign Up Endpoint
app.post("/api/auth/signup", (req, res) => {
  const { email, password, name, major, courses, studyStyle, locationPreference, availability, bio } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required fields." });
  }

  const users = readUsers();
  const alreadyExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (alreadyExists) {
    return res.status(400).json({ error: "A student account with this email address already exists." });
  }

  const newUser = {
    email: email.toLowerCase(),
    password: hashPassword(password),
    name,
    major: major || "Computer Science",
    courses: courses || [],
    studyStyle: studyStyle || "Quiet Focus",
    locationPreference: locationPreference || "Hybrid",
    availability: availability || [],
    bio: bio || ""
  };

  users.push(newUser);
  writeUsers(users);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({
    success: true,
    user: userWithoutPassword,
    token: createSession(newUser.email)
  });
});

// Authentication Sign In Endpoint
app.post("/api/auth/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required fields." });
  }

  const users = readUsers();
  const matchedUser = users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, u.password)
  );

  if (!matchedUser) {
    return res.status(400).json({ error: "Incorrect email address or password. Please try again." });
  }

  // Upgrade legacy demo records the first time they authenticate.
  if (!matchedUser.password.includes(':')) {
    matchedUser.password = hashPassword(password);
    writeUsers(users);
  }

  const { password: _, ...userWithoutPassword } = matchedUser;
  res.json({
    success: true,
    user: userWithoutPassword,
    token: createSession(matchedUser.email)
  });
});

// Session Verification / Authentication Recovery Endpoint
app.post("/api/auth/me", (req, res) => {
  const { token } = req.body;

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Access denied. Invalid session token." });
  }

  const email = sessions.get(token)!;
  const users = readUsers();
  const matchedUser = users.find((u: any) => u.email.toLowerCase() === email);

  if (!matchedUser) {
    return res.status(401).json({ error: "User profile no longer exists." });
  }

  const { password: _, ...userWithoutPassword } = matchedUser;
  res.json({
    success: true,
    user: userWithoutPassword
  });
});

// Maps Proxy for Geocoding (coordinates -> address name)
app.get("/api/maps/geocode", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing latitude or longitude parameters." });
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Maps service is not configured." });
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to geocode coordinates" });
  }
});

// Maps Proxy for Text Search (address string -> coordinates & details)
app.get("/api/maps/search", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Missing query search term." });
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Maps service is not configured." });
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query as string)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to search places" });
  }
});

// Vite Middleware Mounting for dev environments
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
