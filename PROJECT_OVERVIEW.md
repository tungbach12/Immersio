# Immersio — Project Overview (Context Document)

> Tài liệu này được tạo tự động từ source code thực tế (2026-07-08).  
> Mục đích: nạp context nhanh cho AI assistant khi bắt đầu session mới.

---

## 1. Tổng quan dự án

**Immersio** là nền tảng học ngôn ngữ tiếng Việt, được xây dựng với AI-powered roleplay scenarios, spaced-repetition flashcards, pronunciation practice, và từ điển tích hợp.

| Thành phần | Công nghệ | URL local |
|---|---|---|
| Backend API | ASP.NET Core 9, C#, PostgreSQL | `http://localhost:5249` |
| Frontend SPA | React 19 + TypeScript + Vite | `http://localhost:3000` |
| Swagger UI | — | `http://localhost:5249/api/swagger` |

**Trạng thái hiện tại (2026-07-08):**
- Branch: `main`, sync với origin
- Last commit: `4b2277a` — per-task reasoning effort configuration
- Working tree: clean (có `immersioFe/dist.tar.gz` untracked — artifact build)

---

## 2. Cách chạy project

### Backend
```bash
dotnet run --project src/Immersio.WebApi
# hoặc với profile dev
dotnet run --project src/Immersio.WebApi --launch-profile Development
```

### Frontend
```bash
cd immersioFe
npm install
npm run dev        # dev server port 3000
npm run build      # production build → dist/
npm run lint       # TypeScript type-check (tsc --noEmit)
```

### EF Core Migrations
```bash
dotnet ef migrations add <Name> \
  --project src/Immersio.Infrastructure \
  --startup-project src/Immersio.WebApi

dotnet ef database update \
  --project src/Immersio.Infrastructure \
  --startup-project src/Immersio.WebApi
```

---

## 3. Cấu trúc thư mục

```
Immersio/
├── src/                          ← Backend (ASP.NET Core)
│   ├── Immersio.sln
│   ├── Immersio.Domain/          ← Entities, domain exceptions
│   ├── Immersio.Application/     ← Services, DTOs, interfaces
│   ├── Immersio.Infrastructure/  ← EF Core, external APIs
│   └── Immersio.WebApi/          ← Controllers, Program.cs, middleware
│
├── immersioFe/                   ← Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           ← UI components (Card, Button, Slider...)
│   │   ├── pages/                ← student/ và admin/ pages
│   │   ├── services/             ← API service modules
│   │   └── App.tsx               ← Router + ThemeManager
│   ├── server.ts                 ← Dev server (Vite + Express)
│   ├── api/
│   │   ├── app.ts                ← Express routes (TTS/chat proxy)
│   │   └── index.ts              ← Vercel serverless entry
│   └── package.json
│
├── .github/workflows/deploy.yml  ← CI/CD pipeline
├── CLAUDE.md                     ← Instructions cho Claude Code
└── PROJECT_OVERVIEW.md           ← File này
```

---

## 4. Backend — Clean Architecture

### 4.1 Bốn project layers

| Project | Vai trò | Dependencies |
|---|---|---|
| `Immersio.Domain` | Entities thuần, domain exceptions | Không có |
| `Immersio.Application` | Service interfaces + implementations, DTOs | Domain |
| `Immersio.Infrastructure` | EF Core DbContext, external API wrappers | Domain + Application |
| `Immersio.WebApi` | Controllers, Program.cs, Middleware | Infrastructure |

### 4.2 Domain Entities (`src/Immersio.Domain/Entities/`)

| Entity | Mô tả | Quan hệ chính |
|---|---|---|
| `User` | User (username, email, passwordHash, role, subscriptionTier, XP, streak, CEFR level) | HasMany RefreshToken, ScenarioSession, Deck, UserPronunciationLog |
| `Scenario` | Roleplay scenario (title, language, level, category, contextPrompt, emotionsJson) | HasMany ScenarioItem, ScenarioSession |
| `ScenarioSession` | Một lần chơi scenario | BelongsTo User + Scenario; HasMany SessionMessage |
| `SessionMessage` | Một tin nhắn trong session (role: "user"/"model", text, correctionText, correctionExplanation) | BelongsTo ScenarioSession |
| `ScenarioItem` | Item tương tác trong navigation scenario (name, price, icon) | BelongsTo Scenario |
| `Deck` | Flashcard deck của user | BelongsTo User; HasMany Card |
| `Card` | Flashcard với SM-2 SRS (front, back, explanation, tag, repetitions, easinessFactor, intervalDays, nextReviewDate) | BelongsTo Deck |
| `RefreshToken` | JWT refresh token (token, userId, expiresAt, revokedAt) | BelongsTo User |
| `PasswordResetCode` | OTP 6 chữ số cho forgot-password (email, codeHash, expiresAt, attemptCount) | Linked by email |
| `PaymentTransaction` | PayOS payment record (txnRef, userId, tier, billingCycle, amount, isPaid) | BelongsTo User |
| `SystemSetting` | Key-value config (AI model names, endpoints, reasoning efforts, etc.) | Standalone |
| `UserPronunciationLog` | Pronunciation practice log (phrase, transcript, score, practicedAt) | BelongsTo User |

**Quy tắc domain:**
- Mọi entity dùng **soft-delete** (`IsDeleted` flag), không xóa thật
- `User.ActiveSubscriptionTier` — computed property: trả về Basic nếu subscription đã hết hạn
- `Card.Review(quality 0-5)` — implement SM-2 algorithm trong domain model
- `ScenarioSession.Complete(feedback)` — đánh dấu IsFinished + set FinishedAt

### 4.3 Application Services (`src/Immersio.Application/Services/`)

#### AuthService
- `RegisterAsync` — validate unique email/username, hash password, tạo RefreshToken, gửi welcome email; user đầu tiên tự động thành Admin
- `LoginAsync` — verify password, phát JWT access token + refresh token
- `LoginWithGoogleAsync` — validate Google ID token qua `GoogleJsonWebSignature`, auto-create user nếu mới
- `RefreshTokenAsync` — rotation: revoke old token, phát cặp mới
- `RevokeTokenAsync` — set RevokedAt
- `ForgotPasswordAsync` — tạo OTP 6 chữ số, hash và lưu vào DB, gửi email; không tiết lộ email có tồn tại hay không (anti-enumeration)
- `ResetPasswordAsync` — verify OTP (max 5 attempts, 10 min expiry), đổi password, revoke tất cả refresh token hiện tại
- `UpdateSettingsAsync` — cập nhật notification preferences
- `UpgradeSubscriptionAsync` — update tier + expiresAt, gửi receipt email

#### ScenarioService
- `GetScenariosAsync` / `GetScenarioByIdAsync` — CRUD read
- `StartSessionAsync` — tạo ScenarioSession, nếu targetLanguage khác scenario.Language thì dịch initialMessage qua LLM, auto-append model message đầu tiên; lưu language vào `ConcurrentDictionary<SessionId, Language>`
- `SendMessageAsync` — pipeline: (1) AnalyzeGrammar, (2) append user message kèm correction, (3) GenerateChatResponse với emotion tagging, (4) parse `[EMOTION: xxx]` từ reply, (5) append model reply. Return `ChatOutputResponse(reply, correction?, emotion)`
- `CompleteSessionAsync` — GenerateSessionFeedback + GenerateFlashcards, mark session Complete
- `GenerateCustomFlashcardsAsync` — generate theo categories được chọn
- `SeedScenariosAsync` — seed 4 scenarios mặc định (Shibuya Navigation, Konbini Run, Ordering Coffee, Ordering Dim Sum); idempotent
- `CreateScenarioAsync` / `UpdateScenarioAsync` / `DeleteScenarioAsync` / `AddScenarioItemAsync` — Admin CRUD

#### SrsService (Spaced Repetition)
- `CreateDeckAsync` / `GetDecksAsync` / `DeleteDeckAsync`
- `GetReviewCardsAsync` — trả cards có `NextReviewDate <= DateTime.UtcNow`
- `AddCardAsync` — enforce limit 50 cards/ngày cho Basic tier
- `AddCardsAsync` — bulk add, gracefully cap tại 50 cho Basic (không throw nếu partially added)
- `ReviewCardAsync` — apply SM-2 algorithm, update interval + nextReviewDate
- `DeleteCardAsync`

