# AI Practice Bot

AI Practice Bot is a full-stack interview coaching web application. Users can create an account, choose a job role and difficulty, answer mock interview questions, receive AI-assisted feedback, and save their practice sessions for review.

## Features

- Supabase email/password authentication
- Account security settings for changing email and password
- AI-powered interview questions, hints, follow-ups, sample answers, feedback, and session summaries
- Local fallback question bank when the AI API is unavailable
- Supabase CRUD for saved interview sessions and question records
- Dashboard, session history, analytics, profile, and settings views
- Responsive Tailwind CSS interface
- React TypeScript component files (`.tsx`) with a gradual migration configuration

## Tech Stack

- Frontend: React, TypeScript/TSX, Vite, Tailwind CSS
- Backend and database: Supabase Auth, Supabase Postgres, Row Level Security
- AI: Gemini API
- Deployment target: Vercel
- Version control target: GitHub public repository

## Environment Variables

Create a `.env` file from `.env.example`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY_FALLBACK=your_backup_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Run `supabase/rls-policies.sql` in the Supabase SQL editor.
4. Enable email authentication in Supabase Auth.
5. Add the Supabase URL and anon key to `.env` and to Vercel environment variables.

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verification

```bash
npm run lint
npm run build
```

Both commands currently pass locally.

## Deployment

Deploy with Vercel:

1. Push the project to a public GitHub repository.
2. Import the repository in Vercel.
3. Set the environment variables listed above.
4. Use Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`

Deployment link: `TODO: add Vercel URL`

GitHub repository: `TODO: add public GitHub URL`

## Documentation

Project documentation is available in `docs/project-documentation.md`. A PDF export is generated at `docs/AI-Practice-Bot-Documentation.pdf`.

## Team Roles

Update these names before submission:

| Role | Member | Contribution |
|---|---|---|
| Leader | Laurence Dave Ebalang | Planning, coordination, final review |
| Frontend | Kinley Lumosad | React/TSX screens, routing state, responsive layout |
| Backend | Laurence Dave Ebalang | Supabase auth, database, RLS, CRUD services |
| AI | Robict Abie Javier | Gemini prompts, AI feedback flow, fallback logic |
| UI/UX |  Shoan Ray Palitoc | Interface design, usability, visual polish |
| QA/Documentation | John Lorenz Cruz | Testing, README, PDF documentation, demo preparation |

## AI Use Disclosure

AI tools were used during development for code assistance, debugging, documentation drafting, and implementation planning. The application also uses Gemini as a runtime AI feature for interview coaching. Final code, configuration, and documentation should be reviewed by the team before submission.
