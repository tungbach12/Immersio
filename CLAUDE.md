# CLAUDE.md

This file is read by Claude Code at the start of every session. It defines the project context, enforced rules, and development workflow for the Immersio codebase.

---

## Project Overview

**Immersio** is a Vietnamese language learning platform with AI-powered roleplay scenarios, spaced-repetition flashcards, pronunciation practice, and a dictionary.

Two independently runnable parts:

| Part | Path | Tech | URL |
|---|---|---|---|
| Backend API | `src/` | ASP.NET Core 9, C#, PostgreSQL | `http://localhost:5249` |
| Frontend SPA | `immersioFe/` | React 19 + TypeScript + Vite | `http://localhost:3000` |
| Swagger UI | — | — | `http://localhost:5249/api/swagger` |

---

## Harness Configuration

This project uses the [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) harness. Configuration lives at three levels:

```
~/.claude/                   ← Global ECC harness (rules, skills, agents)
  rules/common/              ← Auto-enforced coding standards
  rules/ecc/web/             ← Web/frontend extensions
  skills/                    ← Slash command reference modules
  agents/                    ← Specialized subagents

.claude/                     ← Project-level config (checked into repo)
  settings.json              ← Bash permissions allowlist
  hooks/hooks.json           ← PreToolUse safety guards
  memory.md                  ← Persistent project context
  commands/run-audit.md      ← /run-audit slash command

CLAUDE.md                    ← This file — session briefing
```

### Auto-Enforced Rules

These rules apply to every task without being asked:

| Rule file | What it enforces |
|---|---|
| `coding-style.md` | Immutability, KISS/DRY/YAGNI, files <800 lines, functions <50 lines |
| `testing.md` | TDD mandatory (RED → GREEN → REFACTOR), 80% coverage minimum |
| `security.md` | No hardcoded secrets, parameterized queries, XSS/CSRF prevention |
| `git-workflow.md` | Conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`, …) |
| `development-workflow.md` | Research → Plan → TDD → Review → Commit pipeline |
| `code-review.md` | Code review after every write; CRITICAL issues block, HIGH warn |
| `web/design-quality.md` | No default template UI; intentional hierarchy, motion, typography |
| `web/performance.md` | Core Web Vitals targets; bundle budgets; compositor-only animation |

### Active Hooks

Defined in `.claude/hooks/hooks.json`, these run automatically:

**PreToolUse: Bash security guard**
- Blocks: `git push --force`, `git reset --hard`, `rm -rf /`, `DROP TABLE`, `DELETE FROM … WHERE 1`
- Warns: any command touching `appsettings.json` or `.env`

**PreToolUse: Sensitive file write guard**
- Warns before writing to `appsettings.json`, `.env`, or `secrets.*`
- Prompt: verify no secrets are being hardcoded

### Permissions Allowlist

Pre-approved in `.claude/settings.json` (no prompt required):
```
npm run lint/build/dev/ci/install
dotnet build/run/test/ef
git status/diff/log/add/commit/checkout/branch/fetch/pull
ls, find, Read(**), node scripts/harness-audit.js
```

Anything else will pause and ask permission first.

---

## Development Workflow

For every non-trivial task, follow this pipeline in order:

### 0. Research First (mandatory)
Before writing any new code:
- `gh search repos` / `gh search code` — find existing implementations
- Use `/ecc:documentation-lookup` for library/framework API behavior
- Check npm/PyPI/NuGet for existing packages before hand-rolling utilities

### 1. Plan
- Complex features: spawn the **planner** agent
- Simple bug fixes: use `EnterPlanMode` to draft an approach before touching files

### 2. TDD
- Write failing tests first (RED)
- Write minimal implementation to pass (GREEN)
- Refactor for quality (IMPROVE)
- Verify coverage ≥ 80%
- Use `/ecc:tdd-workflow` for step-by-step guidance

### 3. Implement
- Follow rules from `coding-style.md` (immutability, no magic numbers, early returns)
- Frontend: follow `web/coding-style.md` (feature-based file structure, semantic HTML, CSS tokens)
- Security-sensitive code (auth, payments, DB queries): use `/ecc:security-review` before continuing

### 4. Review
- After any code write: spawn **code-reviewer** agent
- After auth/payment/input handling: spawn **security-reviewer** agent
- If build fails: spawn **build-error-resolver** agent
- Use `/ecc:verification-loop` for multi-step validation after changes

### 5. Commit
```
<type>: <short description>

<optional body — explain the why, not the what>
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

---

## Skills by Task

Invoke with `/ecc:skill-name` or ask Claude to activate:

| Task | Skill |
|---|---|
| React components, hooks, context | `/ecc:react-patterns` |
| Vite config, plugins, HMR, env vars | `/ecc:vite-patterns` |
| REST API design (controllers) | `/ecc:api-design`, `/ecc:backend-patterns` |
| PostgreSQL queries or schema | `/ecc:postgres-patterns` |
| EF Core migrations | `/ecc:database-migrations` |
| TDD step-by-step | `/ecc:tdd-workflow` |
| E2E browser tests | `/ecc:e2e-testing` |
| Security audit | `/ecc:security-review` |
| Multi-step post-change verification | `/ecc:verification-loop` |
| TypeScript/JS naming & structure | `/ecc:coding-standards` |
| Library or framework docs | `/ecc:documentation-lookup` |
| Deep multi-source research | `/ecc:deep-research` |
| Harness health check | `/run-audit` |