#### PronunciationService
- `LogPronunciationAsync` — log practice, +50 XP, +0.1 learning hours, recalculate CEFR
- `GetUserLogsAsync`
- `AnalyzeCefrLevelAsync` — time-decay weighted scoring:
  - Interactive Comprehension (55%): completed scenarios theo CEFR level, decay λ=0.25
  - Speech Fluency (45%): pronunciation scores, decay γ=0.15
  - Pronunciation cap: nếu avg pronunciation < 50% thì cap CEFR ở A2
  - Active vocabulary: unique words matched giữa phrase và transcript
  - Gọi LLM để generate AI-personalized suggestions
- `AssessPronunciationAsync` — gọi Azure Speech API (phoneme-level), parallel với Groq Whisper transcription; fallback mock 95% nếu Azure key chưa set
- `GeneratePhraseAsync` — delegate sang LlmService

#### SubscriptionService
- `CreatePaymentUrlAsync` — tạo PaymentTransaction, gọi PayOS để lấy checkout URL; pricing: Plus 69k/tháng, Premium 199k/tháng, yearly -20%
- `HandlePaymentReturnAsync` — idempotent; verify status từ PayOS (không trust query string), update subscription nếu PAID, gửi receipt email

#### AdminService
- `GetDashboardStatsAsync` — totalUsers, activeSessions, revenue (từ subscription counts), averageDuration (trung bình completed sessions), growthData 7 ngày, sessionData 7 ngày
- `GetUsersAsync` / `UpdateUserSubscriptionAsync` / `BanUserAsync`
- `GetAiSettingsAsync` — đọc từ SystemSettings table, migrate legacy ReasoningEffort key, auto-heal deprecated model names
- `SaveAiSettingsAsync` — lưu tất cả settings vào SystemSettings table

### 4.4 Infrastructure Services (`src/Immersio.Infrastructure/Services/`)

#### LlmService
Multi-provider OpenAI-compatible API. Model config (model name, endpoint, reasoning effort) lưu trong `SystemSettings` DB.

**Provider resolution** (qua endpoint URL):
- `groq.com` → dùng `Groq:ApiKey`
- `nvidia.com` / `nvidia` → dùng `Nvidia:ApiKey`
- `stepfun.com` → dùng `StepFun:ApiKey`
- `opencode.ai` → dùng `OpenCode:ApiKey`
- fallback → Groq

**Per-task model config** (từ DB):

| DB Key | LLM Task |
|---|---|
| `ModelChat` + `ReasoningEffortChat` | NPC roleplay replies |
| `ModelGrammar` + `ReasoningEffortGrammar` | Grammar correction |
| `ModelFeedback` + `ReasoningEffortFeedback` | Session feedback + CEFR analysis |
| `ModelFlashcard` + `ReasoningEffortFlashcard` | Flashcard generation |
| `ModelPhrase` + `ReasoningEffortPhrase` | Pronunciation phrase generation |

**Các methods:**
- `GenerateChatResponseAsync` — NPC reply với emotion tagging `[EMOTION: xxx]`; temperature 0.7; max 1024 tokens
- `AnalyzeGrammarAsync` — JSON mode; temperature 0.2; returns `{corrected, explanation}`; lenient với spoken speech
- `GenerateSessionFeedbackAsync` — 2-3 paragraphs feedback; temperature 0.7
- `GenerateFlashcardsAsync` — JSON mode; 3-15 cards; 3 types: vocab/grammar/sentence (cloze deletion); temperature 0.2
- `GenerateCustomFlashcardsAsync` — như trên nhưng theo categories được chọn
- `GenerateCefrFeedbackAsync` — JSON mode; returns `{statusMessage, suggestions[]}`; temperature 0.2
- `TranscribeAudioAsync` — Groq Whisper `whisper-large-v3`; hardcoded Groq endpoint
- `GeneratePronunciationPhraseAsync` — JSON mode; returns `{phrase, translation, explanation}`
- `LookupWordAsync` — JSON mode; bilingual dictionary; returns 7 fields

#### TokenService
- `GenerateAccessToken(User)` — HMAC-SHA256 JWT, claims: NameIdentifier, Email, Name, Role, Jti; expiry từ `Jwt:AccessTokenExpiryMinutes` (default 15 min)
- `GenerateRefreshToken()` — 64 bytes random → Base64
- `GetPrincipalFromExpiredToken(token)` — validate không check lifetime, dùng để extract userId khi refresh

#### PayOsService
- `CreatePaymentLinkAsync` — HMAC-SHA256 signature (fields sorted alphabetically), POST `/v2/payment-requests`
- `GetPaymentStatusAsync` — GET `/v2/payment-requests/{orderCode}`

#### Các services khác
- `PasswordHasher` — BCrypt hash/verify
- `CloudinaryService` — upload image lên Cloudinary CDN
- `SmtpEmailService` — Gmail SMTP, send welcome/OTP/receipt emails

### 4.5 Controllers (`src/Immersio.WebApi/Controllers/`)

| Controller | Base Route | Auth |
|---|---|---|
| `AuthController` | `api/auth` | Mixed |
| `ScenariosController` | `api/scenarios` | [Authorize], Admin ops cần Role=Admin |
| `FlashcardsController` | `api/flashcards` | [Authorize] |
| `PracticeController` | `api/practice` | [Authorize], TTS + generate-phrase là AllowAnonymous |
| `SubscriptionController` | `api/subscription` | [Authorize], payos-return là AllowAnonymous |
| `AdminController` | `api/admin` | [Authorize(Roles="Admin")] |
| `UploadController` | `api/upload` | [Authorize] |

**API Endpoints đầy đủ:**

```
# Auth
POST   api/auth/register
POST   api/auth/login
POST   api/auth/google
POST   api/auth/refresh
POST   api/auth/revoke          [Authorize]
POST   api/auth/forgot-password
POST   api/auth/reset-password
GET    api/auth/me              [Authorize]
POST   api/auth/settings        [Authorize]

# Scenarios
GET    api/scenarios            [Authorize]
GET    api/scenarios/{id}       [Authorize]
POST   api/scenarios            [Admin]
PUT    api/scenarios/{id}       [Admin]
DELETE api/scenarios/{id}       [Admin]
POST   api/scenarios/{id}/items [Admin]
POST   api/scenarios/sessions/start              [Authorize]
POST   api/scenarios/sessions/{id}/chat          [Authorize]
POST   api/scenarios/sessions/{id}/finish        [Authorize]
POST   api/scenarios/sessions/{id}/flashcards    [Authorize]

# Flashcards
POST   api/flashcards/decks                      [Authorize]
GET    api/flashcards/decks                      [Authorize]
DELETE api/flashcards/decks/{id}                 [Authorize]
GET    api/flashcards/decks/{id}/review          [Authorize]
POST   api/flashcards/decks/{id}/cards           [Authorize]
POST   api/flashcards/cards/{id}/review          [Authorize]
DELETE api/flashcards/cards/{id}                 [Authorize]

# Practice
POST   api/practice/pronunciation-log            [Authorize]
GET    api/practice/pronunciation-history        [Authorize]
GET    api/practice/cefr-analysis               [Authorize]
POST   api/practice/assess-pronunciation         [Authorize] multipart/form-data
POST   api/practice/tts                          AllowAnonymous
POST   api/practice/generate-phrase             AllowAnonymous
POST   api/practice/dictionary-lookup           [Authorize]

# Subscription
POST   api/subscription/upgrade                  [Authorize]
POST   api/subscription/create-payment           [Authorize]
GET    api/subscription/payos-return             AllowAnonymous

# Admin
GET    api/admin/stats                           [Admin]
GET    api/admin/users                           [Admin]
POST   api/admin/users/{id}/subscription         [Admin]
POST   api/admin/users/{id}/ban                  [Admin]
GET    api/admin/ai-tuning                       [Admin]
POST   api/admin/ai-tuning                       [Admin]

# Upload
POST   api/upload/image                          [Authorize] multipart, max 10MB
```

### 4.6 Response Format

