# Study Buddy Matcher

Study Buddy Matcher is a university-focused network for students to find compatible study partners based on shared courses, schedules, study habits, and preferred locations. The platform helps students connect, message, coordinate availability, import peer profiles, and organize small course-specific study pods.

## Overview

This project combines a TypeScript React frontend with an Express backend and is designed to support collaborative academic scheduling. Students can:

- Discover compatible peers from their course network
- Review compatibility signals and matching reasons
- Initiate private conversations and coordination chats
- Suggest study sessions and availability windows
- Schedule sessions with location details
- Create or join small study pods for specific classes
- Import profiles from local data for quick onboarding

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + Node.js
- Styling: Tailwind CSS
- Data: Local JSON-backed user storage and optional PostgreSQL for deployment
- Deployment: Vercel-friendly server structure

## Project Structure

```text
Study-Buddy-Matcher-main/
├── api/                  # API route handlers
├── backend/              # Express server logic
├── frontend/             # React app source
│   └── src/              # Components, pages, utilities, and types
├── .env.example          # Environment variable template
├── README.md             # Project documentation
├── metadata.json         # Project metadata
├── package.json          # Scripts and dependencies
├── tsconfig.json         # TypeScript config
├── users_db.json         # Seed/demo profile data
├── vite.config.ts       # Vite config
├── vercel.json           # Deployment config
└── .gitignore            # Git exclusions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Environment configuration

Create a local environment file from the example template if needed:

```bash
cp .env.example .env
```

For Vercel deployment, set a PostgreSQL connection string as `DATABASE_URL`. Without it, the app may fall back to temporary storage and user state may not persist across server restarts.

> Never commit `.env` files or real secret keys.

## Validation

Run the TypeScript validation check:

```bash
npm run lint
```

## Features

- Course-first matching with explainable compatibility reasoning
- In-person, hybrid, and virtual study coordination
- Private messaging and quick communication tools
- Study availability polling and scheduling
- Session creation with location and timing context
- Small study pods with capacity rules and join requests
- Data import workflow for user onboarding

## License

This project is intended for educational and demo use within the repository context. Update licensing details before public production deployment.

## Notes

This README is designed for a GitHub repository and can be expanded with screenshots, architecture diagrams, or a live demo link when the project is ready for public sharing.
