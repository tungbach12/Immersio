# Immersio — Project Overview (Context Document)

> Tài liệu này được tạo tự động từ source code thực tế.
> Mục đích: nạp context nhanh cho AI assistant khi bắt đầu session mới.

---

## 1. Tổng quan dự án

**Immersio** là nền tảng học ngôn ngữ tiếng Việt, được xây dựng với AI-powered roleplay scenarios, spaced-repetition flashcards, pronunciation practice, và từ điển tích hợp.

| Thành phần | Công nghệ | URL local |
|---|---|---|
| Backend API | Java 21, Spring Boot 4.1 Modulith, PostgreSQL | `http://localhost:5249` |
| Frontend SPA | React 19 + TypeScript + Vite | `http://localhost:3000` |
| Swagger UI | springdoc-openapi | `http://localhost:5249/swagger-ui.html` |

**Ghi chú lịch sử:** backend từng là ASP.NET Core (C#) và đã được migrate sang Java. Toàn bộ cây `src/` cũ đã bị xoá; mọi tham chiếu .NET còn sót lại trong tài liệu này đều được ghi rõ là **legacy**.

---

## 2. Cách chạy project

### Backend
```bash
cd backend
./mvnw spring-boot:run        # API + Swagger UI trên http://localhost:5249
./mvnw test                   # 192 tests
./mvnw verify                 # tests + Modulith architecture check
```

### Frontend
```bash
cd immersioFe
npm install
npm run dev        # dev server port 3000
npm run build      # production build → dist/
npm run lint       # TypeScript type-check (tsc --noEmit)
```

### Database
PostgreSQL khởi động bằng `docker compose up -d postgres-db` (PostgreSQL 16, DB `ImmersioDb`).

**Flyway migrations** chạy tự động khi boot (`spring.jpa.hibernate.ddl-auto: validate` — Hibernate không bao giờ tạo/sửa schema). Thêm migration mới bằng cách tạo file:

```
backend/src/main/resources/db/migration/V<N>__<name>.sql
```

| Migration | Nội dung |
|---|---|
| `V1__initial_schema.sql` | 12 bảng gốc (Users, RefreshTokens, PasswordResetCodes, Decks, Cards, Scenarios, ScenarioItems, ScenarioSessions, SessionMessages, UserPronunciationLogs, PaymentTransactions, SystemSettings) |
| `V2__modulith_event_publication.sql` | Bảng registry `event_publication` của Spring Modulith JPA — DDL do Hibernate sinh rồi đóng băng |
| `V3__9router_ai_settings.sql` | Trỏ toàn bộ AI settings sang 9Router VPS1 (model `immersio`) |

---

## 3. Cấu trúc thư mục

```
Immersio/
├── backend/                       ← Backend (Java 21 + Spring Boot Modulith)
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd           ← Maven wrapper
│   ├── Dockerfile                ← multi-stage build → JRE 21, non-root
│   └── src/
│       ├── main/java/com/immersio/
│       │   ├── ImmersioApplication.java   ← @SpringBootApplication @Modulithic
│       │   ├── users/                     ← auth, admin, health
│       │   ├── flashcards/                ← Deck/Card + SM-2 SRS
│       │   ├── scenarios/                 ← AI roleplay sessions
│       │   ├── practice/                  ← pronunciation, CEFR, TTS, dictionary
│       │   ├── subscriptions/             ← plans, PayOS, admin transactions
│       │   ├── upload/                    ← Cloudinary
│       │   └── shared/                    ← ApiResponse, exception handler, JWT, email
│       ├── main/resources/
│       │   ├── application.yml            ← toàn bộ config + env var mapping
│       │   └── db/migration/V*.sql        ← Flyway
│       └── test/java/                     ← 24 test classes, 192 tests
│
├── immersioFe/                   ← Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           ← UI components
│   │   ├── pages/                ← student/ và admin/ pages
│   │   ├── services/             ← API service modules
│   │   └── App.tsx               ← Router + ThemeManager
│   ├── server.ts                 ← Dev server (Vite middleware + Express static)
│   └── package.json
│
├── docker-compose.yml            ← postgres-db + immersio-api
├── nginx.conf                    ← reverse proxy trên VPS2
├── .github/workflows/deploy.yml  ← CI/CD pipeline
├── CLAUDE.md                     ← Instructions cho Claude Code
└── PROJECT_OVERVIEW.md           ← File này
```

---

## 4. Backend — Spring Modulith

### 4.1 Module map

Mỗi feature area là một module riêng, mỗi module có cùng bố cấu trúc thư mục: `api/` (controller + `api/dto/`), `service/`, `domain/`, `repository/`.

| Module | Vai trò |
|---|---|
| `users` | Auth (register/login/Google/JWT refresh), admin dashboard + AI tuning, `/api/health` |
| `flashcards` | `Deck`/`Card` entities + SM-2 SRS scheduling |
| `scenarios` | AI roleplay sessions, chat pipeline, flashcard generation, admin CRUD |
| `practice` | Pronunciation assessment (Azure), CEFR analysis, TTS, dictionary lookup |
| `subscriptions` | PayOS payments, webhook, admin transaction approval |
| `upload` | Cloudinary image uploads |
| `shared` | `ApiResponse`, `GlobalExceptionHandler`, JWT filter/provider, password hashing, email, exception types |

**Luật module:** `ModulithArchitectureTest` (`./mvnw verify`) assert rằng cả 7 module đều được discover. Module không được đọc internals của module khác — chỉ đi qua Spring bean public interface.

**Dependency chính** (`backend/pom.xml`):

| Dependency | Vai trò |
|---|---|
| `spring-boot-starter-data-jpa` | JPA/Hibernate + Spring Data repositories |
| `spring-boot-starter-flyway` + `flyway-database-postgresql` | Quản lý schema |
| `spring-boot-starter-security` | Security filter chain, method security |
| `spring-boot-starter-webmvc` + `-validation` | REST controllers, Bean Validation |
| `spring-boot-starter-mail` | SMTP (welcome / OTP / receipt) |
| `spring-boot-starter-actuator` | Health/metrics (`/actuator/**` permitAll) |
| `spring-modulith-starter-core` + `-jpa` + `-test` | Module boundaries, event publication, architecture test |
| `springdoc-openapi-starter-webmvc-ui` 3.1.0 | Swagger UI tại `/swagger-ui.html` |
| `io.jsonwebtoken` (jjwt) 0.12.6 | Ký + verify JWT |
| `org.bouncycastle:bcprov-jdk18on` 1.84 | Provider crypto cho PBKDF2 legacy |

### 4.2 Domain Entities

| Entity | Module | Mô tả | Quan hệ chính |
|---|---|---|---|
| `User` | users | username, email, passwordHash, role, subscriptionTier/ExpiresAt, XP, streak, learningHours, currentLanguageLevel, notif flags, profilePictureUrl | FK logic tới RefreshToken, Deck, ScenarioSession, UserPronunciationLog, PaymentTransaction |
| `RefreshToken` | users | token (UUID.UUID), userId, expiresAt, revokedAt | BelongsTo User |
| `PasswordResetCode` | users | email, codeHash, expiresAt, usedAt, attemptCount | Linked by email |
| `SystemSetting` | users | key-value config (AI model names, endpoint, reasoning efforts) | Standalone |
| `Deck` | flashcards | name, userId | HasMany Card (lazy) |
| `Card` | flashcards | front, back, explanation, tag, repetitions, easinessFactor, intervalDays, nextReviewDate | ManyToOne Deck (lazy) |
| `Scenario` | scenarios | title, language, level, category, description, rating, duration, imageUrl, contextPrompt, initialMessage, avatarUrl, navigation, voiceId, emotionsJson, gender, defaultEmotion | HasMany ScenarioItem (cascade ALL) |
| `ScenarioItem` | scenarios | name, price (BigDecimal), imageUrl, icon | ManyToOne Scenario |
| `ScenarioSession` | scenarios | userId, scenarioId, startedAt, finishedAt, feedback, isFinished | Dùng FK thuần (không JPA relation) |
| `SessionMessage` | scenarios | sessionId, senderRole (`user`/`assistant`), text, sentAt, correctionText, correctionExplanation | FK thuần tới session |
| `UserPronunciationLog` | practice | phrase, transcript, score, practicedAt | FK thuần tới user |
| `PaymentTransaction` | subscriptions | txnRef (unique), userId, tier, billingCycle, amount, status, vnpTransactionNo, responseCode, paidAt | FK thuần tới user |

**Quy tắc domain:**
- Soft-delete (`isDeleted` flag) trên `User`, `Deck`, `Card`, `Scenario` — không xóa thật. `ScenarioItems`/`SessionMessages`/`UserPronunciationLogs` cascade theo parent.
- `User.getActiveSubscriptionTier()` — computed property: trả về `Basic` nếu subscription đã hết hạn.
- `Card.review(quality 0-5)` — implement SM-2 ngay trong domain model: `easinessFactor = max(1.3, EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02)))`; `q < 3` → reset `repetitions=0, intervalDays=1`; `repetitions==1` → 1 ngày, `==2` → 6 ngày, sau đó `intervalDays * easinessFactor`.
- `ScenarioSession.finish(feedback)` — set `finished` + `finishedAt` + feedback.
- `User.anonymize()` — soft-delete + scrub PII khi user tự xoá tài khoản.

### 4.3 Services theo module

#### `users/service/AuthService`
- `register` — validate unique email/username, hash password, phát token, gửi welcome email; **user đầu tiên tự động thành Admin**
- `login` — verify password, phát JWT access + refresh token; nếu hash **legacy PBKDF2-SHA512** còn tồn tại thì re-hash sang BCrypt ngay (upgrade-on-login)
- `loginWithGoogle` — verify ID token qua `GoogleTokenVerifier` (gọi trực tiếp Google tokeninfo endpoint + kiểm tra `aud` khớp `GOOGLE_CLIENT_ID`), auto-create user nếu mới (username = email prefix, thêm số nếu trùng)
- `refreshToken` — rotation: revoke token cũ, phát cặp mới
- `revokeToken`, `getMe`, `updateSettings`, `updateAvatar`, `deleteAccount` (anonymize)
- `forgotPassword` — tạo OTP 6 chữ số (BCrypt-hash, lưu DB), vô hiệu các code cũ còn active, gửi email; **không tiết lộ email có tồn tại hay không** (anti-enumeration — email không tồn tại thì return im lặng)
- `resetPassword` — lấy code mới nhất chưa dùng (kể cả đã hết hạn), check expiry (10 phút) → attempts (tối đa 5) → verify; thành công thì mark used + đổi password

#### `users/service/AdminService`
- `getStats` — `totalUsers`, `activeSubscriptions`, `totalRevenueVnd` (tổng `Amount` của `PaymentTransactions` có `Status='Paid'`), `totalScenarios`, `totalCards`. Dùng `JdbcTemplate` cho 3 aggregate query, `UserRepository` cho user counts.
- `getUsers` / `updateUserSubscription` / `banUser` (soft-delete)
- `getSettings` / `saveSettings` — đọc/ghi toàn bộ `SystemSettings` dạng key-value map

> **Lưu ý contract:** `AdminDashboardStatsDto` trả **5 field** ở trên. Frontend `immersioFe/src/services/admin.ts` vẫn khai báo shape cũ (`activeSessions`, `averageDuration`, `growthData`, `sessionData`) — đây là khoảng trống đã biết, các chart 7-ngày trong dashboard admin không còn được backend cấp dữ liệu.

#### `scenarios/service/ScenarioService`
- `getScenarios` / `getScenarioById` — read, sắp xếp theo title
- `startSession` — tạo `ScenarioSession`; nếu `targetLanguage` khác `scenario.language` thì dịch `initialMessage` qua LLM (fail → giữ nguyên bản gốc), auto-append message đầu tiên của NPC; lưu language vào `ConcurrentHashMap<SessionId, String>`
- `sendMessage` — pipeline: (1) `analyzeGrammar` chạy **song song** (`CompletableFuture` + executor `scenario-llm`) với (2) dựng reply NPC; (3) lưu user message + correction; (4) parse `[EMOTION: xxx]`; (5) lưu assistant message. Trả `ChatOutputResponse(reply, correction?, emotion, message)`. Chặn nếu session đã finish.
- `completeSession` — `generateSessionFeedback` → `generateFlashcards` (tuần tự), rồi `session.finish(feedback)`
- `generateCustomFlashcards` — sinh deck theo `options` (fallback tách `deckName` theo dấu phẩy)
- `createScenario` / `updateScenario` / `deleteScenario` / `addScenarioItem` — Admin CRUD
- **Pure helpers (unit tested):** `sessionLanguage`, `normalizeLanguage`, `parseValidEmotions`, `parseEmotionTag`, `isCorrectCorrection`, `normalizeFlashcardOptions`
  - `parseEmotionTag`: emotion không nằm trong `EmotionsJson` → fallback `idle`; tag luôn được strip khỏi reply
  - `isCorrectCorrection`: text không đổi (case-insensitive) hoặc explanation chứa `"perfect"` → không hiện correction cho learner
- `seedScenarios()` — **hiện là no-op** (xem §9)

#### `flashcards/service/SrsService`
- `createDeck` / `getDecks` (kèm `cardCount` + `dueCount`) / `deleteDeck` (cascade soft-delete toàn bộ cards)
- `getReviewCards` — cards có `nextReviewDate <= now`, sort tăng dần
- `addCards` — **chỉ có bulk add** (nhận `List<AddCardDto>`); enforce limit **50 cards/ngày** cho Basic tier, **throw `ConflictException`** nếu vượt (không cap lặng lẽ)
- `reviewCard` — apply SM-2
- `deleteCard`

#### `practice/service/PronunciationService`
- `logPronunciation` — lưu log; normalize `phrase`/`transcript` (cột NOT NULL, client có thể gửi `targetWord`), truncate 2000 ký tự, clamp score 0-100
- `getUserLogs` — history theo `practicedAt` desc
- `analyzeCefrLevel` — **điểm trung bình đơn giản của pronunciation scores** (không time-decay), ngưỡng `≥90 → C1`, `≥75 → B2`, `≥60 → B1`, `≥40 → A2`, còn lại `A1`; trả kèm 1 skill score + suggestions tĩnh
- `generatePhrase` / `lookupWord` — delegate sang `PracticeLlmClient`
- `assessPronunciation` — gọi Azure Speech (phoneme-level); **mock 95%** nếu chưa set Azure key; fallback 85% nếu upstream lỗi. Gamification (+50 XP, +0.1 learning hours, cập nhật CEFR level) chạy sau khi lưu log và **không bao giờ làm fail request**

#### `subscriptions/service/SubscriptionService`
- `createPaymentUrl` — tính giá server-side (client không gửi amount), chống mua trùng gói còn hạn, lưu transaction `Pending` **trước** khi gọi PayOS (để gateway fail vẫn còn transaction cho admin approve), trả hosted checkout URL
- `handlePaymentReturn` — idempotent; **không trust query string**, re-query status từ PayOS; check `amountPaid` đủ; CANCELLED/EXPIRED → `markFailed`
- `handlePayOsWebhook` — verify HMAC signature qua `PayOsService`; `code == "00"` mới complete; idempotent
- `upgradeSubscription` — set tier + 30 ngày
- `completePaidTransaction` — yearly = +1 năm, monthly = +30 ngày; gửi receipt email (fire-and-forget)

#### `subscriptions/service/AdminTransactionService`
- `getTransactions` — danh sách giao dịch kèm thông tin user
- `approve(id)` — admin duyệt giao dịch `Pending` → `Paid` + cấp subscription

### 4.4 Client wrappers tích hợp API bên ngoài

#### `ScenarioLlmClient` (AI chính)
Gọi endpoint OpenAI-compatible của **9Router** qua `java.net.http.HttpClient`.

| DB Key | Task |
|---|---|
| `LlmEndpoint` | Endpoint dùng chung (fallback `https://9routerhelios.duckdns.org/v1/chat/completions`) |
| `ModelChat` + `ReasoningEffortChat` | NPC roleplay replies |
| `ModelGrammar` + `ReasoningEffortGrammar` | Grammar correction |
| `ModelFeedback` + `ReasoningEffortFeedback` | Session feedback |
| `ModelFlashcard` + `ReasoningEffortFlashcard` | Flashcard generation |
| `ModelPhrase` + `ReasoningEffortPhrase` | Pronunciation phrase / dictionary |

- Config cache TTL 30 giây; timeout: connect 10s, request 300s
- **Reasoning effort** đọc key theo feature, fallback key generic `ReasoningEffort`, default `"none"`
- **API key: duy nhất** — `nine-router.api-key` cho mọi endpoint (`resolveApiKey()` không còn phân nhánh theo provider như bản .NET)
- Methods: `generateChatResponse` (emotion tagging `[EMOTION: x]`), `analyzeGrammar` (JSON mode), `generateSessionFeedback`, `generateFlashcards`, `generateCustomFlashcards`, `translationContextPrompt`
- Mọi temperature đều là **0.6**
- Có fallback reply khi rỗng content hoặc HTTP lỗi (vd. `"I am sorry, I couldn't understand that."`)

#### `PracticeLlmClient`
- `generatePhrase(language, level, topic)` → `{phrase, translation, explanation}`
- `lookupWord(word, targetLanguage)` → bilingual dictionary entry; default values khi model trả rỗng

#### `AzureSpeechClient`
- `assessPronunciation(audio, phrase)` → JSON phoneme-level → `PronunciationAssessmentParser`
- `synthesizeSpeech(text, voice, style, styleDegree)` → bytes; region mặc định `centralindia`, voice `en-US-JennyNeural`
- `isConfigured()` — false khi `azure.speech.api-key` rỗng

#### `RouterTtsClient`
- `synthesize(text, voice, language)` → `POST {nine-router.base-url}/audio/speech` (OpenAI-compatible `{model, input}`) → raw bytes; voice prefix `edge-tts/`

#### `PayOsService`
- Base URL `https://api-merchant.payos.vn`
- `createPaymentLink` — HMAC-SHA256 signature (params sort ordinal, `key=value&…`), `POST /v2/payment-requests`
- `getPaymentStatus` — tra cứu trạng thái đơn
- `verifyWebhook(rawBody)` — verify signature + parse payload

#### `CloudinaryService` (implements `ImageUploadService`)
- `POST https://api.cloudinary.com/v1_1/<cloud>/image/upload`, params sort + SHA-1 hex signature (version 2), transformation `f_auto,q_auto`, folder mặc định `immersio`, header `Basic base64(apiKey:apiSecret)`

#### `GoogleTokenVerifier`
- Verify Google ID token qua tokeninfo endpoint; kiểm tra `aud` khớp `google.client-id`; trả `{email, name, picture}`

#### `EmailService` + `EmailTemplates`
- Gmail SMTP qua `JavaMailSender`; `sendSafe()` nuốt lỗi gửi (welcome / password-reset OTP / payment confirmation)

#### `JwtTokenProvider` + `JwtAuthenticationFilter`
- JWT ký HMAC bằng `jjwt`; claims: `sub` = userId, `email`, `role`; access token 15 phút, refresh token 7 ngày
- `JwtAuthenticationFilter` chạy trước `UsernamePasswordAuthenticationFilter`

#### `CompatiblePasswordEncoder` + `CompatiblePasswordHasher`
- `encode()` → **BCrypt**; `matches()` nhận cả BCrypt (`$2…`) và **legacy PBKDF2-SHA512** (100,000 iterations) — nhánh legacy tự biến mất sau mỗi lần login
- Đây là lý do `spring-security-crypto` BouncyCastle phải có mặt

### 4.5 Controllers

| Controller | Base Route | Auth |
|---|---|---|
| `HealthController` | `/api/health` | permitAll |
| `AuthController` | `/api/auth` | permitAll (toàn bộ `/api/auth/**`) |
| `AdminController` | `/api/admin` | `@PreAuthorize("hasRole('Admin')")` cả class |
| `AdminTransactionController` | `/api/admin/transactions` | `@PreAuthorize("hasRole('Admin')")` cả class |
| `ScenariosController` | `/api/scenarios` | authenticated; CRUD cần Admin |
| `FlashcardsController` | `/api/flashcards` | authenticated |
| `PracticeController` | `/api/practice` | authenticated; `/tts` + `/generate-phrase` permitAll |
| `SubscriptionController` | `/api/subscription` | authenticated; `payos-return` + `payos-webhook` permitAll |
| `UploadController` | `/api/upload` | authenticated |

**API Endpoints đầy đủ:**

```
# Health
GET    api/health                              permitAll

# Auth
POST   api/auth/register                       permitAll
POST   api/auth/login                          permitAll
POST   api/auth/google                         permitAll
POST   api/auth/refresh                        permitAll
POST   api/auth/revoke                         permitAll
POST   api/auth/forgot-password                permitAll
POST   api/auth/reset-password                 permitAll
GET    api/auth/me                             authenticated
POST   api/auth/settings                       authenticated
PATCH  api/auth/me/avatar                      authenticated
DELETE api/auth/me                             authenticated

# Scenarios
GET    api/scenarios                           authenticated
GET    api/scenarios/{id}                      authenticated
POST   api/scenarios                           [Admin]
PUT    api/scenarios/{id}                      [Admin]
DELETE api/scenarios/{id}                      [Admin]
POST   api/scenarios/{id}/items                [Admin]
POST   api/scenarios/sessions/start            authenticated
POST   api/scenarios/sessions/{id}/chat        authenticated
POST   api/scenarios/sessions/{id}/finish      authenticated
POST   api/scenarios/sessions/{id}/flashcards  authenticated

# Flashcards
POST   api/flashcards/decks                    authenticated
GET    api/flashcards/decks                    authenticated
DELETE api/flashcards/decks/{deckId}           authenticated
GET    api/flashcards/decks/{deckId}/review    authenticated
POST   api/flashcards/decks/{deckId}/cards     authenticated  (bulk list)
POST   api/flashcards/cards/{cardId}/review    authenticated
DELETE api/flashcards/cards/{cardId}           authenticated

# Practice
POST   api/practice/pronunciation-log          authenticated
GET    api/practice/pronunciation-history      authenticated
GET    api/practice/cefr-analysis              authenticated
POST   api/practice/assess-pronunciation       authenticated  multipart (audio, phrase)
POST   api/practice/tts                        permitAll      trả raw audio/mpeg
POST   api/practice/generate-phrase            permitAll
POST   api/practice/dictionary-lookup          authenticated

# Subscription
POST   api/subscription/upgrade                authenticated
POST   api/subscription/create-payment         authenticated
GET    api/subscription/payos-return           permitAll
POST   api/subscription/payos-webhook          permitAll

# Admin
GET    api/admin/stats                         [Admin]
GET    api/admin/users                         [Admin]
POST   api/admin/users/{userId}/subscription   [Admin]
POST   api/admin/users/{userId}/ban            [Admin]
GET    api/admin/ai-tuning                     [Admin]
POST   api/admin/ai-tuning                     [Admin]
GET    api/admin/transactions                  [Admin]
POST   api/admin/transactions/{id}/approve     [Admin]

# Upload
POST   api/upload/image                        authenticated  multipart (file, folder), max 10MB
```

**So với bản .NET:** có thêm `GET /api/health`, `PATCH /api/auth/me/avatar`, `DELETE /api/auth/me`, `POST /api/subscription/payos-webhook`, và cặp `GET/POST /api/admin/transactions*`. `POST /api/practice/transcribe` (Whisper) **đã bị bỏ** — không còn route này.

### 4.6 Response Format

Tất cả API wrap trong `ApiResponse<T>`:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "errors": null,
  "detail": null
}
```

`detail` là alias JSON của `message` — giữ lại cho SPA đã deploy (màn login đọc `detail` để hiện lỗi).

**`com.immersio.shared.exception.GlobalExceptionHandler`** (`@RestControllerAdvice`) map:

| Exception | HTTP |
|---|---|
| `ResourceNotFoundException` | 404 |
| `ConflictException` | 409 |
| `UnauthorizedException` | 401 |
| `AccessDeniedException` (`@PreAuthorize` fail) | 403 |
| `DomainException` | 400 |
| `MethodArgumentNotValidException` | 400 + map field errors trong `errors` |
| Khác | 500 (log stack trace qua SLF4J) |

Ngoài ra `SecurityConfig` có custom `authenticationEntryPoint` trả **401** (thay vì 403 mặc định của Spring) vì SPA chỉ refresh token khi gặp 401.

### 4.7 Auth Flow chi tiết

```
Register/Login → JWT Access Token (15 phút) + Refresh Token (7 ngày, lưu DB)
                                    ↓
                         fetchWithAuth (frontend)
                                    ↓
                    401 → POST api/auth/refresh
                                    ↓
              Backend: verify token còn active → revoke cũ → issue cặp mới
                                    ↓
                    Retry original request với token mới
                                    ↓
                    Refresh fail → clearSession() + redirect /login
