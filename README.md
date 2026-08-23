# Study Buddy Matcher

Study Buddy Matcher helps university students find compatible peers based on shared courses, study style, availability, and preferred location. After signing in, students can discover matches, exchange messages, coordinate availability polls, schedule study sessions, import peer profiles, and organize small course-specific study pods.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`
3. Open `http://localhost:3000`.

For Vercel, also add a hosted PostgreSQL connection string as `DATABASE_URL`. Without it, Vercel uses temporary storage and accounts may not survive function restarts.

Never commit `.env` or real API keys. The included `.env.example` contains placeholders only.

## Validation

Run the TypeScript check with `npm run lint`.

## Product Focus

- Course-first peer matching with explainable compatibility reasons
- In-person, virtual, and hybrid study coordination
- Private chat, time polls, file sharing, and scheduled sessions
- Small study pods with join requests and capacity limits
- Virtual and in-person session location details