Tất cả API đều wrap trong `ApiResponse<T>`:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": null
}
```

**GlobalExceptionMiddleware** map exceptions:
- `UnauthorizedException` → 401
- `NotFoundException` → 404
- `ConflictException` → 409
- `ValidationException` → 422
- Unhandled → 500 (stack trace chỉ hiện trong Development)

### 4.7 Auth Flow chi tiết

```
Register/Login → JWT Access Token (15 min) + Refresh Token (7 days, stored in DB hashed)
                                    ↓
                         fetchWithAuth (frontend)
                                    ↓
                    401 → POST api/auth/refresh (gửi cả 2 tokens)
                                    ↓
                    Backend: validate refresh token, revoke old, issue new pair
                                    ↓
                    Retry original request với token mới
                                    ↓
                    Refresh fail → clearSession() + redirect /login
```

**Google OAuth:** credential token → `GoogleJsonWebSignature.ValidateAsync` → auto-create user nếu mới (username = email prefix, thêm số nếu trùng)

### 4.8 Configuration (appsettings.json)

```json
{
  "ConnectionStrings": { "DefaultConnection": "PostgreSQL connection string" },
  "Jwt": {
    "Key": "≥32 byte base64 secret",
    "Issuer": "...",
    "Audience": "...",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "Google": { "ClientId": "..." },
  "Groq": { "ApiKey": "..." },
  "Nvidia": { "ApiKey": "..." },
  "StepFun": { "ApiKey": "..." },
  "OpenCode": { "ApiKey": "..." },
  "Azure": {
    "Speech": { "ApiKey": "...", "Region": "centralindia", "Endpoint": "..." }
  },
  "Cloudinary": { "CloudName": "...", "ApiKey": "...", "ApiSecret": "..." },
  "Email": { "Smtp": { "Host": "smtp.gmail.com", "Port": 587, "Username": "...", "Password": "..." } },
  "PayOS": { "ClientId": "...", "ApiKey": "...", "ChecksumKey": "...", "ReturnUrl": "...", "CancelUrl": "..." }
}
```

**Startup sequence** (`Program.cs`):
1. Register DI (DbContext, services, HttpClients)
2. Configure JWT Bearer auth
3. Configure Swagger + CORS (AllowAll)
4. `await db.Database.MigrateAsync()` — auto-apply pending migrations
5. `SeedScenariosAsync()` — seed 4 default scenarios (idempotent)
6. Seed admin user `admin@immersio.com / Admin123!` nếu chưa có
7. Middleware pipeline: ForwardedHeaders → GlobalException → CORS → Swagger → Auth → Controllers

---

## 5. Frontend — React 19 + Vite

### 5.1 Routing (`src/App.tsx`)

```
/                    → Intro page
/intro               → Intro page
/login               → Login (email + Google OAuth)
/register            → Register
/forgot-password     → ForgotPassword (OTP flow)
/onboarding          → Onboarding
/payment/payos-return → PayOsReturn

/student/            → AppLayout (light theme)
  dashboard          → StudentDashboard
  scenarios          → Scenarios list
  scenarios/:id      → ScenarioDetail (roleplay chat)
  vocal-lab          → VocalLab (pronunciation)
  flashcards         → FlashcardsPage
  flashcards/:deckId → FlashcardsPage (specific deck)
  dictionary         → DictionaryPage
  profile            → Profile
  subscription       → Subscription (PayOS checkout)
  notifications      → Notifications
  help               → HelpCenter

/admin/              → AppLayout (dark theme)
  dashboard          → AdminDashboard
  users              → UsersManagement
  scenarios          → ScenarioBuilder
  ai-tuning          → AITuning
```

**ThemeManager** — route-driven: `/admin/*` → dark class trên `<html>`, còn lại → light.

### 5.2 Services layer (`src/services/`)

Tất cả authenticated calls đều qua `authService.fetchWithAuth()` — auto-refresh JWT on 401, auto-unwrap `{success, data}` envelope.

```
API_BASE = "http://localhost:5249" (local) | "" (production same-origin)
```

| File | Singleton | Endpoints chính |
|---|---|---|
| `auth.ts` | `authService` | /api/auth/* — login, register, Google, refresh, revoke, me, settings |
| `admin.ts` | `adminService` | /api/admin/* — stats, users, ai-tuning; /api/scenarios (CRUD) |
| `scenario.ts` | `scenarioService` | /api/scenarios — list, detail, sessions (start/chat/finish/flashcards) |
| `decks.ts` | `decksService` | /api/flashcards/decks/* — CRUD decks, cards, reviews |
| `practice.ts` | `practiceService` | /api/practice/* — pronunciation log, history, CEFR, assess, phrase, dictionary |
| `subscription.ts` | `subscriptionService` | /api/subscription/* — create-payment, payos-return |
| `upload.ts` | `uploadService` | /api/upload/image — Cloudinary upload |

**Session storage:** `localStorage` — accessToken, refreshToken, user JSON

### 5.3 State management

Không có global state library. Pattern:
1. Service file export plain async functions / singleton object
2. Page component gọi service trong `useEffect`
3. Manage `loading`/`error`/data bằng `useState`
4. `authService.getUser()` đọc sync từ localStorage; `AppLayout` re-fetch `/me` để sync

### 5.4 UI Stack

| Thư viện | Version | Vai trò |
|---|---|---|
| `react` / `react-dom` | 19 | Core |
| `react-router-dom` | 7.13 | Routing |
| `motion` (framer-motion) | 12.23 | Animations, layout transitions |
| `lucide-react` | 0.546 | Icons |
| `recharts` | 3.7 | Admin charts (AreaChart, BarChart) |
| `@radix-ui/react-slider` | 1.3 | Accessible sliders |
| `@radix-ui/react-switch` | 1.2 | Accessible toggles |
| `@radix-ui/react-slot` | 1.2 | Component composition |
| `tailwindcss` v4 + `@tailwindcss/vite` | 4.1 | Utility CSS |
| `class-variance-authority` | 0.7 | Component variants |
| `clsx` + `tailwind-merge` | — | Conditional classes |

**Design system:** Dark glassmorphism (`backdrop-blur-2xl`, `bg-slate-950/45`, `border-white/5`). Admin = always dark. Student = always light.

**Vite config:**
- Path alias: `@` → `./src`
- HMR: disabled khi `DISABLE_HMR=true` (dùng trong AI Studio)
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`

### 5.5 Các trang quan trọng

**Admin:**
- `AdminDashboard` — KPI stat cards (totalUsers, activeSessions, revenue, avgDuration) + recharts AreaChart (user growth 7 ngày) + BarChart (sessions/ngày)
- `AITuning` — Global system prompt textarea, grammar/vocab sensitivity sliders, slang toggle, speech speed selector, LLM endpoint input, 5 model selectors (Chat/Grammar/Feedback/Flashcard/Phrase) mỗi cái có reasoning effort dropdown (none/low/medium/high/xhigh), 4 quick presets (Groq/NVIDIA/StepFun/OpenCode Zen) + Custom
- `UsersManagement` — Danh sách users, update subscription tier, ban user
- `ScenarioBuilder` — CRUD scenarios, thêm items

**Student:**
- `ScenarioDetail` — Roleplay chat UI; NPC hiển thị emotion GIFs (idle/happy/angry); real-time grammar correction hiển thị inline; finish session → feedback + flashcard suggestions
- `VocalLab` — Record voice, gửi lên Azure Speech để assess pronunciation; hiển thị phoneme-level scores từng chữ; generate phrase từ LLM; CEFR analysis card với bar charts
- `FlashcardsPage` — List decks, review mode (flip card, SM-2 quality rating 0-5)
- `DictionaryPage` — Lookup từ qua LLM, hiển thị phonetic/partOfSpeech/definition/example
- `Subscription` — Pricing cards (Basic/Plus/Premium), PayOS checkout flow

### 5.6 Dev server architecture

```
server.ts  →  tsx watch
              ├── Vite middleware (React SPA + HMR)
              └── Express app (api/app.ts)
                  ├── POST /api/tts     → proxy to Groq TTS (keep API key server-side)
                  └── POST /api/chat    → proxy to Groq chat
```

Production trên Vercel: `api/index.ts` là serverless function entry, `vercel.json` route tất cả non-`/api` paths về SPA.

---

## 6. AI System (LLM Integration)

### 6.1 Admin-configurable model settings

Lưu trong `SystemSettings` DB table (key-value), admin có thể thay đổi qua `/admin/ai-tuning`:

| Setting Key | Default | Mô tả |
|---|---|---|
| `LlmEndpoint` | NVIDIA Integrate API | Endpoint của LLM provider |
| `ModelChat` | `meta/llama-4-maverick-17b-128e-instruct` | NPC roleplay |
| `ModelGrammar` | `nvidia/nemotron-mini-4b-instruct` | Grammar correction |
| `ModelFeedback` | `mistralai/mistral-large-3-675b-instruct-2512` | Session feedback + CEFR |
| `ModelFlashcard` | `qwen/qwen3-coder-480b-a35b-instruct` | Flashcard generation |
| `ModelPhrase` | `nvidia/nemotron-mini-4b-instruct` | Pronunciation phrases |
| `ReasoningEffortChat` | `none` | none/low/medium/high/xhigh |
| `ReasoningEffortGrammar` | `none` | — |
| `ReasoningEffortFeedback` | `none` | — |
| `ReasoningEffortFlashcard` | `none` | — |
| `ReasoningEffortPhrase` | `none` | — |
| `SystemPrompt` | Default tutor prompt | Global system prompt |
| `GrammarSensitivity` | `75` | 0-100 |
| `VocabSensitivity` | `50` | 0-100 |
| `EnableSlang` | `true` | boolean |
| `SpeedOfSpeech` | `1.0x (Normal)` | 0.8x/1.0x/1.2x |

### 6.2 Quick Presets

| Preset | Endpoint | Chat | Grammar | Feedback | Flashcard | Phrase |
|---|---|---|---|---|---|---|
| Groq Default | groq.com | llama-3.3-70b | llama-3.3-70b | llama-3.3-70b | llama-3.3-70b | llama-3.3-70b |
| NVIDIA NIM | nvidia.com | nemotron-mini-4b | nemotron-mini-4b | mistral-large-3-675b | qwen3-coder-480b | nemotron-mini-4b |
| StepFun MoE | stepfun.com | step-3.5-flash | step-3.5-flash | step-3.5-flash | step-3.5-flash | step-3.5-flash |
| OpenCode Zen | opencode.ai | mimo-v2.5-free | mimo-v2.5-free | deepseek-v4-flash | deepseek-v4-flash | mimo-v2.5-free |

### 6.3 Flashcard Types (3 polymorphic)

| Type | Khi nào dùng | Front | Back |
|---|---|---|---|
| `vocab` | Từ vựng user gặp/mắc lỗi | word | meaning (Vietnamese) |
| `grammar` | Lỗi ngữ pháp của user | title (tên cấu trúc) | usage (Vietnamese) |
| `sentence` | Idiom/collocation (Cloze deletion) | full_sentence | translation (Vietnamese) |

### 6.4 CEFR Scoring Algorithm

```
Unified Score = 0.55 × InteractiveComprehension + 0.45 × SpeechFluency

InteractiveComprehension:
  - Lấy danh sách completed scenarios theo thứ tự thời gian
  - baselineScore theo level: A1=20, A2=40, B1=60, B2=80, C1=95, C2=100
  - Time-decay weight: exp(-0.25 × (N-1-i))   [mới hơn = weight cao hơn]
  - Weighted average

SpeechFluency:
  - Lấy tất cả pronunciation logs theo thứ tự thời gian
  - Time-decay weight: exp(-0.15 × (N-1-j))
  - Weighted average của scores

CEFR Level Mapping:
  ≤15 → A1 | ≤35 → A2 | ≤60 → B1 | ≤80 → B2 | ≤95 → C1 | >95 → C2
  
Pronunciation Cap: nếu avgPronunciation < 50% → cap ở A2
Unassigned: nếu chưa có session lẫn pronunciation log nào
```

---

## 7. Subscription & Payment

### 7.1 Subscription Tiers

| Tier | Giá tháng | Giá năm (−20%) | Giới hạn |
|---|---|---|---|
| Basic | Free | — | 50 flashcards/ngày |
| Plus | 69,000đ | 662,400đ | Không giới hạn |
| Premium | 199,000đ | 1,910,400đ | Không giới hạn + features cao cấp |

### 7.2 Payment Flow

```
1. User chọn tier + cycle → POST /api/subscription/create-payment
2. Backend tạo PaymentTransaction record + gọi PayOS API
3. PayOS trả về checkoutUrl → Frontend redirect
4. User thanh toán trên PayOS portal
5. PayOS redirect về returnUrl (GET /api/subscription/payos-return?orderCode=...)
6. Backend verify authoritative status từ PayOS (không trust query string)
7. Nếu PAID: update user.SubscriptionTier + SubscriptionExpiresAt + gửi receipt email
```

---

## 8. Deployment

| Target | Cách deploy |
|---|---|
| Frontend | Vercel — auto-deploy từ `main` branch |
| Backend | GitHub Actions → build Docker image → push GHCR → SSH deploy to VPS |
| VPS | Docker Compose + Nginx reverse proxy |

**CI/CD:** `.github/workflows/deploy.yml`

**Vercel config:** `vercel.json` route tất cả non-`/api` paths về SPA (`index.html`).

---

## 9. Seed Data

4 scenarios được seed mặc định khi DB trống:

| Title | Language | Level | Category |
|---|---|---|---|
| Discovery: Shibuya Navigation | English | Beginner | Navigation |
| Konbini Late Night Run | Japanese | Intermediate | Travel |
| Ordering Coffee (English) | English | Beginner | Travel |
| Ordering Dim Sum in Shanghai | Chinese | Beginner | Travel |

Scenario "Ordering Coffee" có emotion GIFs: `idle.gif`, `happy.gif`, `angry.gif` (hosted trên Cloudinary).

Admin user được seed: `admin@immersio.com / Admin123!` (**chỉ cho dev — phải xóa reset logic trước production**).

---

## 10. Các quyết định kiến trúc quan trọng

| Quyết định | Lý do |
|---|---|
| Clean Architecture 4 layers | Tách biệt concerns, dễ test, swap infra |
| Soft-delete (`IsDeleted`) | Không mất data, audit trail |
| SM-2 SRS trong Domain | Business logic thuần, dễ unit test |
| SystemSettings table cho AI config | Admin thay đổi runtime không cần redeploy |
| Per-task reasoning effort (5 fields) | Mỗi LLM task có nhu cầu reasoning khác nhau |
| Provider detection qua endpoint URL | Admin chỉ cần đổi endpoint, không cần UI riêng cho từng provider |
| Token rotation (refresh) | Revoke token cũ sau mỗi lần refresh để phát hiện token theft |
| Anti-enumeration trong forgot-password | Luôn trả response giống nhau dù email tồn tại hay không |
| Time-decay CEFR scoring | Progress gần đây có trọng số cao hơn, phản ánh level thực tế hơn |
| Mock fallback cho Azure Speech | Dev có thể test VocalLab không cần Azure key |
| ConcurrentDictionary cho session language | Lưu language selection trong memory thay vì DB để tránh migration |
| fetchWithAuth monkey-patch response.json() | Auto-unwrap `{success, data}` envelope ở một nơi duy nhất |

---

## 11. Files quan trọng cần biết

| File | Vai trò |
|---|---|
| `src/Immersio.WebApi/Program.cs` | DI wiring, middleware pipeline, startup seed |
| `src/Immersio.Infrastructure/Services/LlmService.cs` | Toàn bộ AI integration |
| `src/Immersio.Application/Services/ScenarioService.cs` | Roleplay session pipeline |
| `src/Immersio.Application/Services/PronunciationService.cs` | CEFR algorithm + Azure Speech |
| `src/Immersio.Application/Services/AuthService.cs` | Auth flows đầy đủ |
| `src/Immersio.Application/Services/AdminService.cs` | AI settings read/write |
| `src/Immersio.Domain/Entities/Card.cs` | SM-2 algorithm implementation |
| `immersioFe/src/services/auth.ts` | fetchWithAuth, JWT refresh, session management |
| `immersioFe/src/App.tsx` | Route tree + ThemeManager |
| `immersioFe/src/pages/admin/AITuning.tsx` | AI config UI với model selectors + presets |
| `immersioFe/src/services/admin.ts` | `AiSettings` interface definition |
| `CLAUDE.md` | Development workflow rules cho Claude Code |


---

## 1. Tổng quan dự án

**Immersio** là nền tảng học ngôn ngữ tiếng Việt, được xây dựng với AI-powered roleplay scenarios, spaced-repetition flashcards, pronunciation practice, và từ điển tích hợp.

| Thành phần | Công nghệ | URL local |
|---|---|---|
| Backend API | ASP.NET Core 9, C#, PostgreSQL | `http://localhost:5249` |
| Frontend SPA | React 19 + TypeScript + Vite | `http://localhost:3000` |
| Swagger UI | — | `http://localhost:5249/api/swagger` |

**Trạng thái hiện tại (2026-07-08):**
- Branch: `main`, sync với origin
- Last commit: `4b2277a` — per-task reasoning effort configuration
- Working tree: clean (có `immersioFe/dist.tar.gz` untracked — artifact build)

---

## 2. Cách chạy project

### Backend
```bash
dotnet run --project src/Immersio.WebApi
# hoặc với profile dev
dotnet run --project src/Immersio.WebApi --launch-profile Development
```

### Frontend
```bash
cd immersioFe
npm install
npm run dev        # dev server port 3000
npm run build      # production build → dist/
npm run lint       # TypeScript type-check (tsc --noEmit)
```

### EF Core Migrations
```bash
dotnet ef migrations add <Name> \
  --project src/Immersio.Infrastructure \
  --startup-project src/Immersio.WebApi

dotnet ef database update \
  --project src/Immersio.Infrastructure \
  --startup-project src/Immersio.WebApi
```

---

## 3. Cấu trúc thư mục

```
Immersio/
├── src/                          ← Backend (ASP.NET Core)
│   ├── Immersio.sln
│   ├── Immersio.Domain/          ← Entities, domain exceptions
│   ├── Immersio.Application/     ← Services, DTOs, interfaces
│   ├── Immersio.Infrastructure/  ← EF Core, external APIs
│   └── Immersio.WebApi/          ← Controllers, Program.cs, middleware
│
├── immersioFe/                   ← Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           ← UI components (Card, Button, Slider...)
│   │   ├── pages/                ← student/ và admin/ pages
│   │   ├── services/             ← API service modules
│   │   └── App.tsx               ← Router + ThemeManager
│   ├── server.ts                 ← Dev server (Vite + Express)
│   ├── api/
│   │   ├── app.ts                ← Express routes (TTS/chat proxy)
│   │   └── index.ts              ← Vercel serverless entry
│   └── package.json
│
├── .github/workflows/deploy.yml  ← CI/CD pipeline
├── CLAUDE.md                     ← Instructions cho Claude Code
└── PROJECT_OVERVIEW.md           ← File này
```

---

## 4. Backend — Clean Architecture

### 4.1 Bốn project layers

| Project | Vai trò | Dependencies |
|---|---|---|
| `Immersio.Domain` | Entities thuần, domain exceptions | Không có |
| `Immersio.Application` | Service interfaces + implementations, DTOs | Domain |
| `Immersio.Infrastructure` | EF Core DbContext, external API wrappers | Domain + Application |
| `Immersio.WebApi` | Controllers, Program.cs, Middleware | Infrastructure |

### 4.2 Domain Entities (`src/Immersio.Domain/Entities/`)

| Entity | Mô tả | Quan hệ chính |
|---|---|---|
| `User` | User (username, email, passwordHash, role, subscriptionTier, XP, streak, CEFR level) | HasMany RefreshToken, ScenarioSession, Deck, UserPronunciationLog |
| `Scenario` | Roleplay scenario (title, language, level, category, contextPrompt, emotionsJson) | HasMany ScenarioItem, ScenarioSession |
| `ScenarioSession` | Một lần chơi scenario | BelongsTo User + Scenario; HasMany SessionMessage |
| `SessionMessage` | Một tin nhắn trong session (role: "user"/"model", text, correctionText, correctionExplanation) | BelongsTo ScenarioSession |
| `ScenarioItem` | Item tương tác trong navigation scenario (name, price, icon) | BelongsTo Scenario |
| `Deck` | Flashcard deck của user | BelongsTo User; HasMany Card |
| `Card` | Flashcard với SM-2 SRS (front, back, explanation, tag, repetitions, easinessFactor, intervalDays, nextReviewDate) | BelongsTo Deck |
| `RefreshToken` | JWT refresh token (token, userId, expiresAt, revokedAt) | BelongsTo User |
| `PasswordResetCode` | OTP 6 chữ số cho forgot-password (email, codeHash, expiresAt, attemptCount) | Linked by email |
| `PaymentTransaction` | PayOS payment record (txnRef, userId, tier, billingCycle, amount, isPaid) | BelongsTo User |
| `SystemSetting` | Key-value config (AI model names, endpoints, reasoning efforts, etc.) | Standalone |
| `UserPronunciationLog` | Pronunciation practice log (phrase, transcript, score, practicedAt) | BelongsTo User |

**Quy tắc domain:**
- Mọi entity dùng **soft-delete** (`IsDeleted` flag), không xóa thật
- `User.ActiveSubscriptionTier` — computed property: trả về Basic nếu subscription đã hết hạn
- `Card.Review(quality 0-5)` — implement SM-2 algorithm trong domain model
- `ScenarioSession.Complete(feedback)` — đánh dấu IsFinished + set FinishedAt

### 4.3 Application Services (`src/Immersio.Application/Services/`)

#### AuthService
- `RegisterAsync` — validate unique email/username, hash password, tạo RefreshToken, gửi welcome email; user đầu tiên tự động thành Admin
- `LoginAsync` — verify password, phát JWT access token + refresh token
- `LoginWithGoogleAsync` — validate Google ID token qua `GoogleJsonWebSignature`, auto-create user nếu mới
- `RefreshTokenAsync` — rotation: revoke old token, phát cặp mới
- `RevokeTokenAsync` — set RevokedAt
- `ForgotPasswordAsync` — tạo OTP 6 chữ số, hash và lưu vào DB, gửi email; không tiết lộ email có tồn tại hay không (anti-enumeration)
- `ResetPasswordAsync` — verify OTP (max 5 attempts, 10 min expiry), đổi password, revoke tất cả refresh token hiện tại
- `UpdateSettingsAsync` — cập nhật notification preferences
- `UpgradeSubscriptionAsync` — update tier + expiresAt, gửi receipt email

#### ScenarioService
- `GetScenariosAsync` / `GetScenarioByIdAsync` — CRUD read
- `StartSessionAsync` — tạo ScenarioSession, nếu targetLanguage khác scenario.Language thì dịch initialMessage qua LLM, auto-append model message đầu tiên; lưu language vào `ConcurrentDictionary<SessionId, Language>`
- `SendMessageAsync` — pipeline: (1) AnalyzeGrammar, (2) append user message kèm correction, (3) GenerateChatResponse với emotion tagging, (4) parse `[EMOTION: xxx]` từ reply, (5) append model reply. Return `ChatOutputResponse(reply, correction?, emotion)`
- `CompleteSessionAsync` — GenerateSessionFeedback + GenerateFlashcards, mark session Complete
- `GenerateCustomFlashcardsAsync` — generate theo categories được chọn
- `SeedScenariosAsync` — seed 4 scenarios mặc định (Shibuya Navigation, Konbini Run, Ordering Coffee, Ordering Dim Sum); idempotent
- `CreateScenarioAsync` / `UpdateScenarioAsync` / `DeleteScenarioAsync` / `AddScenarioItemAsync` — Admin CRUD

#### SrsService (Spaced Repetition)
- `CreateDeckAsync` / `GetDecksAsync` / `DeleteDeckAsync`
- `GetReviewCardsAsync` — trả cards có `NextReviewDate <= DateTime.UtcNow`
- `AddCardAsync` — enforce limit 50 cards/ngày cho Basic tier
- `AddCardsAsync` — bulk add, gracefully cap tại 50 cho Basic (không throw nếu partially added)
- `ReviewCardAsync` — apply SM-2 algorithm, update interval + nextReviewDate
- `DeleteCardAsync`

#### PronunciationService
- `LogPronunciationAsync` — log practice, +50 XP, +0.1 learning hours, recalculate CEFR
- `GetUserLogsAsync`
- `AnalyzeCefrLevelAsync` — time-decay weighted scoring:
  - Interactive Comprehension (55%): completed scenarios theo CEFR level, decay λ=0.25
  - Speech Fluency (45%): pronunciation scores, decay γ=0.15
  - Pronunciation cap: nếu avg pronunciation < 50% thì cap CEFR ở A2
  - Active vocabulary: unique words matched giữa phrase và transcript
  - Gọi LLM để generate AI-personalized suggestions
- `AssessPronunciationAsync` — gọi Azure Speech API (phoneme-level), parallel với Groq Whisper transcription; fallback mock 95% nếu Azure key chưa set
- `GeneratePhraseAsync` — delegate sang LlmService

#### SubscriptionService
- `CreatePaymentUrlAsync` — tạo PaymentTransaction, gọi PayOS để lấy checkout URL; pricing: Plus 69k/tháng, Premium 199k/tháng, yearly -20%
- `HandlePaymentReturnAsync` — idempotent; verify status từ PayOS (không trust query string), update subscription nếu PAID, gửi receipt email

#### AdminService
- `GetDashboardStatsAsync` — totalUsers, activeSessions, revenue (từ subscription counts), averageDuration (trung bình completed sessions), growthData 7 ngày, sessionData 7 ngày
- `GetUsersAsync` / `UpdateUserSubscriptionAsync` / `BanUserAsync`
- `GetAiSettingsAsync` — đọc từ SystemSettings table, migrate legacy ReasoningEffort key, auto-heal deprecated model names
- `SaveAiSettingsAsync` — lưu tất cả settings vào SystemSettings table

### 4.4 Infrastructure Services (`src/Immersio.Infrastructure/Services/`)

#### LlmService
Multi-provider OpenAI-compatible API. Model config (model name, endpoint, reasoning effort) lưu trong `SystemSettings` DB.

**Provider resolution** (qua endpoint URL):
- `groq.com` → dùng `Groq:ApiKey`
- `nvidia.com` / `nvidia` → dùng `Nvidia:ApiKey`
- `stepfun.com` → dùng `StepFun:ApiKey`
- `opencode.ai` → dùng `OpenCode:ApiKey`
- fallback → Groq

**Per-task model config** (từ DB):

| DB Key | LLM Task |
|---|---|
| `ModelChat` + `ReasoningEffortChat` | NPC roleplay replies |
| `ModelGrammar` + `ReasoningEffortGrammar` | Grammar correction |
| `ModelFeedback` + `ReasoningEffortFeedback` | Session feedback + CEFR analysis |
| `ModelFlashcard` + `ReasoningEffortFlashcard` | Flashcard generation |
| `ModelPhrase` + `ReasoningEffortPhrase` | Pronunciation phrase generation |

**Các methods:**
- `GenerateChatResponseAsync` — NPC reply với emotion tagging `[EMOTION: xxx]`; temperature 0.7; max 1024 tokens
- `AnalyzeGrammarAsync` — JSON mode; temperature 0.2; returns `{corrected, explanation}`; lenient với spoken speech
- `GenerateSessionFeedbackAsync` — 2-3 paragraphs feedback; temperature 0.7
- `GenerateFlashcardsAsync` — JSON mode; 3-15 cards; 3 types: vocab/grammar/sentence (cloze deletion); temperature 0.2
- `GenerateCustomFlashcardsAsync` — như trên nhưng theo categories được chọn
- `GenerateCefrFeedbackAsync` — JSON mode; returns `{statusMessage, suggestions[]}`; temperature 0.2
- `TranscribeAudioAsync` — Groq Whisper `whisper-large-v3`; hardcoded Groq endpoint
- `GeneratePronunciationPhraseAsync` — JSON mode; returns `{phrase, translation, explanation}`
- `LookupWordAsync` — JSON mode; bilingual dictionary; returns 7 fields

#### TokenService
- `GenerateAccessToken(User)` — HMAC-SHA256 JWT, claims: NameIdentifier, Email, Name, Role, Jti; expiry từ `Jwt:AccessTokenExpiryMinutes` (default 15 min)
- `GenerateRefreshToken()` — 64 bytes random → Base64
- `GetPrincipalFromExpiredToken(token)` — validate không check lifetime, dùng để extract userId khi refresh

#### PayOsService
- `CreatePaymentLinkAsync` — HMAC-SHA256 signature (fields sorted alphabetically), POST `/v2/payment-requests`
- `GetPaymentStatusAsync` — GET `/v2/payment-requests/{orderCode}`

#### Các services khác
- `PasswordHasher` — BCrypt hash/verify
- `CloudinaryService` — upload image lên Cloudinary CDN
- `SmtpEmailService` — Gmail SMTP, send welcome/OTP/receipt emails

### 4.5 Controllers (`src/Immersio.WebApi/Controllers/`)

| Controller | Base Route | Auth |
|---|---|---|
| `AuthController` | `api/auth` | Mixed |
| `ScenariosController` | `api/scenarios` | [Authorize], Admin ops cần Role=Admin |
| `FlashcardsController` | `api/flashcards` | [Authorize] |
| `PracticeController` | `api/practice` | [Authorize], TTS + generate-phrase là AllowAnonymous |
| `SubscriptionController` | `api/subscription` | [Authorize], payos-return là AllowAnonymous |
| `AdminController` | `api/admin` | [Authorize(Roles="Admin")] |
| `UploadController` | `api/upload` | [Authorize] |

**API Endpoints đầy đủ:**

```
# Auth
POST   api/auth/register
POST   api/auth/login
POST   api/auth/google
POST   api/auth/refresh
POST   api/auth/revoke          [Authorize]
POST   api/auth/forgot-password
POST   api/auth/reset-password
GET    api/auth/me              [Authorize]
POST   api/auth/settings        [Authorize]

# Scenarios
GET    api/scenarios            [Authorize]
GET    api/scenarios/{id}       [Authorize]
POST   api/scenarios            [Admin]
PUT    api/scenarios/{id}       [Admin]
DELETE api/scenarios/{id}       [Admin]
POST   api/scenarios/{id}/items [Admin]
POST   api/scenarios/sessions/start              [Authorize]
POST   api/scenarios/sessions/{id}/chat          [Authorize]
POST   api/scenarios/sessions/{id}/finish        [Authorize]
POST   api/scenarios/sessions/{id}/flashcards    [Authorize]

# Flashcards
POST   api/flashcards/decks                      [Authorize]
GET    api/flashcards/decks                      [Authorize]
DELETE api/flashcards/decks/{id}                 [Authorize]
GET    api/flashcards/decks/{id}/review          [Authorize]
POST   api/flashcards/decks/{id}/cards           [Authorize]
POST   api/flashcards/cards/{id}/review          [Authorize]
DELETE api/flashcards/cards/{id}                 [Authorize]

# Practice
POST   api/practice/pronunciation-log            [Authorize]
GET    api/practice/pronunciation-history        [Authorize]
GET    api/practice/cefr-analysis               [Authorize]
POST   api/practice/assess-pronunciation         [Authorize] multipart/form-data
POST   api/practice/tts                          AllowAnonymous
POST   api/practice/generate-phrase             AllowAnonymous
POST   api/practice/dictionary-lookup           [Authorize]

# Subscription
POST   api/subscription/upgrade                  [Authorize]
POST   api/subscription/create-payment           [Authorize]
GET    api/subscription/payos-return             AllowAnonymous

# Admin
GET    api/admin/stats                           [Admin]
GET    api/admin/users                           [Admin]
POST   api/admin/users/{id}/subscription         [Admin]
POST   api/admin/users/{id}/ban                  [Admin]
GET    api/admin/ai-tuning                       [Admin]
POST   api/admin/ai-tuning                       [Admin]

# Upload
POST   api/upload/image                          [Authorize] multipart, max 10MB
```

### 4.6 Response Format

Tất cả API đều wrap trong `ApiResponse<T>`:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": null
}
```

**GlobalExceptionMiddleware** map exceptions:
- `UnauthorizedException` → 401
- `NotFoundException` → 404
- `ConflictException` → 409
- `ValidationException` → 422
- Unhandled → 500 (stack trace chỉ hiện trong Development)

### 4.7 Auth Flow chi tiết

```
Register/Login → JWT Access Token (15 min) + Refresh Token (7 days, stored in DB hashed)
                                    ↓
                         fetchWithAuth (frontend)
                                    ↓
                    401 → POST api/auth/refresh (gửi cả 2 tokens)
                                    ↓
                    Backend: validate refresh token, revoke old, issue new pair
                                    ↓
                    Retry original request với token mới
                                    ↓
                    Refresh fail → clearSession() + redirect /login
```

**Google OAuth:** credential token → `GoogleJsonWebSignature.ValidateAsync` → auto-create user nếu mới (username = email prefix, thêm số nếu trùng)

### 4.8 Configuration (appsettings.json)

```json
{
  "ConnectionStrings": { "DefaultConnection": "PostgreSQL connection string" },
  "Jwt": {
    "Key": "≥32 byte base64 secret",
    "Issuer": "...",
    "Audience": "...",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "Google": { "ClientId": "..." },
  "Groq": { "ApiKey": "..." },
  "Nvidia": { "ApiKey": "..." },
  "StepFun": { "ApiKey": "..." },
  "OpenCode": { "ApiKey": "..." },
  "Azure": {
    "Speech": { "ApiKey": "...", "Region": "centralindia", "Endpoint": "..." }
  },
  "Cloudinary": { "CloudName": "...", "ApiKey": "...", "ApiSecret": "..." },
  "Email": { "Smtp": { "Host": "smtp.gmail.com", "Port": 587, "Username": "...", "Password": "..." } },
  "PayOS": { "ClientId": "...", "ApiKey": "...", "ChecksumKey": "...", "ReturnUrl": "...", "CancelUrl": "..." }
}
```

**Startup sequence** (`Program.cs`):
1. Register DI (DbContext, services, HttpClients)
2. Configure JWT Bearer auth
3. Configure Swagger + CORS (AllowAll)
4. `await db.Database.MigrateAsync()` — auto-apply pending migrations
5. `SeedScenariosAsync()` — seed 4 default scenarios (idempotent)
6. Seed admin user `admin@immersio.com / Admin123!` nếu chưa có
7. Middleware pipeline: ForwardedHeaders → GlobalException → CORS → Swagger → Auth → Controllers

---

## 5. Frontend — React 19 + Vite

### 5.1 Routing (`src/App.tsx`)

```
/                    → Intro page
/intro               → Intro page
/login               → Login (email + Google OAuth)
/register            → Register
/forgot-password     → ForgotPassword (OTP flow)
/onboarding          → Onboarding
/payment/payos-return → PayOsReturn

/student/            → AppLayout (light theme)
  dashboard          → StudentDashboard
  scenarios          → Scenarios list
  scenarios/:id      → ScenarioDetail (roleplay chat)
  vocal-lab          → VocalLab (pronunciation)
  flashcards         → FlashcardsPage
  flashcards/:deckId → FlashcardsPage (specific deck)
  dictionary         → DictionaryPage
  profile            → Profile
  subscription       → Subscription (PayOS checkout)
  notifications      → Notifications
  help               → HelpCenter

/admin/              → AppLayout (dark theme)
  dashboard          → AdminDashboard
  users              → UsersManagement
  scenarios          → ScenarioBuilder
  ai-tuning          → AITuning
```

**ThemeManager** — route-driven: `/admin/*` → dark class trên `<html>`, còn lại → light.

### 5.2 Services layer (`src/services/`)

Tất cả authenticated calls đều qua `authService.fetchWithAuth()` — auto-refresh JWT on 401, auto-unwrap `{success, data}` envelope.

```
API_BASE = "http://localhost:5249" (local) | "" (production same-origin)
```

| File | Singleton | Endpoints chính |
|---|---|---|
| `auth.ts` | `authService` | /api/auth/* — login, register, Google, refresh, revoke, me, settings |
| `admin.ts` | `adminService` | /api/admin/* — stats, users, ai-tuning; /api/scenarios (CRUD) |
| `scenario.ts` | `scenarioService` | /api/scenarios — list, detail, sessions (start/chat/finish/flashcards) |
| `decks.ts` | `decksService` | /api/flashcards/decks/* — CRUD decks, cards, reviews |
| `practice.ts` | `practiceService` | /api/practice/* — pronunciation log, history, CEFR, assess, phrase, dictionary |
| `subscription.ts` | `subscriptionService` | /api/subscription/* — create-payment, payos-return |
| `upload.ts` | `uploadService` | /api/upload/image — Cloudinary upload |

**Session storage:** `localStorage` — accessToken, refreshToken, user JSON

### 5.3 State management

Không có global state library. Pattern:
1. Service file export plain async functions / singleton object
2. Page component gọi service trong `useEffect`
3. Manage `loading`/`error`/data bằng `useState`
4. `authService.getUser()` đọc sync từ localStorage; `AppLayout` re-fetch `/me` để sync

### 5.4 UI Stack

| Thư viện | Version | Vai trò |
|---|---|---|
| `react` / `react-dom` | 19 | Core |
| `react-router-dom` | 7.13 | Routing |
| `motion` (framer-motion) | 12.23 | Animations, layout transitions |
| `lucide-react` | 0.546 | Icons |
| `recharts` | 3.7 | Admin charts (AreaChart, BarChart) |
| `@radix-ui/react-slider` | 1.3 | Accessible sliders |
| `@radix-ui/react-switch` | 1.2 | Accessible toggles |
| `@radix-ui/react-slot` | 1.2 | Component composition |
| `tailwindcss` v4 + `@tailwindcss/vite` | 4.1 | Utility CSS |
| `class-variance-authority` | 0.7 | Component variants |
| `clsx` + `tailwind-merge` | — | Conditional classes |

**Design system:** Dark glassmorphism (`backdrop-blur-2xl`, `bg-slate-950/45`, `border-white/5`). Admin = always dark. Student = always light.

**Vite config:**
- Path alias: `@` → `./src`
- HMR: disabled khi `DISABLE_HMR=true` (dùng trong AI Studio)
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`

### 5.5 Các trang quan trọng

**Admin:**
- `AdminDashboard` — KPI stat cards (totalUsers, activeSessions, revenue, avgDuration) + recharts AreaChart (user growth 7 ngày) + BarChart (sessions/ngày)
- `AITuning` — Global system prompt textarea, grammar/vocab sensitivity sliders, slang toggle, speech speed selector, LLM endpoint input, 5 model selectors (Chat/Grammar/Feedback/Flashcard/Phrase) mỗi cái có reasoning effort dropdown (none/low/medium/high/xhigh), 4 quick presets (Groq/NVIDIA/StepFun/OpenCode Zen) + Custom
- `UsersManagement` — Danh sách users, update subscription tier, ban user
- `ScenarioBuilder` — CRUD scenarios, thêm items

**Student:**
- `ScenarioDetail` — Roleplay chat UI; NPC hiển thị emotion GIFs (idle/happy/angry); real-time grammar correction hiển thị inline; finish session → feedback + flashcard suggestions
- `VocalLab` — Record voice, gửi lên Azure Speech để assess pronunciation; hiển thị phoneme-level scores từng chữ; generate phrase từ LLM; CEFR analysis card với bar charts
- `FlashcardsPage` — List decks, review mode (flip card, SM-2 quality rating 0-5)
- `DictionaryPage` — Lookup từ qua LLM, hiển thị phonetic/partOfSpeech/definition/example
- `Subscription` — Pricing cards (Basic/Plus/Premium), PayOS checkout flow

### 5.6 Dev server architecture

```
server.ts  →  tsx watch
              ├── Vite middleware (React SPA + HMR)
              └── Express app (api/app.ts)
                  ├── POST /api/tts     → proxy to Groq TTS (keep API key server-side)
                  └── POST /api/chat    → proxy to Groq chat
```

Production trên Vercel: `api/index.ts` là serverless function entry, `vercel.json` route tất cả non-`/api` paths về SPA.

---

## 6. AI System (LLM Integration)

### 6.1 Admin-configurable model settings

Lưu trong `SystemSettings` DB table (key-value), admin có thể thay đổi qua `/admin/ai-tuning`:

| Setting Key | Default | Mô tả |
|---|---|---|
| `LlmEndpoint` | NVIDIA Integrate API | Endpoint của LLM provider |
| `ModelChat` | `meta/llama-4-maverick-17b-128e-instruct` | NPC roleplay |
| `ModelGrammar` | `nvidia/nemotron-mini-4b-instruct` | Grammar correction |
| `ModelFeedback` | `mistralai/mistral-large-3-675b-instruct-2512` | Session feedback + CEFR |
| `ModelFlashcard` | `qwen/qwen3-coder-480b-a35b-instruct` | Flashcard generation |
| `ModelPhrase` | `nvidia/nemotron-mini-4b-instruct` | Pronunciation phrases |
| `ReasoningEffortChat` | `none` | none/low/medium/high/xhigh |
| `ReasoningEffortGrammar` | `none` | — |
| `ReasoningEffortFeedback` | `none` | — |
| `ReasoningEffortFlashcard` | `none` | — |
| `ReasoningEffortPhrase` | `none` | — |
| `SystemPrompt` | Default tutor prompt | Global system prompt |
| `GrammarSensitivity` | `75` | 0-100 |
| `VocabSensitivity` | `50` | 0-100 |
| `EnableSlang` | `true` | boolean |
| `SpeedOfSpeech` | `1.0x (Normal)` | 0.8x/1.0x/1.2x |

### 6.2 Quick Presets

| Preset | Endpoint | Chat | Grammar | Feedback | Flashcard | Phrase |
|---|---|---|---|---|---|---|
| Groq Default | groq.com | llama-3.3-70b | llama-3.3-70b | llama-3.3-70b | llama-3.3-70b | llama-3.3-70b |
| NVIDIA NIM | nvidia.com | nemotron-mini-4b | nemotron-mini-4b | mistral-large-3-675b | qwen3-coder-480b | nemotron-mini-4b |
| StepFun MoE | stepfun.com | step-3.5-flash | step-3.5-flash | step-3.5-flash | step-3.5-flash | step-3.5-flash |
| OpenCode Zen | opencode.ai | mimo-v2.5-free | mimo-v2.5-free | deepseek-v4-flash | deepseek-v4-flash | mimo-v2.5-free |

### 6.3 Flashcard Types (3 polymorphic)

| Type | Khi nào dùng | Front | Back |
|---|---|---|---|
| `vocab` | Từ vựng user gặp/mắc lỗi | word | meaning (Vietnamese) |
| `grammar` | Lỗi ngữ pháp của user | title (tên cấu trúc) | usage (Vietnamese) |
| `sentence` | Idiom/collocation (Cloze deletion) | full_sentence | translation (Vietnamese) |

### 6.4 CEFR Scoring Algorithm

```
Unified Score = 0.55 × InteractiveComprehension + 0.45 × SpeechFluency

InteractiveComprehension:
  - Lấy danh sách completed scenarios theo thứ tự thời gian
  - baselineScore theo level: A1=20, A2=40, B1=60, B2=80, C1=95, C2=100
  - Time-decay weight: exp(-0.25 × (N-1-i))   [mới hơn = weight cao hơn]
  - Weighted average

SpeechFluency:
  - Lấy tất cả pronunciation logs theo thứ tự thời gian
  - Time-decay weight: exp(-0.15 × (N-1-j))
  - Weighted average của scores

CEFR Level Mapping:
  ≤15 → A1 | ≤35 → A2 | ≤60 → B1 | ≤80 → B2 | ≤95 → C1 | >95 → C2
  
Pronunciation Cap: nếu avgPronunciation < 50% → cap ở A2
Unassigned: nếu chưa có session lẫn pronunciation log nào
```

---

## 7. Subscription & Payment

### 7.1 Subscription Tiers

| Tier | Giá tháng | Giá năm (−20%) | Giới hạn |
|---|---|---|---|
| Basic | Free | — | 50 flashcards/ngày |
| Plus | 69,000đ | 662,400đ | Không giới hạn |
| Premium | 199,000đ | 1,910,400đ | Không giới hạn + features cao cấp |

### 7.2 Payment Flow

```
1. User chọn tier + cycle → POST /api/subscription/create-payment
2. Backend tạo PaymentTransaction record + gọi PayOS API
3. PayOS trả về checkoutUrl → Frontend redirect
4. User thanh toán trên PayOS portal
5. PayOS redirect về returnUrl (GET /api/subscription/payos-return?orderCode=...)
6. Backend verify authoritative status từ PayOS (không trust query string)
7. Nếu PAID: update user.SubscriptionTier + SubscriptionExpiresAt + gửi receipt email
```

---

## 8. Deployment

| Target | Cách deploy |
|---|---|
| Frontend | Vercel — auto-deploy từ `main` branch |
| Backend | GitHub Actions → build Docker image → push GHCR → SSH deploy to VPS |
| VPS | Docker Compose + Nginx reverse proxy |

**CI/CD:** `.github/workflows/deploy.yml`

**Vercel config:** `vercel.json` route tất cả non-`/api` paths về SPA (`index.html`).

---

## 9. Seed Data

4 scenarios được seed mặc định khi DB trống:

| Title | Language | Level | Category |
|---|---|---|---|
| Discovery: Shibuya Navigation | English | Beginner | Navigation |
| Konbini Late Night Run | Japanese | Intermediate | Travel |
| Ordering Coffee (English) | English | Beginner | Travel |
| Ordering Dim Sum in Shanghai | Chinese | Beginner | Travel |

Scenario "Ordering Coffee" có emotion GIFs: `idle.gif`, `happy.gif`, `angry.gif` (hosted trên Cloudinary).

Admin user được seed: `admin@immersio.com / Admin123!` (**chỉ cho dev — phải xóa reset logic trước production**).

---

## 10. Các quyết định kiến trúc quan trọng

| Quyết định | Lý do |
|---|---|
| Clean Architecture 4 layers | Tách biệt concerns, dễ test, swap infra |
| Soft-delete (`IsDeleted`) | Không mất data, audit trail |
| SM-2 SRS trong Domain | Business logic thuần, dễ unit test |
| SystemSettings table cho AI config | Admin thay đổi runtime không cần redeploy |
| Per-task reasoning effort (5 fields) | Mỗi LLM task có nhu cầu reasoning khác nhau |
| Provider detection qua endpoint URL | Admin chỉ cần đổi endpoint, không cần UI riêng cho từng provider |
| Token rotation (refresh) | Revoke token cũ sau mỗi lần refresh để phát hiện token theft |
| Anti-enumeration trong forgot-password | Luôn trả response giống nhau dù email tồn tại hay không |
| Time-decay CEFR scoring | Progress gần đây có trọng số cao hơn, phản ánh level thực tế hơn |
| Mock fallback cho Azure Speech | Dev có thể test VocalLab không cần Azure key |
| ConcurrentDictionary cho session language | Lưu language selection trong memory thay vì DB để tránh migration |
| fetchWithAuth monkey-patch response.json() | Auto-unwrap `{success, data}` envelope ở một nơi duy nhất |

---

## 11. Files quan trọng cần biết

| File | Vai trò |
|---|---|
| `src/Immersio.WebApi/Program.cs` | DI wiring, middleware pipeline, startup seed |
| `src/Immersio.Infrastructure/Services/LlmService.cs` | Toàn bộ AI integration |
| `src/Immersio.Application/Services/ScenarioService.cs` | Roleplay session pipeline |
| `src/Immersio.Application/Services/PronunciationService.cs` | CEFR algorithm + Azure Speech |
| `src/Immersio.Application/Services/AuthService.cs` | Auth flows đầy đủ |
| `src/Immersio.Application/Services/AdminService.cs` | AI settings read/write |
| `src/Immersio.Domain/Entities/Card.cs` | SM-2 algorithm implementation |
| `immersioFe/src/services/auth.ts` | fetchWithAuth, JWT refresh, session management |
| `immersioFe/src/App.tsx` | Route tree + ThemeManager |
| `immersioFe/src/pages/admin/AITuning.tsx` | AI config UI với model selectors + presets |
| `immersioFe/src/services/admin.ts` | `AiSettings` interface definition |
| `CLAUDE.md` | Development workflow rules cho Claude Code |
