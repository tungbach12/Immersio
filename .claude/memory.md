# Immersio — Project Memory

## What This Is
Language learning platform with AI roleplay scenarios, spaced-repetition flashcards, pronunciation practice, and dictionary.

## Stack

| Layer | Tech |
|---|---|
| Backend | ASP.NET Core 9, C#, Clean Architecture |
| Database | PostgreSQL + EF Core |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| AI | Groq, Gemini, Nvidia (LLM); Azure Speech (pronunciation) |
| Payments | PayOS (Vietnamese gateway) |
| Storage | Cloudinary (images) |
| Deploy | VPS (Docker Compose + Nginx) + Vercel (frontend) |

## Ports & URLs

| Service | URL |
|---|---|
| Backend API | http://localhost:5249 |
| Frontend dev | http://localhost:3000 |
| Swagger UI | http://localhost:5249/api/swagger |

## Architecture

```
immersioFe/          React SPA (Vercel)
src/
  Immersio.Domain/         Entities, domain exceptions
  Immersio.Application/    Services, DTOs, interfaces
  Immersio.Infrastructure/ EF Core, repositories, external APIs
  Immersio.WebApi/         Controllers, Program.cs, middleware
```

- All business logic in `Immersio.Application.Services`
- Controllers are thin: validate auth → call service → return `ApiResponse<T>`
- `GlobalExceptionMiddleware` maps domain exceptions to HTTP codes

## Auth Flow
- JWT access token (15 min) + refresh token (7 days) with rotation
- Frontend: `authService.fetchWithAuth()` auto-refreshes on 401
- Google OAuth supported (ClientId must match backend)

## Key Config Files
- `src/Immersio.WebApi/appsettings.json` — DB connection, JWT key, API keys (NOT committed)
- `immersioFe/.env` — `VITE_GOOGLE_CLIENT_ID`, `GROQ_API_KEY` (NOT committed)
- `.github/workflows/deploy.yml` — CI/CD: build frontend → push Docker image → SSH deploy to VPS

## Domain Entities
`User`, `Deck`/`Card` (SRS flashcards), `Scenario`/`ScenarioItem`/`ScenarioSession`/`SessionMessage` (AI roleplay), `UserPronunciationLog`, `SystemSetting`, `PaymentTransaction`

## Deployment
- Frontend → Vercel (auto from `main`)
- Backend → GHCR Docker image → VPS via SSH (`appleboy/ssh-action`)
- VPS: Docker Compose (`docker-compose.yml` at repo root) + Nginx reverse proxy

## Dev Defaults
- Default admin seeded on startup: `admin@immersio.com` / `Admin123!`
- EF Core migrations run automatically on startup
- `ThemeManager` in `App.tsx`: `/admin/*` routes always dark, student views always light

## Naming Conventions
- Frontend services: `immersioFe/src/services/*.ts` (plain TS, not hooks)
- Path alias: `@` → `src/` (configured in `vite.config.ts` and `tsconfig.json`)
- API base: `API_BASE` in `src/services/auth.ts`

## Scenario Voice System
- Admin config: `ScenarioBuilder.tsx` → `LANGUAGE_VOICES` map → saves `VoiceId` to DB
- Student playback: `ScenarioDetail.tsx` → `getVoiceForLanguage()` → TTS API
- Voice priority: `defaultVoice` param (from DB) > language-based fallback > default `en-US-JennyNeural`
- **Known bug fixed**: `getVoiceForLanguage()` now checks `defaultVoice` first; previously ignored it
- **Stale closure fix**: Pass `data.voiceId` directly from loaded scenario, not `scenario?.voiceId`

## Scenario Emotion GIFs
- Hosted on Cloudinary URLs (not local files)
- Seed data in `ScenarioService.cs` updates emotions for existing scenarios
- Seed does NOT overwrite `VoiceId` — only touches `EmotionsJson`

## Frontend UI Notes
- Chat panel height: `min-h-[38vh]` (was 280px, then 45vh — too tall)
- `ThemeManager` in `App.tsx`: `/admin/*` always dark, student always light

## Known Issues
- TypeScript IDE errors in `.tsx` files — pre-existing `@types/react` issue (TS7026/TS7016)
- `npx tsc --noEmit` passes clean — IDE-only, not caused by code changes

## ECC Harness

### Current Status (2026-06-20)

| Component | Status | Detail |
|---|---|---|
| Plugin | ✅ Active | `ecc@ecc` installed via marketplace |
| Rules — common | ✅ 9 files | `~/.claude/rules/ecc/common/` |
| Rules — web | ✅ 7 files | `~/.claude/rules/ecc/web/` (React, Vite, Next.js, CSS) |
| Rules — typescript | ✅ Active | `~/.claude/rules/ecc/typescript/` |
| Rules — react | ✅ Active | `~/.claude/rules/ecc/react/` |
| Rules — csharp | ✅ Active | `~/.claude/rules/ecc/csharp/` |
| Rules — java | ✅ Active | `~/.claude/rules/ecc/java/` |
| Rules — golang | ✅ Active | `~/.claude/rules/ecc/golang/` |
| Skills | ✅ ~118 skills | `~/.claude/skills/ecc/` (via plugin) |
| Agents | ✅ 67 agents | Plugin-loaded |
| Commands | ✅ 92 commands | Via `/plugin list ecc@ecc` |
| MCP — Firecrawl | ✅ Active | `~/.claude/.mcp.json` with API key |
| Hooks — global | ✅ 20+ scripts | Plugin hooks + DRY adapter |
| Hooks — project | ✅ 2 guards | `.claude/settings.json` (Write + Bash) |
| Full install guide | ✅ Created | `docs/ecc-harness-guide.md` (22 sections) |

### Audits
- Harness audit script: `scripts/harness-audit.js`
- Run: `node scripts/harness-audit.js repo --format text`
- Baseline: **17/39** (2026-06-17) → **39/39** (2026-06-20) — fully configured