```

**Google OAuth:** credential token → `GoogleTokenVerifier` (tokeninfo + `aud` check) → auto-create user nếu mới.

### 4.8 Configuration (`backend/src/main/resources/application.yml`)

Mỗi key đọc env var mới, fallback về tên env kiểu legacy mà `.env` production đang dùng — nên deploy hiện tại **không cần sửa `.env`**:

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:...}          # fallback: mặc định localhost:5432/ImmersioDb
  jpa:
    hibernate:
      ddl-auto: validate                      # không bao giờ tạo/sửa schema
    open-in-view: false
  flyway:
    locations: classpath:db/migration
  servlet.multipart:
    max-file-size: 10MB
    max-request-size: 12MB

jwt:
  secret: ${JWT_SECRET:${Jwt__Key:...}}
  access-token-expiration-minutes: 15
  refresh-token-expiration-days: 7

google:      client-id: ${GOOGLE_CLIENT_ID:...}
nine-router: base-url / api-key / model      # toàn bộ AI chat + JSON + TTS
azure.speech: api-key / region / endpoint    # pronunciation + TTS fallback
payos:       client-id / api-key / checksum-key / return-url / cancel-url
email.smtp:  from-email / from-name
cors:        allowed-origins
```

| Env var (ưu tiên) | Legacy fallback | Mục đích |
|---|---|---|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | — | PostgreSQL connection |
| `JWT_SECRET` | `Jwt__Key` | ≥32-byte base64 signing secret |
| `GOOGLE_CLIENT_ID` | `Google__ClientId` | Google OAuth (phải khớp frontend) |
| `NINE_ROUTER_API_KEY` | — | 9Router key — mọi AI route đi qua VPS1 |
| `NINE_ROUTER_BASE_URL` / `NINE_ROUTER_MODEL` | — | Endpoint + model (default `immersio`) |
| `AZURE_SPEECH_API_KEY` / `_REGION` / `_ENDPOINT` | `Azure__Speech__*` | Pronunciation scoring, TTS fallback |
| `EMAIL_SMTP_HOST` / `_PORT` / `_USERNAME` / `_PASSWORD` / `_FROM_EMAIL` | `Email__Smtp__*` | Gmail SMTP |
| `PAYOS_CLIENT_ID` / `_API_KEY` / `_CHECKSUM_KEY` / `_RETURN_URL` / `_CANCEL_URL` | `PayOS__*` | Payment gateway |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated allowed origins |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | `Cloudinary__*` | Image upload |