---

## Agents

Claude spawns these automatically or on request:

| Agent | Trigger |
|---|---|
| `planner` | Complex feature requests, multi-file changes |
| `code-reviewer` | After writing or modifying any code |
| `tdd-guide` | New features, bug fixes |
| `security-reviewer` | Auth, payments, DB queries, user input handling |
| `build-error-resolver` | `dotnet build` or `npm build` failures |
| `react-reviewer` | Changes to `.tsx`/`.jsx` files |
| `typescript-reviewer` | Changes to `.ts` files |
| `e2e-runner` | Critical user flows |
| `refactor-cleaner` | Dead code removal, module extraction |

Spawn multiple agents in parallel when their work is independent.

---

## Backend (ASP.NET Core)

### Commands

```bash
dotnet run --project src/Immersio.WebApi              # API on http://localhost:5249
dotnet build src/Immersio.sln
dotnet test

# EF Core migrations
dotnet ef migrations add <Name> \
  --project src/Immersio.Infrastructure \
  --startup-project src/Immersio.WebApi
dotnet ef database update \
  --project src/Immersio.Infrastructure \
  --startup-project src/Immersio.WebApi
```

### Configuration

Copy `src/Immersio.WebApi/appsettings.example.json` → `appsettings.json` (not committed):

| Key | Purpose |
|---|---|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Jwt:Key` | ≥32-byte base64 secret |
| `Google:ClientId` | Google OAuth (must match frontend) |
| `Groq:ApiKey`, `Gemini:ApiKey`, `Nvidia:ApiKey` | LLM providers |
| `Azure:Speech` | Pronunciation scoring |
| `Cloudinary` | Image uploads |
| `Email:Smtp` | Gmail SMTP |
| `PayOS` | Vietnamese payment gateway |

### Architecture

Clean Architecture — four projects:

| Project | Role |
|---|---|
| `Immersio.Domain` | Entities, domain exceptions |
| `Immersio.Application` | Service interfaces + implementations, DTOs |
| `Immersio.Infrastructure` | EF Core `ApplicationDbContext`, repositories, external API wrappers |
| `Immersio.WebApi` | Controllers, `Program.cs` DI wiring, `GlobalExceptionMiddleware` |

- All business logic lives in `Immersio.Application.Services`
- Controllers are thin: validate auth → call service → return `ApiResponse<T>`
- `GlobalExceptionMiddleware` maps `NotFoundException`, `UnauthorizedException`, `ConflictException` → HTTP codes
- EF Core migrations + seed data (admin user, default scenarios) run automatically on startup

**Auth flow**: JWT access tokens (15 min) + refresh tokens (7 days) with rotation.

**Domain entities**: `User`, `Deck`/`Card` (SRS), `Scenario`/`ScenarioItem`/`ScenarioSession`/`SessionMessage` (AI roleplay), `UserPronunciationLog`, `SystemSetting`, `PaymentTransaction`.

---

## Frontend (React / Vite)

### Commands

```bash
cd immersioFe
npm install
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build → dist/
npm run lint       # TypeScript type-check (tsc --noEmit)
```

Copy `immersioFe/.env.example` → `.env` (not committed):

| Key | Purpose |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth (must match backend) |
| `GROQ_API_KEY` | Groq API key for server-side TTS/chat proxy |

### Architecture

**Dev server**: `server.ts` runs Vite middleware + Express (`api/app.ts`) in parallel. Express proxies `/api/tts` and `/api/chat` to Groq to keep the API key server-side.

**API base**: `API_BASE` in `src/services/auth.ts` — `http://localhost:5249` locally, `""` (same-origin) in production.

**Routing** (React Router v7, role-based):
- `/student/*` — student dashboard, scenarios, flashcards, vocal lab, dictionary, profile, subscription
- `/admin/*` — admin dashboard, users, scenario builder, AI tuning

**Theme**: `ThemeManager` in `App.tsx` adds `class="dark"` to `<html>` for all `/admin` routes. Admin is always dark; student views are always light.

**Services layer** (`src/services/`): Plain TypeScript modules (not hooks). All authenticated calls go through `authService.fetchWithAuth()`, which auto-refreshes the JWT on 401 and unwraps the `{ success, data, error }` envelope.

**UI stack**: Radix UI primitives, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, `motion/react`, `recharts`.

**Path alias**: `@` → `src/` (configured in `vite.config.ts` and `tsconfig.json`).

**Deployment**: Vercel. `vercel.json` routes all non-`/api` paths to the SPA. `api/index.ts` is the Vercel serverless function entry.

---

## Deployment

| Target | How |
|---|---|
| Frontend | Vercel — auto-deploys from `main` |
| Backend | GitHub Actions → GHCR Docker image → SSH to VPS |
| VPS | Docker Compose + Nginx reverse proxy |

CI/CD: `.github/workflows/deploy.yml`

---

## Harness Health

Run `/run-audit` (or `node scripts/harness-audit.js repo --format text`) to score the repo against ECC best practices.

Baseline: **17/39** (2026-06-17). Failing checks indicate missing hooks, skills, or agent configurations to add.
