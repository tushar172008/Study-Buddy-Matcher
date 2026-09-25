# Study Buddy Matcher

Study Buddy Matcher is a full-stack study partner platform for university students. It helps students find compatible peers using courses, study style, availability, and location preferences, then coordinate through chat, polls, scheduled sessions, and small study pods.

## Features

- Account sign-up, sign-in, session recovery, and logout
- Student profiles with university, major, courses, study style, availability, location preference, and bio
- Course-first peer discovery with compatibility scores and matching reasons
- Swipe-style discovery with match, skip, block, and report actions
- Private one-to-one chats with message history
- Availability polls and file metadata in conversations
- Virtual and in-person study session scheduling
- Study pods with course, study style, descriptions, member limits, and join requests
- Profile import for faster onboarding
- Responsive interface with animated transitions and accessible icon-based controls

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Motion, and Lucide React
- Backend: Express, TypeScript, and Node.js
- Authentication: Password hashing with Node `scrypt` and signed bearer sessions
- Storage: Local JSON storage for development, or PostgreSQL through `DATABASE_URL`
- Deployment: Vercel-compatible API entry point and SPA rewrite configuration

## Project Structure

```text
Study-Buddy-Matcher-main/
├── api/
│   └── [...route].ts       # Vercel API entry point
├── backend/
│   └── server.ts           # Express server and API routes
├── frontend/
│   ├── index.html
│   └── src/
│       ├── components/     # Auth, profile, discovery, chat, sessions, and pod UI
│       ├── App.tsx         # Application state and navigation
│       ├── api.ts          # API URL helper
│       ├── data.ts         # Local/demo student data
│       ├── types.ts        # Shared frontend domain types
│       └── index.css       # Global styles and Tailwind import
├── users_db.json           # Local development user storage
├── .env.example            # Environment variable template
├── package.json            # Scripts and dependencies
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel SPA rewrite
└── vite.config.ts          # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The development command starts the Express server with Vite middleware.

### Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Build the frontend and bundled backend
npm run start     # Start the production backend bundle
npm run preview   # Preview the Vite production build
npm run lint      # Run the TypeScript compiler without emitting files
npm run clean     # Remove generated build output
```

## Configuration

Copy the example environment file before configuring a deployment:

```bash
cp .env.example .env
```

Important variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for persistent users, matches, and chats |
| `SESSION_SECRET` | Secret used to sign authentication sessions |
| `USERS_FILE` | Optional path for local JSON user storage |
| `FRONTEND_URL` | Allowed frontend origin for backend CORS |
| `VITE_API_URL` | API base URL when the frontend and backend are deployed separately |
| `GEMINI_API_KEY` | Reserved for enabled Gemini integrations |

Without `DATABASE_URL`, local development uses `users_db.json`. On Vercel, the fallback file storage uses `/tmp`, so data should be considered temporary. Set `DATABASE_URL` for persistent production accounts and chat data.

Never commit `.env` files, passwords, database credentials, or real API keys. Use `.env.example` only as a placeholder template.

## API Overview

The Express backend exposes these main routes:

- `GET /api/health` for service and storage status
- `POST /api/auth/signup` and `POST /api/auth/signin` for authentication
- `POST /api/auth/me` for session recovery
- `PUT /api/auth/profile` for profile updates
- `GET /api/students` for authenticated student discovery
- `GET|POST /api/chats/:buddyId` for chat history and messages
- `GET|POST /api/matches` and `/api/matches/:buddyId` for saved matches

Authenticated requests use an `Authorization: Bearer <token>` header.

## Validation

Run the TypeScript check before committing changes:

```bash
npm run lint
```

## Deployment Notes

The repository includes a Vercel function entry point at `api/[...route].ts` and a rewrite that serves the frontend for non-API routes. Configure `DATABASE_URL`, `SESSION_SECRET`, and the appropriate frontend/API URLs in the deployment environment. The production build creates the Vite frontend and bundles the Express server into `dist/server.cjs`.

## License

This project is intended for educational and demonstration use. Add a project-specific license before distributing it as production software.
