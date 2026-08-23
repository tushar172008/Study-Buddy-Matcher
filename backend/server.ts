import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Pool } from "pg";
import "dotenv/config";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Vercel's app directory is read-only, so use /tmp unless a database or file path is configured.
const defaultUsersFile = process.env.VERCEL
  ? path.join('/tmp', 'users_db.json')
  : path.join(process.cwd(), 'users_db.json');
const USERS_FILE = process.env.USERS_FILE || defaultUsersFile;
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-only-session-secret';
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

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
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
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

async function initializeDatabase() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sender_email TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      message JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS matches (
      user_email TEXT NOT NULL,
      buddy_email TEXT NOT NULL,
      PRIMARY KEY (user_email, buddy_email)
    );
  `);
}

const databaseReady = initializeDatabase();

function userId(email: string) {
  return `user-${Buffer.from(email.toLowerCase()).toString('base64url')}`;
}

function publicProfile(user: any) {
  const profile = user.profile || user;
  return {
    id: userId(user.email),
    name: profile.name,
    email: user.email,
    major: profile.major || "Undecided",
    courses: Array.isArray(profile.courses) ? profile.courses : [],
    studyStyle: profile.studyStyle || "Quiet Focus",
    locationPreference: profile.locationPreference || "Hybrid",
    availability: Array.isArray(profile.availability) ? profile.availability : [],
    bio: profile.bio || "",
    isCurrentlyFree: false,
    avatarSeed: profile.avatarSeed || String(profile.name || user.email).split(' ').map((part: string) => part[0]).join('').substring(0, 2).toUpperCase()
  };
}

async function getDatabaseUsers() {
  if (pool) {
    await databaseReady;
    const result = await pool.query('SELECT email, password, profile FROM users');
    return result.rows;
  }
  return readUsers().map((user: any) => ({ email: user.email, password: user.password, profile: user }));
}

async function saveDatabaseUser(user: any) {
  if (pool) {
    await databaseReady;
    await pool.query(
      'INSERT INTO users (email, password, profile) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password = $2, profile = $3',
      [user.email, user.password, user.profile]
    );
    return;
  }
  const users = readUsers();
  const index = users.findIndex((existing: any) => existing.email === user.email);
  const storedUser = { ...user.profile, email: user.email, password: user.password };
  if (index >= 0) users[index] = storedUser;
  else users.push(storedUser);
  writeUsers(users);
}

// Ensure the db is initialized right away
readUsers();

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    storage: pool ? "postgresql" : "temporary-file",
    persistentStorageConfigured: Boolean(pool)
  });
});

// Authentication Sign Up Endpoint
app.post("/api/auth/signup", (req, res) => {
  const { email, password, name, major, courses, studyStyle, locationPreference, availability, bio } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required fields." });
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

  (async () => {
    const users = await getDatabaseUsers();
    if (users.some((user: any) => user.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "A student account with this email address already exists." });
    }
    const { password: passwordHash, ...profile } = newUser;
    await saveDatabaseUser({ email: newUser.email, password: passwordHash, profile });
    res.json({ success: true, user: publicProfile({ email: newUser.email, profile }), token: createSession(newUser.email) });
  })().catch(() => res.status(500).json({ error: "Unable to create account." }));
});

// Authentication Sign In Endpoint
app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required fields." });
  }

  const users = await getDatabaseUsers();
  const matchedUser = users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, u.password)
  );

  if (!matchedUser) {
    return res.status(400).json({ error: "Incorrect email address or password. Please try again." });
  }

  // Upgrade legacy plaintext records the first time they authenticate.
  if (!matchedUser.password.includes(':')) {
    matchedUser.password = hashPassword(password);
    await saveDatabaseUser(matchedUser);
  }

  res.json({
    success: true,
    user: publicProfile(matchedUser),
    token: createSession(matchedUser.email)
  });
});

// Session Verification / Authentication Recovery Endpoint
app.post("/api/auth/me", async (req, res) => {
  const { token } = req.body;

  const email = token ? getSessionEmail(token) : null;
  if (!email) {
    return res.status(401).json({ error: "Access denied. Invalid session token." });
  }

  const users = await getDatabaseUsers();
  const matchedUser = users.find((u: any) => u.email.toLowerCase() === email);

  if (!matchedUser) {
    return res.status(401).json({ error: "User profile no longer exists." });
  }

  res.json({
    success: true,
    user: publicProfile(matchedUser)
  });
});

app.put("/api/auth/profile", async (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: "Access denied. Invalid session token." });
  const users = await getDatabaseUsers();
  const currentUser = users.find((user: any) => user.email.toLowerCase() === email.toLowerCase());
  if (!currentUser) return res.status(404).json({ error: "User profile not found." });
  const profile = { ...currentUser.profile, ...req.body, email: currentUser.email };
  await saveDatabaseUser({ email: currentUser.email, password: currentUser.password, profile });
  res.json({ success: true, user: publicProfile({ email: currentUser.email, profile }) });
});

// Return registered student profiles for the authenticated discovery deck.
app.get("/api/students", async (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) {
    return res.status(401).json({ error: "Access denied. Invalid session token." });
  }

  const students = (await getDatabaseUsers())
    .filter((user: any) => user.email.toLowerCase() !== email.toLowerCase())
    .map(publicProfile);

  res.json({ students });
});

app.get("/api/chats/:buddyId", async (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: "Access denied. Invalid session token." });
  const buddyEmail = Buffer.from(req.params.buddyId.replace(/^user-/, ''), 'base64url').toString('utf8');
  await databaseReady;
  if (!pool) return res.json({ messages: [] });
  const result = await pool.query(
    'SELECT message FROM chat_messages WHERE (sender_email = $1 AND recipient_email = $2) OR (sender_email = $2 AND recipient_email = $1) ORDER BY created_at',
    [email, buddyEmail]
  );
  res.json({ messages: result.rows.map(row => ({
    ...row.message,
    senderId: row.sender_email === email ? 'me' : userId(row.sender_email)
  })) });
});

app.post("/api/chats/:buddyId", async (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: "Access denied. Invalid session token." });
  const buddyEmail = Buffer.from(req.params.buddyId.replace(/^user-/, ''), 'base64url').toString('utf8');
  if (!pool) return res.status(503).json({ error: "Chat database is not configured." });
  await databaseReady;
  const message = { ...req.body, senderId: userId(email) };
  await pool.query(
    'INSERT INTO chat_messages (id, sender_email, recipient_email, message) VALUES ($1, $2, $3, $4)',
    [message.id, email, buddyEmail, message]
  );
  res.json({ success: true, message });
});

app.get("/api/matches", async (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: "Access denied. Invalid session token." });
  if (!pool) return res.json({ matchedIds: [] });
  await databaseReady;
  const result = await pool.query('SELECT buddy_email FROM matches WHERE user_email = $1', [email]);
  res.json({ matchedIds: result.rows.map(row => userId(row.buddy_email)) });
});

app.post("/api/matches/:buddyId", async (req, res) => {
  const email = getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: "Access denied. Invalid session token." });
  if (!pool) return res.json({ success: true });
  await databaseReady;
  const buddyEmail = Buffer.from(req.params.buddyId.replace(/^user-/, ''), 'base64url').toString('utf8');
  await pool.query('INSERT INTO matches (user_email, buddy_email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [email, buddyEmail]);
  res.json({ success: true });
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