**Startup sequence:**
1. `@SpringBootApplication @Modulithic` — auto-config + module scan
2. Flyway migrate (`V1…V3`) → Hibernate `ddl-auto: validate` fail-fast nếu schema lệch
3. Security filter chain: CORS → JWT filter → stateless authorization
4. `@RestControllerAdvice` `GlobalExceptionHandler` đăng ký global
5. **Không có startup seeding** — xem §9

---

## 5. Frontend — React 19 + Vite

### 5.1 Routing (`immersioFe/src/App.tsx`)

```
/                    → Landing
/intro               → Landing
/login               → Login (email + Google OAuth)
/register            → Register
/forgot-password     → ForgotPassword (OTP flow)
/onboarding          → Onboarding
/privacy             → PrivacyPolicy
/delete-account      → DeleteAccount
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
  transactions       → TransactionsManagement
  scenarios          → ScenarioBuilder
  ai-tuning          → AITuning
```

**ThemeManager** — route-driven: `/admin/*` → dark class trên `<html>`, còn lại → light.

### 5.2 Services layer (`immersioFe/src/services/`)

Tất cả authenticated calls đi qua `authService.fetchWithAuth()` — auto-refresh JWT on 401, auto-unwrap `{success, data}` envelope.

```
API_BASE = "http://localhost:5249" (local) | "" (production same-origin)
```

