---
name: ecc-memory-persistence
description: How ECC persists memory across sessions via summaries, memory files, and instincts
metadata:
  type: reference
---

# ECC Memory Persistence — Deep Dive

> **Scope:** How ECC (Everything Claude Code) persists memory across sessions.
> **Covers:** `.tmp` summaries, `memory.md`, CLAUDE.md, Continuous Learning v2 (CLv2), and hook-driven persistence.
> **Project:** Immersio — ASP.NET Core 9 + React 19/Vite

---

## 1. Why Memory Persistence Matters

Claude Code sessions are **stateless by default**. When you close the terminal or VS Code, the entire conversation context is lost. ECC solves this by persisting three kinds of memory:

| Memory Type | Scope | Lifetime | Who Owns It |
|---|---|---|---|
| **Bounded Prior Context** | Recent session summaries | 14–30 days (configurable) | ECC automatic hooks |
| **Project Memory** | Manual facts about this project | Indefinite (git-tracked) | You / developer |
| **Agent Memory (CLv2)** | Learned patterns & instincts | Indefinite | ECC automatic hooks |

Without persistence, every new session starts from zero — you’d have to re-explain the tech stack, re-state open tasks, and re-teach Claude your preferences every single time.

---

## 2. The Three Layers of Memory

### 2.1 Bounded Prior Context (`.tmp` files)

**Location:** `~/.claude/session-data/`

These are **automatically generated session summaries** written by the `Stop` and `SessionEnd` hooks.

#### What’s inside a `.tmp` file

```json
{
  "timestamp": "2026-06-20T10:45:00Z",
  "project_cwd": "c:/Users/Admin/.../Immersio",
  "files_edited": ["docs/ecc-harness-guide.md", "CLAUDE.md"],
  "key_facts": [
    "User asked to add full ECC guide to docs/",
    "Updated memory.md and CLAUDE.md with new audit score",
    "Explained how hooks work step-by-step"
  ],
  "pending_tasks": ["Need update docs after next audit run"],
  "tech_stack": "ASP.NET Core 9 + React 19 + Vite + PostgreSQL",
  "models_used": ["sonnet", "opus"],
  "total_cost_usd": 1.23
}
```

#### How it’s created

```
Mỗi response xong
    ↓
Stop hook: `session-end.js`
    ↓
Read transcript của turn vừa rồi
    ↓
Run LLM summarization (local, không gọi API)
    ↓
Append summary → ~/.claude/session-data/2026-06-20-<hash>-session.tmp
```

#### How it’s read (SessionStart)

```
Mở Claude Code
    ↓
SessionStart hook: `session-start-bootstrap.js`
    ↓
Scan ~/.claude/session-data/ → read từng .tmp file
    ↓
Filter: chỉ lấy file có "project_cwd" trùng với cwd hiện tại
    ↓
Sort theo timestamp → lấy 3 file gần nhất
    ↓
Inject "bounded prior context" vào system prompt của session
```

> ⚠️ **Important:** File `.tmp` chỉ chứa **summary**, không phải full transcript. Mỗi summary ~1-3KB. Không bị tràn context.

---

### 2.2 Project Memory (`memory.md` + `CLAUDE.md`)

These are **manual, persistent, git-tracked** memory sources. They survive forever and are the **source of truth**.

#### `CLAUDE.md` (Project-level)

- **Đọc ở đâu:** Mỗi SessionStart, hook inject toàn bộ file này vào system prompt.
- **Nội dung:** Tech stack, commands, architecture, workflow, model routing.
- **Ví dụ:**

```markdown
# MyProject

## Tech Stack
- React 19 + TypeScript + Vite
- ASP.NET Core 9 + PostgreSQL
- Tailwind CSS v4 + Radix UI

## Commands
npm run dev        # Dev server on :3000
dotnet run --project src/Immersio.WebApi   # Backend on :5249
```

