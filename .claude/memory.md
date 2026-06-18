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

## ECC Harness
- Harness audit script: `scripts/harness-audit.js`
- Run: `node scripts/harness-audit.js repo --format text`
- Baseline score: 17/39 (2026-06-17)
