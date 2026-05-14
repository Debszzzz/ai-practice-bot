# AI Practice Bot

AI Practice Bot is a full-stack AI-powered interview coaching web application designed to help users practice realistic job interviews, receive intelligent feedback, improve weak areas, and track performance over time.

The system combines cloud-based generative AI with a local NLP fallback engine to ensure reliable coaching even when external AI APIs are unavailable.

---

## Live Demo

Vercel Deployment:
https://ai-practice-bot-amber.vercel.app/

GitHub Repository:
https://github.com/Debszzzz/ai-practice-bot

Demo Video:
https://drive.google.com/file/d/1gcLmJ-2VC4_TcQL4RTvz-phVMR6_9fAw/view?usp=sharing

---

## Project Overview

AI Practice Bot provides an interactive interview simulation platform where users can:

* Create an account
* Choose a job role
* Select interview difficulty
* Answer realistic interview questions
* Receive AI-powered coaching and scoring
* Review previous sessions
* Track analytics and performance trends
* Receive personalized recommendations

The system was developed as a Project Implementation Task (PIT) for AI-Powered Web Application Development.

---

## Features

### Authentication

* Supabase email/password authentication
* Secure login and registration
* Password reset workflow
* Email update verification
* Account security settings

### AI Interview Coaching

* AI-generated interview questions
* AI answer evaluation
* AI-generated hints
* AI follow-up questions
* AI sample answers
* AI topic explanations
* AI session summaries

### Hybrid AI Architecture

Primary AI:

* Google Gemini API

Fallback AI:

* Local rule-based NLP engine

Fallback features:

* Question generation
* STAR-based answer evaluation
* Keyword extraction
* Follow-up detection
* Personalized skill analysis

### Session Management

* Save practice sessions
* View session history
* Update session metadata
* Delete sessions
* View question-by-question feedback

### Analytics

* Performance dashboards
* Role-based analytics
* Difficulty-based analytics
* Personalized strengths and weak areas
* Practice recommendations

### UI/UX

* Responsive interface
* Tailwind CSS design system
* Animated modal-based settings and profile pages
* Desktop-focused SaaS-style experience

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion

### Backend and Database

* Supabase Auth
* Supabase PostgreSQL
* Row Level Security (RLS)

### AI

* Google Gemini API
* Local NLP fallback engine

### Deployment

* Vercel

### Version Control

* GitHub (Public Repository)

---

## Environment Variables

Create a `.env` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY_FALLBACK=your_backup_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEBUG_SESSION_SAVE=false
```

## Supabase Setup

1. Create a Supabase project.
2. Enable Email Authentication.
3. Run:

* `supabase/schema.sql`
* `supabase/rls-policies.sql`

4. Copy:

* Supabase URL
* Supabase anon key

5. Add them to:

* Local `.env`
* Vercel Environment Variables

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/ai-practice-bot.git
```

Install dependencies:

```bash
npm install
```

---

## Local Development

Run development server:

```bash
npm run dev
```

Open the local Vite URL.

---

## Verification

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

## Deployment

Deploy using Vercel:

1. Push project to GitHub.
2. Import repository into Vercel.
3. Configure environment variables.
4. Use Vite defaults:

Build Command:

```bash
npm run build
```

Output Directory:

```bash
dist
```

---

## Database Schema

Main tables:

### sessions

Stores:

* user_id
* role
* difficulty
* total_score
* accuracy
* followups
* created_at

### questions

Stores:

* session_id
* question
* answer
* score
* feedback

Row Level Security ensures users only access their own data.

---

## AI Processing Flow

```text
User starts session
↓
Gemini generates interview questions
↓
If Gemini unavailable:
Local NLP engine activates
↓
User submits answer
↓
AI evaluates answer
↓
Follow-up or feedback generated
↓
Session summary created
↓
Results stored in Supabase
```

---

## Team Roles

| Role             | Member                | Contribution                                     |
| ---------------- | --------------------- | ------------------------------------------------ |
| Leader           | Laurence Dave Ebalang | Planning, coordination, final review             |
| Frontend         | Kinley Lumosad        | React UI, state management, responsive design    |
| Backend          | Laurence Dave Ebalang | Supabase auth, database, RLS, CRUD services      |
| AI               | Robict Abie Javier    | Gemini prompts, fallback AI logic                |
| UI/UX            | Shoan Ray Palitoc     | Interface design, usability, visual polish       |
| QA/Documentation | John Lorenz Cruz      | Testing, README, documentation, demo preparation |

---

## AI Use Disclosure

AI tools were used during:

* brainstorming
* implementation planning
* debugging
* documentation drafting

Runtime AI features include:

* Google Gemini API
* Local NLP fallback engine

All final code, configuration, testing, and documentation were reviewed by the development team.

---

## License

Academic Project — Project Implementation Task (PIT)