#### `.claude/memory.md` (Project-level persistent notes)

- **Đọc ở đâu:** Mỗi SessionStart, hook inject sau CLAUDE.md.
- **Nội dung:** Facts learned during development that don't belong in CLAUDE.md.
- **Ví dụ:**

```markdown
## Known Bugs
- `getVoiceForLanguage()` stale closure fixed 2026-06-18
- TypeScript IDE errors pre-existing (@types/react issue)

## Decisions
- Using PayOS for Vietnamese payments (decided 2026-05)
- Using Vercel for frontend deploy (not changing)
```

> **Key difference:**
> - `CLAUDE.md` = **Static project briefing** (what the project IS)
> - `memory.md` = **Dynamic learned facts** (what we've DISCOVERED)

---

### 2.3 Agent Memory — Continuous Learning v2 (CLv2)

**Location:** `~/.claude/skills/learned/` + `~/.local/share/ecc-homunculus/`

This is the **smartest** layer. It extracts patterns from your workflow and turns them into reusable "instincts".

#### How it works

```
Trong session:
    ↓
PostToolUse hook: `observe-runner.js` ghi nhận mỗi tool call
    ↓
Pattern detected: "User always runs /model sonnet → npm run build → /code-review"
    ↓
Lưu pattern với confidence score (0.0 → 1.0)
    ↓
File instinct: ~/.claude/skills/learned/<hash>.instinct
```

#### Example `.instinct` file

```json
{
  "id": "build-before-review-abc123",
  "pattern": "Before /code-review, always run npm run build first",
  "confidence": 0.92,
  "occurrences": 14 timestamps,
  "last_seen": "2026-06-20T10:45:00Z",
  "source_project": "Immersio"
}
```

#### When confidence đủ cao (>0.85):

```bash
/evolve        # Cluster instincts into skills
/instinct-status   # Hiển thị instincts với confidence
```

Khi bạn gõ `/evolve`, ECC cluster các instincts liên quan và biến thành **skill** mới trong `~/.claude/skills/learned/SKILL.md`.

---

## 3. Full Persistence Flow (Start → Work → End)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. SESSION START                                                        │
│ ───────────────                                                         │
│ SessionStart hook fires:                                                │
│   • Inject CLAUDE.md into system prompt                                 │
│   • Inject ~/.claude/memory.md into system prompt                       │
│   • Scan ~/.claude/session-data/ for .tmp files matching cwd            │
│   • Inject "bounded prior context" (3 latest .tmp summaries)             │
│   • Load .claude/rules/ecc/ (coding standards, etc.)                    │
│   • Load ~/.claude/skills/learned/ instincts với high confidence       │
│   • Detected package manager (npm/pnpm/yarn/bun)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. DURING SESSION (Every tool call)                                     │
│ ─────────────────────────────────                                       │
│ PostToolUse hook fires:                                                 │
│   • observe-runner.js records: tool name, file path, success/failure   │
│   • governance-capture.js checks for policy violations (optional)       │
│   • session-activity-tracker.js writes to metrics DB                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. AFTER EACH RESPONSE (Stop)                                           │
│ ────────────────────────────                                            │
│ Stop hook fires (non-blocking):                                        │
│   • session-end.js:    Write .tmp summary to session-data/              │
│   • format-typecheck:  Batch lint + typecheck all edited files        │
│   • evaluate-session:  Extract patterns for CLv2                        │
│   • cost-tracker:      Update running cost metrics                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. CONTEXT COMPACTING (if ~95% full)                                     │
│ ───────────────────────────────────                                     │
│ PreCompact hook fires:                                                  │
│   • strategic-compact.js: Suggest /compact at logical breakpoint        │
│   • pre-compact.js:       Persist current state before compaction      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. FULLY CLOSE (SessionEnd)                                             │
│ ───────────────────────────                                             │
│ SessionEnd hook fires:                                                  │
│   • session-end-marker.js: Mark session as cleanly ended               │
│   • .tmp file finalized (waits for transcript metadata)                  │
│   • evaluate-session:     Full pattern extraction                       │
│   • Prune old .tmp files (respect ECC_SESSION_RETENTION_DAYS)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. How ECC Knows Which `.tmp` Belongs to Which Project

Anh đã thấy: các file `.tmp` **không có project name** trong tên:

```bash
2026-06-20-7828c167-session.tmp   # Của Immersio?
2026-06-20-ad1235d8-session.tmp   # Hay của project khác?
```

### Cách bootstrap script xác định:

```javascript
// Pseudocode of session-start-bootstrap.js
const fs = require('fs');
const path = require('path');

const currentCwd = process.cwd();  // "c:/Users/Admin/.../Immersio"

// 1. Lấy tất cả .tmp files
const tmpFiles = fs.readdirSync('~/.claude/session-data/')
  .filter(f => f.endsWith('.tmp'))
  .map(f => {
    const content = JSON.parse(fs.readFileSync(f, 'utf8'));
    return { file: f, project: content.project_cwd, date: content.timestamp };
  });

// 2. Lọc file thuộc project này
const myFiles = tmpFiles.filter(f => f.project === currentCwd);

// 3. Sort và lấy 3 gần nhất
const recent = myFiles.sort((a, b) => b.date - a.date).slice(0, 3);

// 4. Inject summaries vào context
injectIntoSystemPrompt(recent.map(f => f.summary));
```

### Vấn đề thực tế:

| Vấn đề | Mô tả |
|---|---|
| **Orphan files** | Nếu bạn move project folder → `project_cwd` không còn match → mất liên kết |
| **Slow scan** | 1000 file .tmp × mở đọc JSON = chậm |
| **No subfolder** | `session-data/` flat, không chia theo project |
| **Name collision** | 2 project cùng tên folder "frontend" → nhầm lẫn |

---

## 5. Memory Comparison Table

| Aspect | `.tmp` (Bounded Context) | `memory.md` | CLAUDE.md | CLv2 (Instincts) |
|---|---|---|---|---|
| **Auto-generated** | ✅ Yes | ❌ Manual | ❌ Manual | ✅ Yes |
| **Git-tracked** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Project-isolated** | ❌ Flat folder | ✅ Project root | ✅ Project root | ❌ Global |
| **Full-text search** | ❌ Scan JSON | ✅ Any text | ✅ Any text | ✅ Indexed |
| **Survives crash** | ⚠️ Maybe | ✅ Yes | ✅ Yes | ✅ Yes |
| **Controls cost** | ✅ Capped (3 latest) | ✅ Capped | ✅ Capped | ✅ Capped |
| **Private info** | ⚠️ Sensitive (API keys?) | ⚠️ Careful | ⚠️ Careful | ❌ No API keys |
| **Best for** | Recent context | Learned facts | Tech briefing | Workflow patterns |

---

## 6. Where Data Actually Lives (Disk Layout)

```
~/.claude/
├── session-data/
│   ├── 2026-06-20-7828c167-session.tmp     # Session summary (auto)
│   ├── 2026-06-20-ad1235d8-session.tmp
│   └── compaction-log.txt                    # PreCompact events
│
├── skills/learned/
│   ├── workflow-instinct-a4f2e1.instinct    # CLv2 auto-generated
│   ├── build-before-review-abc123.instinct
│   └── auto-promoted-skill/SKILL.md         # Promoted by /evolve
│
├── rules/ecc/                               # Loaded into every session
│   ├── common/
│   ├── web/
│   └── typescript/
│
└── memory.md   ← ❌ Không nên lưu ở đây! Nên lưu ở project/.claude/memory.md
```

**Project root (Immersio):**
```
Immersio/
├── CLAUDE.md              ← Tech briefing, loaded into system prompt
├── .claude/
│   ├── memory.md          ← Persistent project facts (git-tracked)
│   ├── settings.json      ← Project hooks, permissions
│   └── settings.local.json ← Local-only (not committed)
└── docs/
    └── ecc-harness-guide.md  ← This doc
```

---

## 7. How to Recover If `.tmp` Gets Corrupted or Lost

### Scenario 1: `session-data/` quá lớn, chậm

```bash
# Xoá file .tmp cũ hơn 30 ngày (hoặc giữ lại 100 file mới nhất)
ls -t ~/.claude/session-data/*.tmp | tail -n +100 | xargs rm

# Hoặc set retention ngắn hơn
export ECC_SESSION_RETENTION_DAYS=7
```

### Scenario 2: Move project → mất liên kết `.tmp`

```bash
# Giả sử bạn move project từ /old/path/Immersio -> /new/path/Immersio
# Cách 1: Dùng symlink
ln -s /old/path/Immersio /new/path/Immersio

# Cách 2: Update trong memory.md
# Viết lại: "Project moved from /old/path to /new/path on 2026-06-20"
```

### Scenario 3: Session crash → `.tmp` không được write

```bash
# Không có cách recover auto.
# Memory.md vẫn còn (nếu bạn đã update tay trong session).
# CLAUDE.md vẫn còn.
# Chỉ mất "bounded prior context" của turn cuối.
```

---

## 8. ECC vs. Native Claude Code Memory

| Feature | Native Claude Code | With ECC |
|---|---|---|
| Session resume | ❌ No | ✅ .tmp summaries |
| Project context | ❌ Manual re-explain | ✅ CLAUDE.md + memory.md |
| Learned patterns | ❌ No | ✅ CLv2 instincts |
| Rules enforcement | ❌ No | ✅ Auto-injected from rules/ |
| Config persistence | ❌ No | ✅ hooks.json, settings.json |
| Cross-project isolation | ❌ No | ⚠️ Partial (cwd-based) |

---

## 9. Best Practices for Immersio

### Để memory hoạt động tốt nhất:

1. **Update `memory.md` after big sessions**
   - Không đợi hook auto-write (vì nó chỉ lưu `.tmp`, không lưu memory.md)
   - Tự thêm facts quan trọng vào `.claude/memory.md`

2. **Giữ `CLAUDE.md` lean**
   - Chỉ chứa static info (tech stack, commands, architecture)
   - Không chứa facts thay đổi (ghi vào memory.md)

3. **Dùng `/evolve` định kỳ**
   - Khi instincts đủ nhiều, cluster chúng thành skill
   - Giúp workflow tự động suggest trong session sau

4. **Dọn `session-data/` khi chậm**
   - Mỗi tuần xoá file cũ hơn 7 ngày
   - Hoặc set `ECC_SESSION_RETENTION_DAYS=7` permanently

5. **Đừng nhập API keys vào `.tmp` hoặc instincts**
   - `.tmp` không mã hóa, lưu dưới dạng plain text
   - Secrets luôn lưu trong `.env` hoặc `settings.local.json` (gitignored)

---

## 10. Summary

ECC memory persistence là **3-layer system**:

| Layer | Persistence | Reliability | Best For |
|---|---|---|---|
| **Bounded Prior** (`.tmp`) | Auto, transient | Medium | Recent context, conversation continuity |
| **Project Memory** (`memory.md` + `CLAUDE.md`) | Manual, permanent | High | Tech stack, known bugs, decisions |
| **Agent Memory** (CLv2 instincts) | Auto, permanent | Medium-High | Workflow patterns, coding habits |

**Key insight:** `.tmp` là **auto-summary** giúp bạn không phải re-explain mọi thứ, nhưng **`memory.md` và `CLAUDE.md` là source of truth** — bạn kiểm soát được, git-tracked, và survive mọi crash.

---

*Related: See `docs/ecc-harness-guide.md` for full harness overview.*
