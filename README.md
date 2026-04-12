# HODON — MVP v0

> **La frontera del conocimiento no se contempla. Se opera.**
>
> Hodon es un motor de IA + laboratorio que convierte investigación y señales emergentes en hipótesis accionables, experimentos y prototipos — con rigor, no con humo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS |
| Database | PostgreSQL 16 (Docker) + Prisma ORM |
| Auth | Custom JWT (bcrypt + jose) via httpOnly cookies |
| Output Gen | Deterministic Mock Generator (LLM-ready) |
| External API | OpenAlex API |
| Exports | Markdown download (PDF via browser print) |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/installation): `npm install -g pnpm`

---

## Setup & Run

### 1. Clone & Install

```bash
git clone <repo-url>
cd hodon
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env if needed — defaults work out of the box with Docker
```

### 3. Start PostgreSQL

```bash
docker compose up -d
# Wait ~5 seconds for Postgres to be ready
```

### 4. Database setup

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 5. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `demo@hodon.local` / `demo1234`

---

## One-liner (all steps)

```bash
docker compose up -d && \
  pnpm install && \
  pnpm prisma migrate dev --name init && \
  pnpm prisma db seed && \
  pnpm dev
```

---

## Routing Map

### Public
| Route | Description |
|---|---|
| `/` | Landing page |

### Auth
| Route | Description |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Request password reset (shows link in dev) |
| `/reset-password?token=...` | Reset password |

### App (protected — requires login)
| Route | Description |
|---|---|
| `/app` | Dashboard |
| `/app/create` | Create new output |
| `/app/library` | Library (search + filter) |
| `/app/outputs/[id]` | Output Viewer (12 sections) |
| `/app/outputs/[id]/tracker` | Experiment Tracker |
| `/app/radar` | OpenAlex search + import |
| `/app/settings` | Profile + OpenAlex API key |

---

## API Routes

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Core
```
POST   /api/inputs
GET    /api/outputs
POST   /api/outputs
GET    /api/outputs/[id]
PATCH  /api/outputs/[id]
DELETE /api/outputs/[id]
POST   /api/outputs/[id]/feedback
GET    /api/outputs/[id]/experiments
POST   /api/outputs/[id]/experiments
PATCH  /api/experiments/[id]
DELETE /api/experiments/[id]
GET    /api/settings
PATCH  /api/settings
GET    /api/saved-searches
POST   /api/saved-searches
DELETE /api/saved-searches?id=...
POST   /api/access-requests
```

### OpenAlex Proxy
```
GET /api/openalex/works?search=...&per_page=10
GET /api/openalex/concepts?search=...
GET /api/openalex/rate-limit
```

---

## Hodon Output Structure (12 sections)

| # | Key | Description |
|---|---|---|
| 1 | `one_liner` | Executive synthesis in one sentence |
| 2 | `concept_map` | Core + nodes + edges |
| 3 | `quadrants` | Facts / Inferences / Hypotheses / Speculation |
| 4 | `axioms` | ≥3 fundamental axioms |
| 5 | `critical_assumptions` | ≥5 assumptions with confidence (high/medium/low) |
| 6 | `first_principles` | ≥3 first principles |
| 7 | `red_team` | 10 failure modes + falsification tests |
| 8 | `foresight_lite` | Drivers, uncertainties, scenarios, signals |
| 9 | `potable_opportunities` | Actionable opportunities |
| 10 | `experiment_plan` | 48h / 2-4w / 8-12w with metric, cost, risk |
| 11 | `risks_ethics` | Risks + mitigations |
| 12 | `final_recommendation` | GO / NO_GO / NEEDS_DATA + rationale |

---

## OpenAlex Integration

As of Feb 2026, OpenAlex requires an API key for all requests.

1. Go to `/app/settings`
2. Enter your OpenAlex API key
3. Click "Probar conexión" to verify and see rate limits
4. Use Radar (`/app/radar`) to search and import papers

> **Note:** Without an API key, OpenAlex requests will fail. The mock generator still works for `QUESTION_TEXT` and `URL` input types without an API key.

---

## Output Generator

The MVP uses a **deterministic mock generator** (`src/lib/mock-generator.ts`) that:

- Produces the same output for the same input (hash-based seeding)
- Always generates ≥3 axioms, ≥5 critical assumptions, 10 red team items, 3 experiments
- Uses OpenAlex work metadata (title, abstract, concepts, cited_by_count, year) as seeds
- Is **architected for easy LLM swap** — replace `generateOutput()` with an API call

To connect an LLM, replace the function in `src/lib/mock-generator.ts` with a call to the Anthropic/OpenAI SDK.

---

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://hodon:hodon_secret@localhost:5432/hodon"
AUTH_SECRET="your-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional
UPLOAD_DIR="./uploads"
SEED_DEMO_EMAIL="demo@hodon.local"
SEED_DEMO_PASSWORD="demo1234"
```

---

## Acceptance Tests

1. **Auth:** Register → login → logout works ✓
2. **OpenAlex → Output:** Search paper in Radar → Import → Output generated with 12 sections ✓
3. **Output Viewer:** All 12 sections visible, collapsible, Export MD downloads file ✓
4. **Tracker:** Add experiment → set status/outcome → save ✓
5. **Library:** Lists outputs, search by title, filter by domain/objective, delete works ✓
6. **Settings:** Save OpenAlex API key → test rate-limit endpoint shows response ✓

---

## Known Limitations (MVP)

- API keys stored unencrypted (TODO: encrypt at rest)
- PDF export = browser print (TODO: server-side PDF renderer)
- No email sending for password reset (link shown on screen in dev)
- File uploads stored locally in `/uploads` (TODO: S3)
- No real LLM integration (deterministic generator)
- No team/collaboration features
- No billing/limits

---

## Project Structure

```
hodon/
├── docker-compose.yml
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── middleware.ts          # JWT auth guard
    ├── lib/
    │   ├── auth.ts            # JWT utilities
    │   ├── db.ts              # Prisma singleton
    │   ├── mock-generator.ts  # Deterministic output generator
    │   └── openalex.ts        # OpenAlex proxy utilities
    ├── app/
    │   ├── page.tsx           # Landing page
    │   ├── (auth)/            # Login, register, forgot/reset password
    │   ├── (app)/             # Protected app shell
    │   │   └── app/
    │   │       ├── page.tsx           # Dashboard
    │   │       ├── create/            # Create output
    │   │       ├── library/           # Library
    │   │       ├── outputs/[id]/      # Output viewer
    │   │       │   └── tracker/       # Experiment tracker
    │   │       ├── radar/             # OpenAlex search
    │   │       └── settings/          # Settings
    │   └── api/               # Route handlers
    └── components/
        └── app/
            ├── Sidebar.tsx
            └── Topbar.tsx
```