| File | Singleton | Endpoints chính |
|---|---|---|
| `auth.ts` | `authService` | /api/auth/* — login, register, Google, refresh, revoke, me, settings, avatar |
| `admin.ts` | `adminService` | /api/admin/* — stats, users, ai-tuning; /api/scenarios (CRUD) |
| `scenario.ts` | `scenarioService` | /api/scenarios — list, detail, sessions (start/chat/finish/flashcards) |
| `decks.ts` | `decksService` | /api/flashcards/* — CRUD decks, cards, reviews |
| `practice.ts` | `practiceService` | /api/practice/* — pronunciation log, history, CEFR, assess, phrase, dictionary |
| `subscription.ts` | `subscriptionService` | /api/subscription/* — create-payment, payos-return |
| `upload.ts` | `uploadService` | /api/upload/image — Cloudinary upload |

**Session storage:** `localStorage` — accessToken, refreshToken, user JSON.

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
| `motion` | 12.23 | Animations, layout transitions |
| `lucide-react` | 0.546 | Icons |
| `recharts` | 3.7 | Admin charts |
| `@radix-ui/react-slider` | 1.3 | Accessible sliders |
| `@radix-ui/react-switch` | 1.2 | Accessible toggles |
| `@radix-ui/react-slot` | 1.2 | Component composition |
| `tailwindcss` v4 + `@tailwindcss/vite` | 4.1 | Utility CSS |
| `class-variance-authority` | 0.7 | Component variants |
| `clsx` + `tailwind-merge` | — | Conditional classes |
| `vite` | 6.2 | Dev server / build |

**Design system:** Dark glassmorphism. Admin = always dark. Student = always light.

**Vite config:**
- Path alias: `@` → `./src`
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`

### 5.5 Các trang quan trọng

**Admin:**
- `AdminDashboard` — KPI stat cards + recharts (AreaChart user growth, BarChart sessions/ngày). **Lưu ý:** các field `growthData`/`sessionData`/`averageDuration`/`activeSessions` không còn được backend trả về — xem note ở §4.3.
- `AITuning` — system prompt textarea, sensitivity sliders, LLM endpoint input, 5 model selectors (Chat/Grammar/Feedback/Flashcard/Phrase) mỗi cái có reasoning effort dropdown, provider presets (Groq/NVIDIA/StepFun/OpenCode Zen) + Custom
- `UsersManagement` — danh sách users, update subscription tier, ban user
- `TransactionsManagement` — duyệt PaymentTransaction
- `ScenarioBuilder` — CRUD scenarios, thêm items

**Student:**
- `ScenarioDetail` — roleplay chat; NPC emotion GIFs (idle/happy/angry); grammar correction inline; finish session → feedback + flashcard suggestions
- `VocalLab` — record voice → assess pronunciation; phoneme-level scores; generate phrase; CEFR card
- `FlashcardsPage` — list decks, review mode (flip card, SM-2 quality rating 0-5)
- `DictionaryPage` — lookup qua LLM, hiển thị phonetic/partOfSpeech/definition/example
- `Subscription` — pricing cards (Basic/Plus/Premium), PayOS checkout flow

### 5.6 Dev server architecture

```
server.ts  →  tsx watch
              ├── dev:  Vite middleware (React SPA + HMR)
              └── prod: express.static(dist)
```

Toàn bộ AI đi qua Java backend → 9Router VPS1; các proxy route Groq đã được gỡ khỏi Express.

Production: nginx static trên VPS2 phục vụ `dist/` tại `https://immersio.me` và proxy `/api` về backend. `immersioFe/vercel.json` là file vestigial — không có gì deploy lên Vercel.

---

## 6. AI System (LLM Integration)

### 6.1 Kiến trúc provider

**Một endpoint duy nhất.** Mọi AI (chat, JSON, TTS) đi qua 9Router VPS1 với model `immersio`. Config:

```
nine-router.base-url  = https://9routerhelios.duckdns.org/v1
nine-router.model     = immersio
nine-router.api-key   = NINE_ROUTER_API_KEY
```

Bản .NET từng có multi-provider (Groq / NVIDIA / StepFun / OpenCode Zen) với provider resolution qua tên domain của endpoint URL và API key riêng cho từng provider. Bản Java **đã bỏ hoàn toàn** nhánh đó: `resolveApiKey()` luôn trả cùng một key, và client dùng chung endpoint từ `LlmEndpoint`.

### 6.2 Admin-configurable model settings

Lưu trong bảng `SystemSettings` (key-value), admin đổi qua `/admin/ai-tuning`:

| Setting Key | Mặc định (sau V3) | Mô tả |
|---|---|---|
| `LlmEndpoint` | `https://9routerhelios.duckdns.org/v1/chat/completions` | Endpoint chat completions |
| `ModelChat` | `immersio` | NPC roleplay |
| `ModelGrammar` | `immersio` | Grammar correction |
| `ModelFeedback` | `immersio` | Session feedback |
| `ModelFlashcard` | `immersio` | Flashcard generation |
| `ModelPhrase` | `immersio` | Pronunciation phrase / dictionary |
| `ReasoningEffortChat` | `none` | none/low/medium/high/xhigh |
| `ReasoningEffortGrammar` | `none` | — |
| `ReasoningEffortFeedback` | `none` | — |
| `ReasoningEffortFlashcard` | `none` | — |
| `ReasoningEffortPhrase` | `none` | — |
| `ReasoningEffort` | — | Key generic, chỉ dùng khi key feature-specific vắng mặt |

System prompt được hardcode trong code từng client (`chatSystemPrompt`, `grammarSystemPrompt`, `flashcardSystemPrompt`, `customFlashcardSystemPrompt`, `dictionarySystemPrompt`, `phraseSystemPrompt`, `FEEDBACK_SYSTEM_PROMPT`) — **không còn** các key `SystemPrompt`, `GrammarSensitivity`, `VocabSensitivity`, `EnableSlang`, `SpeedOfSpeech` trong DB.

### 6.3 Flashcard Types (3 polymorphic types)

LLM trả về 3 loại card, frontend map sang `AddCardDto(front, back, explanation, tag)`:

| Type | Khi nào dùng | Front | Back |
|---|---|---|---|
| `vocab` | Từ vựng user gặp/mắc lỗi | word | meaning (Tiếng Việt) |
| `grammar` | Lỗi ngữ pháp của user | title (tên cấu trúc) | usage (Tiếng Việt) |
| `sentence` | Idiom/collocation (cloze deletion) | `cloze_sentence` | translation (Tiếng Việt) |

Prompt yêu cầu NPC giới thiệu từ mới cũng phải được đưa vào card, kể cả khi user không nói từ đó.

### 6.4 CEFR Scoring

**Bản hiện tại đơn giản hơn nhiều so với bản .NET:**

```
score = round(average(pronunciation log scores))
≥90 → C1 | ≥75 → B2 | ≥60 → B1 | ≥40 → A2 | else → A1
```

Không còn: time-decay weighting, trọng số InteractiveComprehension từ completed scenarios, pronunciation cap ở A2, active-vocabulary matching, hay LLM-generated suggestions.

---

## 7. Subscription & Payment

### 7.1 Subscription Tiers

| Tier | Giá tháng | Giá năm (−20%) | Giới hạn |
|---|---|---|---|
| Basic | Free | — | 50 flashcards/ngày |
| Plus | 69,000đ | 662,400đ | Không giới hạn |
| Premium | 199,000đ | 1,910,400đ | Không giới hạn + features cao cấp |

Giá tính server-side (`monthly * 12 * 0.8` cho yearly); client không bao giờ gửi amount.

### 7.2 Payment Flow

```
1. User chọn tier + cycle → POST /api/subscription/create-payment
2. Backend tạo PaymentTransaction (Pending) + gọi PayOS API
3. PayOS trả về checkoutUrl → Frontend redirect
4. User thanh toán trên PayOS portal
5a. PayOS redirect về returnUrl (GET /api/subscription/payos-return?orderCode=...)
5b. PayOS gửi signed webhook (POST /api/subscription/payos-webhook)   ← đường đáng tin cậy
6. Backend verify authoritative status từ PayOS (không trust query string)
7. Nếu PAID + đủ tiền: update SubscriptionTier/ExpiresAt + gửi receipt email
```

Webhook là đường chính để mark Paid — hoạt động kể cả khi user không quay lại returnUrl. Admin có thể approve giao dịch `Pending` thủ công qua `/api/admin/transactions/{id}/approve`.

---

## 8. Deployment

| Target | Cách deploy |
|---|---|
| Frontend | GitHub Actions → `npm ci` + `vite build` → `scp` dist.tar.gz tới `/var/www/immersio` trên VPS2 (nginx) |
| Backend | GitHub Actions → multi-arch Docker build (`linux/amd64`,`linux/arm64/v8`) → push GHCR `immersio-be-java:latest` |
| VPS | `docker compose pull && docker compose up -d` trên VPS2 |

**CI/CD:** `.github/workflows/deploy.yml` — 3 job: `build-frontend`, `build-backend`, `deploy` (deploy cần cả hai). Deploy đi qua Tailscale SSH vào VPS2.

**Dockerfile:** multi-stage — build stage `maven:3.9-eclipse-temurin-21` chạy trên `--platform=$BUILDPLATFORM` (bytecode arch-independent, tránh QEMU emulation), runtime stage `eclipse-temurin:21-jre`, chạy user non-root `immersio` (uid 1001), heap theo container limit (`MaxRAMPercentage=55`), `HEALTHCHECK` gọi `/api/health` và grep `UP`.

**docker-compose.yml:** `postgres-db` (postgres:16-alpine, `ImmersioDb`) + `immersio-api` (`ghcr.io/<owner>/immersio-be-java:latest`, bind `127.0.0.1:5249`). Nạp env từ `.env` + `secrets.env` (optional).

**nginx.conf** phục vụ static `dist/` và reverse-proxy `/api` → backend.

---

## 9. Seed Data

**Không có startup seeding.** `ScenarioService.seedScenarios()` tồn tại nhưng body rỗng, không có caller nào; không có seed 4 scenario mặc định và không có seed admin user (`admin@immersio.com / Admin123!`) như bản .NET.

Hệ quả thực tế:
- Admin user chỉ được tạo khi user đầu tiên đăng ký (logic `if (userRepository.count() == 0) user.setRole("Admin")` trong `AuthService`) hoặc tự đổi tier qua DB.
- Database production đã có sẵn scenario rows từ trước khi migrate; database mới sẽ trống hoàn toàn.

---

## 10. Các quyết định kiến trúc quan trọng

| Quyết định | Lý do |
|---|---|
| Spring Modulith thay 4 project .NET | Giữ ranh giới module nhưng gộp vào một deployable đơn giản hơn |
| `ModulithArchitectureTest` verify module discovery | Chặn module đọc internals của module khác ngay trong CI |
| Flyway + `ddl-auto: validate` | Schema do migration SQL sở hữu, Hibernate không bao giờ tạo/sửa bảng |
| `ApiResponse.getDetail()` alias cho `message` | SPA đã deploy vẫn đọc `detail` cho error text |
| Custom 401 entry point trong `SecurityConfig` | Spring mặc định trả 403, sẽ khiến SPA không refresh token |
| `AccessDeniedException` → 403 handler | Không có handler thì `@PreAuthorize` fail bị nuốt thành 500 |
| `CompatiblePasswordEncoder` (BCrypt + verify PBKDF2) | Migrate hash không cần reset password; nhánh legacy tự xoá dần |
| Soft-delete (`isDeleted`) | Không mất data, audit trail |
| SM-2 SRS trong `Card` domain method | Business logic thuần, unit test được không cần Spring |
| `ConcurrentHashMap` cho session language | Lưu language selection trong memory thay vì DB để tránh migration |
| Grammar + NPC reply chạy song song (`CompletableFuture`) | Hai LLM call độc lập, giảm latency chat xuống còn call chậm nhất |
| Persist transaction trước khi gọi PayOS | Gateway fail vẫn để lại transaction Pending cho admin xử lý |
| Webhook verify bằng HMAC signature | Không tin payload không chữ ký |
| Single 9Router provider | Một endpoint + một key, bỏ nhánh provider resolution phức tạp |
| AI temperature 0.6 cho mọi task | Đồng nhất thay vì 0.7 (chat) / 0.2 (JSON) như bản .NET |
| `ConcurrentHashMap` config cache 30s trong `ScenarioLlmClient` | Không query `SystemSettings` mỗi LLM call nhưng vẫn phản ánh thay đổi admin nhanh |
| `fetchWithAuth` monkey-patch response.json() | Auto-unwrap `{success, data}` envelope ở một nơi duy nhất |

---

## 11. Files quan trọng cần biết

| File | Vai trò |
|---|---|
| `backend/src/main/java/com/immersio/ImmersioApplication.java` | Entry point, kích hoạt Spring Modulith |
| `backend/src/main/resources/application.yml` | Toàn bộ config + mapping env var (legacy fallback) |
| `backend/src/main/resources/db/migration/V1__initial_schema.sql` | 12 bảng gốc — nguồn sự thật cho schema |
| `backend/src/main/java/com/immersio/shared/dto/ApiResponse.java` | Response envelope + `detail` alias |
| `backend/src/main/java/com/immersio/shared/exception/GlobalExceptionHandler.java` | Domain exception → HTTP codes |
| `backend/src/main/java/com/immersio/shared/security/SecurityConfig.java` | Filter chain, permitAll list, CORS, PasswordEncoder |
| `backend/src/main/java/com/immersio/shared/security/CompatiblePasswordHasher.java` | Verify legacy PBKDF2-SHA512 |
| `backend/src/main/java/com/immersio/scenarios/service/ScenarioService.java` | Roleplay session pipeline, emotion parsing |
| `backend/src/main/java/com/immersio/scenarios/service/ScenarioLlmClient.java` | Toàn bộ AI chat/JSON integration + system prompts |
| `backend/src/main/java/com/immersio/practice/service/PronunciationService.java` | CEFR scoring + Azure assessment + gamification |
| `backend/src/main/java/com/immersio/practice/service/AzureSpeechClient.java` | Azure pronunciation assessment + TTS |
| `backend/src/main/java/com/immersio/practice/service/RouterTtsClient.java` | 9Router TTS (primary) |
| `backend/src/main/java/com/immersio/users/service/AuthService.java` | Auth flows + OTP reset + upgrade-on-login |
| `backend/src/main/java/com/immersio/users/service/AdminService.java` | Dashboard stats + AI settings read/write |
| `backend/src/main/java/com/immersio/subscriptions/service/SubscriptionService.java` | PayOS return + webhook + pricing |
| `backend/src/main/java/com/immersio/flashcards/domain/Card.java` | SM-2 algorithm implementation |
| `backend/src/test/java/com/immersio/ModulithArchitectureTest.java` | Enforce module boundaries (chạy qua `./mvnw verify`) |
| `immersioFe/src/services/auth.ts` | fetchWithAuth, JWT refresh, session management |
| `immersioFe/src/App.tsx` | Route tree + ThemeManager |
| `immersioFe/src/pages/admin/AITuning.tsx` | AI config UI + provider presets |
| `immersioFe/src/services/admin.ts` | Admin API client + `AiSettings` interface |
| `CLAUDE.md` | Development workflow rules cho Claude Code |