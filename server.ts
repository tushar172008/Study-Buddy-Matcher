import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import "dotenv/config";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to the user database file inside the workspace root
const USERS_FILE = path.join(process.cwd(), 'users_db.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-only-session-secret';

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
  const encodedEmail = Buffer.from(email.toLowerCase()).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedEmail).digest('base64url');
  return `${encodedEmail}.${signature}`;
}

function getSessionEmail(token: string) {
  const [encodedEmail, signature] = token.split('.');
  if (!encodedEmail || !signature) return null;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedEmail).digest('base64url');
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  return Buffer.from(encodedEmail, 'base64url').toString('utf8');
}

function getAuthenticatedEmail(req: express.Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return getSessionEmail(authorization.slice('Bearer '.length));
}

// Helper to read users from the database file
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]');
    return [];
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

  // Upgrade legacy plaintext records the first time they authenticate.
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

  const email = token ? getSessionEmail(token) : null;
  if (!email) {
    return res.status(401).json({ error: "Access denied. Invalid session token." });
  }

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

// Return registered student profiles for the authenticated discovery deck.
app.get("/api/students", (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) {
    return res.status(401).json({ error: "Access denied. Invalid session token." });
  }

  const students = readUsers()
    .filter((user: any) => user.email.toLowerCase() !== email.toLowerCase())
    .map((user: any) => ({
      id: user.id || `user-${Buffer.from(user.email.toLowerCase()).toString('base64url')}`,
      name: user.name,
      email: user.email,
      major: user.major || "Undecided",
      courses: Array.isArray(user.courses) ? user.courses : [],
      studyStyle: user.studyStyle || "Quiet Focus",
      locationPreference: user.locationPreference || "Hybrid",
      availability: Array.isArray(user.availability) ? user.availability : [],
      bio: user.bio || "",
      isCurrentlyFree: false,
      avatarSeed: user.avatarSeed || user.name.split(' ').map((part: string) => part[0]).join('').substring(0, 2).toUpperCase()
    }));

  res.json({ students });
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

export { app };

if (!process.env.VERCEL) {
  startServer();
}
