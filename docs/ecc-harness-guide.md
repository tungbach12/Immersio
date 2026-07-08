# ECC (Everything Claude Code) — Installation & Usage Guide for Immersio

> **Version:** Based on ECC `main` (git: `affaan-m/ECC`) — covers v2.0.0+
> **Scope:** Full harness — agents, skills, rules, hooks, commands, and cross-platform support
> **Project:** Immersio — ASP.NET Core 9 backend + React 19/Vite frontend

---

## Table of Contents

1. [What is ECC?](#what-is-ecc)
2. [Quick Start](#quick-start)
3. [Installation Methods](#installation-methods)
   - Option 1: Plugin Install (Recommended)
   - Option 2: Manual Install
   - Option 3: npm Install
   - Option 4: Selective Install
4. [Three-Level Configuration Hierarchy](#three-level-configuration-hierarchy)
5. [Full Harness Component Tree](#full-harness-component-tree)
6. [Agents (67 Specialized Subagents)](#agents)
7. [Skills (271 Workflow Definitions)](#skills)
8. [Commands (92 Maintained Slash Entries)](#commands)
9. [Rules (34 Always-Follow Guidelines)](#rules)
10. [Hooks (20+ Lifecycle Scripts)](#hooks)
11. [Cross-Platform & Cross-Harness Support](#cross-platform--cross-harness-support)
12. [AgentShield — Security Auditor](#agentshield--security-auditor)
13. [Continuous Learning v2](#continuous-learning-v2)
14. [Token Optimization](#token-optimization)
15. [Dashboard GUI](#dashboard-gui)
16. [Package Manager Detection](#package-manager-detection)
17. [Hook Runtime Controls](#hook-runtime-controls)
18. [Agent Data Home (Multi-Harness Isolation)](#agent-data-home-multi-harness-isolation)
19. [Reset / Uninstall](#reset--uninstall)
20. [FAQ & Troubleshooting](#faq--troubleshooting)
21. [Security](#security)
22. [Local Immersio Installation Status](#local-immersio-installation-status)

---

## What is ECC?

**ECC (Everything Claude Code)** is a comprehensive harness framework for Claude Code (and other AI coding tools) that provides:

- **67 specialized subagents** for delegation (planner, code-reviewer, security-reviewer, build-error-resolver, etc.)
- **271 skills** for workflow automation (TDD, security review, E2E testing, API design, etc.)
- **92 maintained slash commands** (e.g. `/plan`, `/code-review`, `/security-scan`)
- **34 always-follow rules** covering coding style, testing, security, git workflow, performance
- **20+ lifecycle hooks** for PreToolUse, PostToolUse, SessionStart, Stop, etc.
- **14+ MCP server configurations** (GitHub, Supabase, Context7, Exa, Playwright, etc.)
- **Cross-harness support** for Cursor, Codex CLI, OpenCode, GitHub Copilot, Zed, and more

> **Stats:** 211.9K+ stars, 32.5K+ forks, 230+ contributors, 12+ language ecosystems

---

## Quick Start

### Prerequisites

- Claude Code CLI **v2.1.0+**
- Node.js 18+ (for scripts)
- Git

### Full Installation — Recommended End-to-End Path

> **Goal:** Install the complete harness (plugin + all rules + hooks + MCP + token optimization + verification) from zero.
> **Estimated time:** 5–10 minutes

#### Step 1 — Install the ECC Plugin

```bash
# Inside a Claude Code session:
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```

> This gives you instant access to: **67 agents**, **271 skills**, **92 commands**, and **20+ hooks**.

#### Step 2 — Copy All Rules to `~/.claude/rules/ecc/`

> ⚠️ **Why manual?** The Claude Code plugin system cannot distribute `rules` ([upstream limitation](https://code.claude.com/docs/en/plugins-reference)). Rules must be copied by hand.

```bash
# Clone the repo (or pull latest)
git clone https://github.com/affaan-m/ECC.git /tmp/ECC

# Create the rules directory
mkdir -p ~/.claude/rules/ecc/

# === Step 2a — Universal (always apply) ===
cp -r /tmp/ECC/rules/common ~/.claude/rules/ecc/

# === Step 2b — Language-specific (pick ALL you need) ===
# For Immersio: React 19 + TypeScript + ASP.NET Core 9
cp -r /tmp/ECC/rules/web          ~/.claude/rules/ecc/    # React, Vite, Next.js, CSS
cp -r /tmp/ECC/rules/typescript   ~/.claude/rules/ecc/    # TypeScript / JavaScript
cp -r /tmp/ECC/rules/react        ~/.claude/rules/ecc/    # React-specific
cp -r /tmp/ECC/rules/csharp      ~/.claude/rules/ecc/    # .NET / C#
cp -r /tmp/ECC/rules/java         ~/.claude/rules/ecc/    # Java (if any)
# cp -r /tmp/ECC/rules/python     ~/.claude/rules/ecc/    # Uncomment if Python backend
cp -r /tmp/ECC/rules/golang       ~/.claude/rules/ecc/    # Go (if any)
# cp -r /tmp/ECC/rules/swift      ~/.claude/rules/ecc/    # iOS/Swift (uncomment if needed)
# cp -r /tmp/ECC/rules/php        ~/.claude/rules/ecc/    # PHP (uncomment if needed)

# Verify rules are in place
ls ~/.claude/rules/ecc/
```

#### Step 3 — Install the Hooks Runtime

> ⚠️ **Do NOT copy raw `hooks/hooks.json`** from the repo. Use the installer so hook command paths are resolved correctly.

```bash
# macOS / Linux
bash /tmp/ECC/install.sh --target claude --modules hooks-runtime

# Windows PowerShell
pwsh -File /tmp/ECC/install.ps1 --target claude --modules hooks-runtime
```

This writes resolved hooks to `~/.claude/hooks/hooks.json` and leaves any existing `~/.claude/settings.json` untouched.

#### Step 4 — Configure MCP Servers (Optional but Recommended)

```bash
# Firecrawl (web scraping / search)
# 1. Get an API key at firecrawl.dev
# 2. Create ~/.claude/.mcp.json with the config below
```

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

> See `ECC/mcp-configs/mcp-servers.json` for other MCP configurations (GitHub, Supabase, Vercel, Context7, etc.).

#### Step 5 — Set Token Optimization

```json
// ~/.claude/settings.json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

#### Step 6 — Add the Project `CLAUDE.md`

```bash
# In your project root
touch CLAUDE.md
```

See `ECC/examples/CLAUDE.md` for a full example. At minimum include:

```markdown
# MyProject

## Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run lint       # TypeScript / ESLint
dotnet run --project src/Immersio.WebApi    # Backend
```

## Tech Stack

- React 19 + TypeScript + Vite
- ASP.NET Core 9 + PostgreSQL
- Tailwind CSS v4 + Radix UI
```

#### Step 7 — Verify the Installation

```bash
# 1. Verify harness health
node /tmp/ECC/scripts/harness-audit.js repo --format text

# 2. Verify plugin is loaded
/plugin list ecc@ecc

# 3. Verify rules are recognized (open a new Claude session)
#    — rules in ~/.claude/rules/ecc/ auto-apply on session start

# 4. Verify hooks are firing
#    — edit a .tsx file → auto-format should trigger
#    — try a dangerous command → hook should warn
```

#### Step 8 — Register as a Claude Plugin Marketplace Entry (Optional)

```bash
# This allows other team members to install your project's harness config
# by referring to your GitHub repo
```

See `ECC/examples/saas-nextjs-CLAUDE.md` for a real-world SaaS example.

---

## Installation Methods (Alternatives)

> **CRITICAL:** Do NOT stack install methods. Choose one path and stick with it. Mixing methods causes conflicts.

### ⚠️ Method Independence Warning

ECC has **three public identifiers** that are NOT interchangeable:

| Identifier | Repository | Distribution |
|---|---|---|
| `affaan-m/ECC` | GitHub source repo | GitHub, source builds |
| `ecc@ecc` | Claude marketplace plugin | Claude plugin system |
| `ecc-universal` | npm package | npm/yarn/pnpm/bun |

Choose ONE method below:

---

### Option 1: Install as Plugin (Recommended)

The easiest and most maintained path:

```bash
# 1. Add the ECC marketplace
/plugin marketplace add https://github.com/affaan-m/ECC

# 2. Install the plugin
/plugin install ecc@ecc
```

Or add directly to `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ecc": {
      "source": {
        "source": "github",
        "repo": "affaan-m/ECC"
      }
    }
  },
  "enabledPlugins": {
    "ecc@ecc": true
  }
}
```

> **Note:** The Claude Code plugin system **cannot distribute `rules`** ([upstream limitation](https://code.claude.com/docs/en/plugins-reference)). Rules must be copied manually (see below).

#### Manual Rules Copy (Required after Plugin Install)

```bash
git clone https://github.com/affaan-m/ECC.git
mkdir -p ~/.claude/rules/ecc
cp -r ECC/rules/common ~/.claude/rules/ecc/       # always

# Pick your language-specific rules:
cp -r ECC/rules/typescript ~/.claude/rules/ecc/   # TypeScript/JavaScript
cp -r ECC/rules/python ~/.claude/rules/ecc/       # Python
cp -r ECC/rules/golang ~/.claude/rules/ecc/       # Go
cp -r ECC/rules/swift ~/.claude/rules/ecc/        # Swift
cp -r ECC/rules/php ~/.claude/rules/ecc/          # PHP
cp -r ECC/rules/arkts ~/.claude/rules/ecc/        # HarmonyOS / ArkTS
```

---

### Option 2: Manual Installation

For maximum control over what gets installed:

```bash
# 1. Clone the repo
git clone https://github.com/affaan-m/ECC.git
cd ECC

# 2. Copy agents
cp agents/*.md ~/.claude/agents/

# 3. Copy rules (common + language-specific)
mkdir -p ~/.claude/rules/ecc
cp -r rules/common ~/.claude/rules/ecc/
cp -r rules/typescript ~/.claude/rules/ecc/   # pick your stack

# 4. Copy skills (primary workflow surface)
mkdir -p ~/.claude/skills
cp -r skills/search-first ~/.claude/skills/
# Copy additional skills as needed
# Do NOT nest manual installs under ~/.claude/skills/ecc/
# Claude Code only loads skills from direct children of ~/.claude/skills/

# 5. Optional: copy maintained slash commands
mkdir -p ~/.claude/commands
cp commands/*.md ~/.claude/commands/
```

#### Install Hooks

Do NOT copy raw `hooks/hooks.json` into `~/.claude/settings.json`. Use the installer:

```bashflake
# macOS / Linux
bash ./install.sh --target claude --modules hooks-runtime

# Windows PowerShell
pwsh -File .\install.ps1 --target claude --modules hooks-runtime
```

This writes resolved hooks to `~/.claude/hooks/hooks.json` while leaving `~/.claude/settings.json` untouched.

---

### Option 3: npm Installation

Install via npm for Node.js-based projects or CI pipelines:

```bash
# Install the ECC npm package
npm install ecc-universal

# Or with your preferred package manager:
pnpm add ecc-universal
yarn add ecc-universal
bun add ecc-universal
```

Update your `package.json` to use ECC scripts, or call ECC tools programmatically.

---

### Option 4: Selective Install

For granular, per-project or per-component installation:

```bash
# 1. Install the ECC Tools CLI
npm install -g ecc-universal

# 2. Consult available components
npx ecc consult

# 3. Install selected components
npx ecc install --target claude --profile full
```

---

## Three-Level Configuration Hierarchy

ECC config lives at three levels, from most global to most specific:

```
~/.claude/                   ← Global ECC (user-wide, not committed)
  rules/ecc/                 ← Auto-enforced coding standards
  skills/                    ← Domain skills
  agents/                    ← Agent definitions

.claude/                     ← Project-level (checked into repo)
  settings.json              ← Project permissions & hooks
  settings.local.json        ← Local overrides (not committed)
  hooks/hooks.json           ← Project-specific hooks
  memory.md                  ← Persistent project context

CLAUDE.md                    ← Session briefing (root of repo)
                              Defines project context, architecture,
                              commands, and workflow for each session
```

### Key Behaviors

| Level | Scope | Committed? |
|---|---|---|
| `~/.claude/` | User-wide, applies to ALL projects | No — user-managed |
| `.claude/` | Project-specific | Yes (except `.claude/settings.local.json`) |
| `CLAUDE.md` | Project session briefing | Yes |

---

## Full Harness Component Tree

```
ecc-universal/
├── agents/                  # 67 specialized subagents
├── skills/                  # 271 workflow definitions
├── commands/                # 92 maintained slash entries
├── legacy-command-shims/    # 72 retired shims (opt-in)
├── rules/                   # 34 always-follow guidelines
├── hooks/                   # 22 global lifecycle hooks
├── scripts/                 # Cross-platform Node.js utilities
├── contexts/                # Dynamic system prompt injection
├── examples/                # Reference configurations
├── mcp-configs/             # MCP server definitions
├── tests/                   # Test suite
├── ecc_dashboard.py         # Tkinter desktop GUI
└── assets/                  # Dashboard assets
```

---

## Agents

ECC ships **67 specialized subagents** for delegation across coding, testing, architecture, and DevOps tasks.

### Key Agents

| Agent | Purpose |
|---|---|
| **planner** | Feature implementation planning |
| **architect** | System design and technical decisions |
| **code-reviewer** | Quality, security, and maintainability review |
| **security-reviewer** | OWASP Top 10 vulnerability analysis |
| **tdd-guide** | Test-driven development enforcement |
| **build-error-resolver** | TypeScript, ESLint, and build failure resolution |
| **e2e-runner** | Playwright E2E testing |
| **refactor-cleaner** | Dead code removal and consolidation |
| **doc-updater** | Documentation sync and codemap generation |
| **performance-optimizer** | Bundle, query, and algorithmic optimization |
| **typescript-reviewer** | TypeScript-specific patterns and type safety |
| **python-reviewer** | Python PEP 8, type hints, and security |
| **go-reviewer** | Idiomatic Go, concurrency, and error handling |
| **rust-reviewer** | Ownership, lifetimes, and unsafe usage |
| **java-reviewer** | Spring Boot / Quarkus specific review |
| **cpp-reviewer** | Memory safety, modern C++ idioms |
| **fsharp-reviewer** | Functional idioms and performance |
| **harmonyos-app-resolver** | HarmonyOS / ArkTS development |
| **mle-reviewer** | ML pipeline, training, serving, and monitoring |
| **database-reviewer** | PostgreSQL, Supabase, schema, and queries |
| **loop-operator** | Autonomous loop execution and monitoring |
| **harness-optimizer** | Harness config tuning for reliability & cost |

### Using an Agent

Agents run automatically based on task context, or you can invoke them directly:

```markdown
Use **security-reviewer** agent for:
1. AuthN/AuthZ code paths
2. Database query strings
3. Unsanitized user input handling
4. File system access
```

---

## Skills

ECC provides **271 skills** as the primary workflow surface. Each skill is a markdown file with YAML frontmatter, residing in `~/.claude/skills/<skill-name>/SKILL.md`.

### Featured Skills

| Skill | Description |
|---|---|
| `coding-standards` | Language best practices and conventions |
| `backend-patterns` | API design, database, and caching patterns |
| `frontend-patterns` | React, Next.js, and Vite patterns |
| `frontend-slides` | HTML slide decks and PPTX-to-web presentations |
| `content-engine` | Multi-platform social content and repurposing |
| `market-research` | Source-attributed market and investor research |
| `investor-materials` | Pitch decks, memos, and financial models |
| `investor-outreach` | Fundraising outreach and personalized follow-up |
| `tdd-workflow` | Test-driven development methodology |
| `security-review` | Comprehensive security checklist |
| `verification-loop` | Continuous verification (build, test, lint, typecheck) |
| `eval-harness` | Eval-driven development workflow |
| `e2e-testing` | Playwright E2E patterns and Page Object Model |
| `deep-research` | Multi-source research with synthesis |
| `api-design` | REST API design, pagination, error responses |
| `continuous-learning-v2` | Instinct-based learning with confidence scoring |
| `cost-aware-llm-pipeline` | LLM cost optimization and model routing |

### Invoking a Skill

```bash
# In Claude Code:
/ecc:tdd-workflow
/ecc:security-review
/ecc:verification-loop
```

---

## Commands

ECC maintains **92 slash commands** for direct invocation:

| Command | Description |
|---|---|
| `/ecc:plan` | Create implementation plan |
| `/code-review` | Review code changes |
| `/build-fix` | Fix build / lint / type errors |
| `/refactor-clean` | Remove dead code and simplify |
| `/update-docs` | Update documentation |
| `/test-coverage` | Analyze test coverage |
| `/go-review` | Go code review |
| `/go-test` | Go TDD workflow |
| `/python-review` | Python-specific review |
| `/security-scan` | Run AgentShield security audit |
| `/multi-plan` | Multi-model collaborative planning |
| `/multi-execute` | Multi-model orchestrated workflows |
| `/setup-pm` | Configure package manager |
| `/sessions` | Session history management |
| `/harness-audit` | Audit harness reliability and risk posture |
| `/loop-start` | Start controlled agent loop execution |
| `/instinct-status` | View learned instincts |
| `/evolve` | Cluster instincts into skills |
| `/check-existing-rules` | Audit rules for quality |

Run `/plugin list ecc@ecc` for the full command list.

---

## Rules

Rules are **always-follow guidelines** organized into `common/` (universal) and language-specific directories:

```
rules/
  common/          # 9 always-apply rule files
  typescript/      # TypeScript / React / Vite
  python/          # Python
  golang/          # Go
  swift/           # Swift
  php/             # PHP
  arkts/           # HarmonyOS / ArkTS
```

### Common Rules (Applied to every project)

| File | What it enforces |
|---|---|
| `coding-style.md` | Immutability, KISS/DRY/YAGNI, files <800 lines |
| `testing.md` | TDD mandatory, 80% coverage |
| `security.md` | No hardcoded secrets, parameterized queries |
| `git-workflow.md` | Conventional commit format |
| `performance.md` | Sonnet default model, MAX_THINKING_TOKENS=10000 |
| `code-review.md` | Review after every write, severity levels |
| `agents.md` | When to delegate, parallel execution |
| `patterns.md` | Skeleton projects, API response format |
| `hooks.md` | Hook types, TodoWrite best practices |

### Language-Specific Extensions

| Directory | Covers |
|---|---|
| `web/` | Frontend: React, Vite, Next.js, CSS tokens, compositor-only animation |
| `typescript/` | TS naming, async correctness, Node security |
| `python/` | PEP 8, type hints, Django/Flask patterns |
| `golang/` | Go idioms, testing, concurrency |
| `swift/` | Swift actors, protocol DI, SwiftUI |
| `php/` | PSR-12, Laravel, security |
| `csharp/` | .NET, async, nullable |
| `java/` | Spring Boot, Quarkus, JPA |
| `react/` | React hooks, JSX, state management |

---

## Hooks — Execution Flow Deep Dive

Hooks are **trigger-based automations** that intercept tool lifecycle events and run scripts before or after the tool executes. ECC ships **22 global hooks** across 7 lifecycle events, plus any project-local hooks.

### The Hook Lifecycle — What Triggers What

When you say something like *"write a React component"* in Claude Code, the conversation, file read, and tool calls follow this flow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SESSION START                                                          │
│  ─────────────────                                                        │
│  1. Claude Code starts a new session                                     │
│  2. → SessionStart hook fires:                                          │
│       • Injects ~/.claude/rules/ecc/ into system prompt                  │
│       • Loads CLAUDE.md (project context)                                 │
│       • Loads .claude/memory.md (persistent project state)               │
│       • Loads Hook Runtime Controls (ECC_HOOK_PROFILE, etc.)             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  USER REQUEST                                                           │
│  ─────────────                                                          │
│  3. You type: "Add a login form to the frontend"                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  CLAUDE DECIDES TO USE A TOOL                                           │
│  ─────────────────────────────                                            │
│  4. Claude decides: "I need to Read the existing auth code first"       │
│  5. → PreToolUse hook fires BEFORE the Read executes:                   │
│       • Matcher checks: "Is this a Read? Yes."                          │
│       • Hook script runs: Any custom pre-read validation?                │
│       • If hook exits with code 2: Read is BLOCKED, error shown to user │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ (if not blocked)
┌─────────────────────────────────────────────────────────────────────────┐
│  TOOL EXECUTES                                                          │
│  ─────────────                                                          │
│  6. Read("src/services/auth.ts") executes normally                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  POST-TOOL EXECUTION                                                    │
│  ─────────────────────                                                    │
│  7. → PostToolUse hook fires AFTER Read succeeds:                      │
│       • Matcher checks: "Is this a Write or Edit? No — Read."           │
│       • No matching post-read hooks registered → nothing happens         │
│                                                                          │
│  If it WERE a Write/Edit:                                                │
│       • Auto-format hook: runs Prettier on the modified file             │
│       • Type-check hook: runs tsc --noEmit                               │
│       • Console.log guard: warns if console.log left in the code         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  CONTEXT COMPACTION (if needed)                                          │
│  ──────────────────────────────                                          │
│  8. If context window is ~95% full → PreCompact hook fires:            │
│       • Suggests /compact at logical breakpoints                         │
│       • Saves session state before compaction                            │
│       • Alerts user about what will be lost / summarized               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  SESSION END / STOP                                                     │
│  ────────────────                                                       │
│  9. User exits Claude or sends /exit                                   │
│  10. → Stop hook fires:                                                │
│       • Runs final build verification (dotnet build, npm run build)      │
│       • Runs test suite (if configured)                                 │
│       • Optionally commits changes                                        │
│                                                                          │
│  11. → SessionEnd hook fires:                                          │
│       • Saves session summary to ~/.claude/session-data/                 │
│       • Updates learned instincts (continuous-learning-v2)                │
│       • Prunes old sessions ( respects ECC_SESSION_RETENTION_DAYS )      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Where Hooks Are Stored

| Source | File | Scope | Priority |
|---|---|---|---|
| ECC Plugin (auto) | `~/.claude/hooks/hooks.json` | Global | Highest — loaded by plugin system |
| Project-level | `.claude/settings.json` `hooks` field | Project | User-managed — **avoid duplicating plugin hooks** |
| Manual install | `~/.claude/hooks/hooks.json` (via installer) | Global | Same as plugin — DO NOT stack with plugin |

> ⚠️ **CRITICAL RULE:** If you installed via `/plugin install ecc@ecc`, **do NOT also copy the raw `hooks/hooks.json`** into `.claude/settings.json`. Claude Code v2.1+ auto-loads plugin hooks. Duplicating them causes "duplicate hooks file" errors. See [FAQ](#faq--troubleshooting).

### Hook Structure (What a Hook Entry Looks Like)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == 'Write'",
        "command": "node -e \"... (command to run) ...\"",
        "description": "Block writes to sensitive config files"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "tool == 'Write' || tool == 'Edit'",
        "command": "npm run prettier --write $FILE_PATH",
        "description": "Auto-format edited frontend files"
      }
    ],
    "SessionStart": [
      {
        "command": "node scripts/hooks/session-start.js",
        "description": "Load project context on session start"
      }
    ],
    "Stop": [
      {
        "command": "node scripts/hooks/stop-verify-build.js",
        "description": "Verify production build at session end"
      }
    ]
  }
}
```

### The 7 Lifecycle Events Explained

| Event | When It Fires | Typical Uses |
|---|---|---|
| **`SessionStart`** | New Claude session begins | Load rules, CLAUDE.md, memory, env vars |
| **`PreToolUse`** | Before any tool (Read, Write, Edit, Bash, etc.) | Block dangerous commands, validate file paths, secret detection |
| **`PostToolUse`** | After tool succeeds | Auto-format, type-check, lint, warn about console.log |
| **`PostToolUseFailure`** | After tool errors | Error logging, cleanup, retry suggestions |
| **`PreCompact`** | Before context is compacted/summarized | Strategic save, alert user, suggest /compact timing |
| **`Stop`** | User sends /stop or "stop" | Final build verification, test run, commit prompt |
| **`SessionEnd`** | Session fully closes | Save session summary, update instincts, prune old data |

### How Hooks Are Matched and Resolved

```
1. User action: "Write to src/App.tsx"
                                ↓
2. Build matcher object:
   {
     "tool": "Write",
     "tool_input": {
       "file_path": "src/App.tsx",
       "content": "..."
     }
   }
                                ↓["PreToolUse" event triggers]
                                ↓
3. Check each PreToolUse hook:
   a. Hook 1: matcher = "tool == 'Write'"
      → MATCH → run command → if exit 2: BLOCK the Write

   b. Hook 2: matcher = "tool == 'Bash'"
      → NO MATCH → skip

   c. Hook 3: matcher = "tool == 'Write' \|\| tool == 'Edit'"
      → MATCH → run command
```

### Hook Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success — hook passed, tool continues |
| `2` | **BLOCK** — hook failed, tool is CANCELLED, error shown to user |
| Any other | Treated as warning but tool still executes |

### Hook Runtime Guard Profiles

| Profile | Behavior | When to Use |
|---|---|---|
| **`minimal`** | No hooks-runtime at all | Low-resource environments, debugging |
| **`standard`** | Full hooks with standard warnings | ✅ **Default** — most projects |
| **`strict`** | Additional guards (e.g. tmux for dev servers) | Production, CI, multi-user |

```bash
export ECC_HOOK_PROFILE=standard   # minimal | standard | strict
```

### Project-Local vs Global Hook Merging

Hooks from **both** levels are **merged**, not overwritten:

```
~/.claude → Global hooks (from ECC plugin)
      +
.claude/  → Project-local hooks (from .claude/settings.json)
      ↓
Merged hook list for THIS project only
```

**In Immersio, this means:**
- **Global** (from plugin): 20+ hooks for formatting, type-checking, context injection, session persistence
- **Project** (`.claude/settings.json`): 2 security hooks — sensitive file write guard + dangerous command guard
- **Combined**: 22+ hooks active for Immersio sessions

### Immersio's Active Hook Examples

| Hook (from) | Matcher | What It Does |
|---|---|---|
| **Write guard** (`.claude/settings.json`) | `tool == 'Write'` | Blocks writes to `appsettings.json`, `.env`, `secrets.*` |
| **Bash guard** (`.claude/settings.json`) | `tool == 'Bash'` | Blocks `git push --force`, `rm -rf /`, `DROP TABLE` |
| **Auto-format** (plugin) | `tool == 'Write' \|\| 'Edit'` | Runs Prettier on `.ts`/`.tsx` files |
| **Type check** (plugin) | `tool == 'Write' \|\| 'Edit'` | Runs `tsc --noEmit --incremental` |
| **Context injection** (plugin) | `SessionStart` | Loads `CLAUDE.md`, rules, memory |
| **Build verification** (plugin) | `Stop` | Runs `dotnet build` + `npm run build` |

### Disabling Hooks Temporarily

```bash
# Disable specific hooks by their ID
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"

# Or set profile to minimal (disables all runtime hooks)
export ECC_HOOK_PROFILE=minimal
```

### DRY Adapter Pattern (Cursor / OpenCode)

Cursor has **15 hook events** vs Claude Code's **8**. ECC uses a single adapter layer instead of duplicating hook scripts:

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Cursor stdin   │         │  adapter.js  │         │  Shared scripts │
│  (15 events)    │  ───►   │              │  ───►  │  (scripts/hooks/│
│                 │         │              │         │   same as Claude)│
└─────────────────┘         └──────────────┘         └─────────────────┘
```

This means: **one set of hook scripts**, **multiple tool targets**. No code duplication.

---

## Cross-Platform & Cross-Harness Support

ECC works across multiple AI coding tools with feature parity:

| Harness | Agents | Commands | Skills | Hooks | MCPs |
|---|---|---|---|---|---|
| **Claude Code** | 67 | 92 | 271 | 8 events, 20+ scripts | 14 |
| **Cursor** | Shared via AGENTS.md | Shared | Shared | 15 events, DRY adapter | Shared |
| **Codex** | Shared | 5 prompts / instruction | 10 native | None yet | 7 (merged) |
| **OpenCode** | 12 | 35 | 37 | 11 events, plugin hooks | 14 |
| **GitHub Copilot** | — | 5 prompts | Via instructions | None | — |
| **Zed** | Flattened | Flattened | Flattened | None | — |
| **Antigravity** | `.agent/` | `.agent/` | `.agent/` | Adapters | — |
| **Qwen CLI** | 12 | Shared | Shared | Adapters | — |
| **JoyCode / CodeBuddy** | Project-local | Selective | Selective | Adapters | — |

### Per-Tool Quick Start

#### Cursor
```bash
./install.sh --target cursor typescript
./install.sh --target cursor python golang swift php
```

#### Codex
```bash
npm install && bash scripts/sync-ecc-to-codex.sh
codex
```

#### OpenCode
```bash
npm install -g opencode
cd ECC && opencode
```

---

## AgentShield — Security Auditor

Built at the Claude Code Hackathon (Cerebral Valley x Anthropic, Feb 2026). 1282 tests, 98% coverage, 102 static analysis rules.

### Quick Scan

```bash
# Quick scan (no install needed)
npx ecc-agentshield scan

# Auto-fix safe issues
npx ecc-agentshield scan --fix

# Deep analysis with three Opus 4.6 agents
npx ecc-agentshield scan --opus --stream

# Generate secure config from scratch
npx ecc-agentshield init
```

### What It Scans

- **Secrets detection** — 14 patterns (API keys, tokens, passwords)
- **Permission auditing** — Missing permissions, overly broad allows
- **Hook injection analysis** — Dangerous hooks and command injection
- **MCP server risk** — Unvetted or overly permissive servers
- **Agent config review** — Unsafe tool selections and model routing

### The `--opus` Flag

Runs three Claude Opus 4.6 agents in a red-team/blue-team/auditor pipeline:
- **Attacker** finds exploit chains
- **Defender** evaluates protections
- **Auditor** synthesizes both into a prioritized risk assessment

Use `/security-scan` in Claude Code, or add the [GitHub Action](https://github.com/affaan-m/agentshield) to CI.

---

## Continuous Learning v2

The instinct-based learning system automatically learns your patterns and improves over time:

```bash
/instinct-status        # Show learned instincts with confidence
/instinct-import <file>  # Import instincts from others
/instinct-export         # Export your instincts for sharing
/evolve                  # Cluster related instincts into skills
/promote                 # Promote project instincts to global scope
/prune                   # Delete expired instincts (30d TTL)
```

See `skills/continuous-learning-v2/SKILL.md` for full documentation.

---

## Token Optimization

Claude Code usage can be expensive. These settings significantly reduce costs without sacrificing quality.

### Recommended `~/.claude/settings.json`

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

| Setting | Default | Recommended | Impact |
|---|---|---|---|
| `model` | opus | **sonnet** | ~60% cost reduction |
| `MAX_THINKING_TOKENS` | 31,999 | **10,000** | ~70% reduction in hidden thinking cost |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50** | Compacts earlier — better long-session quality |
| `ECC_CONTEXT_MONITOR_COST_WARNINGS` | on | **off** (subscription users) | Suppress cost estimates, keep scope/loop warnings |

### Daily Workflow Commands

| Command | When to Use |
|---|---|
| `/model sonnet` | Default for most tasks |
| `/model haiku` | Lightweight agents, pair programming |
| `/model opus` | Complex architecture, deep debugging |
| `/clear` | Between unrelated tasks |
| `/compact` | At logical task breakpoints |
| `/cost` | Monitor token spending |

---

## Dashboard GUI

ECC includes a Tkinter desktop dashboard for managing the harness:

```bash
# Run the dashboard
ecc_dashboard.py

# Or via npm
npm run dashboard
```

Features:
- Dark / light theme
- Font customization
- Harness component explorer
- Agent and skill catalog
- Hook status and controls

---

## Package Manager Detection

ECC auto-detects your preferred package manager:

```bash
# Interactive setup
/setup-pm

# Manual detection
node scripts/setup-package-manager.js --detect
```

Detection priority:
1. `CLAUDE_PACKAGE_MANAGER` environment variable
2. `package.json` `packageManager` field
3. Lock files (`pnpm-lock.yaml`, `yarn.lock`, etc.)
4. Fallback to npm

---

## Hook Runtime Controls

Fine-tune hook behavior without reinstalling:

```bash
# --- Bash ---
export ECC_HOOK_PROFILE=standard          # minimal | standard | strict
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
export ECC_SESSION_START_MAX_CHARS=4000
export ECC_SESSION_START_CONTEXT=off
export ECC_SESSION_RETENTION_DAYS=14
export ECC_CONTEXT_MONITOR_COST_WARNINGS=off

# --- Windows PowerShell ---
[Environment]::SetEnvironmentVariable('ECC_CONTEXT_MONITOR_COST_WARNINGS', 'off', 'User')
[Environment]::SetEnvironmentVariable('ECC_SESSION_RETENTION_DAYS', '14', 'User')
```

---

## Agent Data Home (Multi-Harness Isolation)

When using ECC across multiple tools (Claude Code + Cursor), set a separate data root for each to prevent collision:

```bash
# Cursor-only boundary (Claude Code keeps ~/.claude default)
export ECC_AGENT_DATA_HOME="$HOME/.cursor/ecc"
```

Data paths:
- `$ECC_AGENT_DATA_HOME/session-data/` — session summaries
- `$ECC_AGENT_DATA_HOME/skills/learned/` — learned skills
- `$ECC_AGENT_DATA_HOME/session-aliases.json` — session aliases
- `$ECC_AGENT_DATA_HOME/metrics/` — cost and activity metrics

---

## Reset / Uninstall

### Reset (Single Command)

```bash
# Preview changes first
node scripts/uninstall.js --dry-run

# Execute
node scripts/uninstall.js
```

### Manual Uninstall Order

1. Remove the plugin: `/plugin uninstall ecc@ecc`
2. Run the uninstall script: `node scripts/uninstall.js`
3. Manually delete rule folders from `~/.claude/rules/ecc/`
4. Reinstall using **only one** method (plugin, manual, or npm)

---

## FAQ & Troubleshooting

### How do I check what's installed?

```bash
/plugin list ecc@ecc              # Plugin components
node scripts/harness-audit.js     # Full harness health check
```

### “Duplicate hooks file” error

Claude Code v2.1+ auto-loads `hooks/hooks.json` from any installed plugin. **Do NOT add a `"hooks"` field to `.claude-plugin/plugin.json`.** This is enforced by a regression test. See [#29](https://github.com/affaan-m/ECC/issues/29).

### My hooks aren't working

- Check `ECC_HOOK_PROFILE` — `minimal` disables the hooks-runtime
- Check `ECC_DISABLED_HOOKS` — specific hooks may be disabled
- Ensure `~/.claude/hooks/hooks.json` exists (written by the installer, NOT raw copy)
- Rules must be manually copied to `~/.claude/rules/ecc/` (plugin limitation)

### Context window shrinking

- Disable unused MCPs with `/mcp`
- Keep under 10 MCPs enabled
- Keep under 80 tools active
- Lower `ECC_SESSION_START_MAX_CHARS` or set `ECC_SESSION_START_CONTEXT=off`

### Can I use only some components?

Yes — each is fully independent:
```bash
cp agents/*.md ~/.claude/agents/
mkdir -p ~/.claude/rules/ecc/
cp -r rules/common ~/.claude/rules/ecc/
```

### Does this work with Cursor / OpenCode / Codex?

Yes — ECC has first-class support for Cursor, Codex (macOS + CLI), OpenCode (plugin), GitHub Copilot (instruction layer), Zed, Antigravity, Qwen CLI, and JoyCode. See [Cross-Platform & Cross-Harness Support](#cross-platform--cross-harness-support).

### How do I contribute?

1. Fork the repo
2. Create a skill: `skills/your-skill-name/SKILL.md`
3. Create an agent: `agents/your-agent.md`
4. Submit a PR

See [CONTRIBUTING.md](https://github.com/affaan-m/ECC/blob/main/CONTRIBUTING.md).

---

## Security

- **Official sources only:** Install only from `affaan-m/ECC`, `ecc@ecc`, `ecc-universal` npm, or [ecc.tools](https://ecc.tools). Third-party mirrors are unreviewed.
- **Report vulnerabilities:** Use [GitHub Private Vulnerability Reporting](https://github.com/affaan-m/ECC/security).
- **Built-in guardrails:** GateGuard gates destructive commands; the supply-chain IOC scanner runs in CI; [AgentShield](#agentshield--security-auditor) audits agent/hook/MCP/skill surfaces.
- **Deep dive:** See [the-security-guide.md](https://github.com/affaan-m/ECC/blob/main/the-security-guide.md).

---

## Local Immersio Installation Status

As of `2026-06-27` (following a complete `~/.claude` directory restore), the Immersio project has the following ECC harness components installed and active:

### Global Configuration (`~/.claude/`)

| Component | Status | Path |
|---|---|---|
| Rules — common | ✅ Installed | `~/.claude/rules/ecc/common/` (10 files) |
| Rules — web | ✅ Installed | `~/.claude/rules/ecc/web/` (7 files) |
| Rules — csharp | ✅ Installed | `~/.claude/rules/ecc/csharp/` |
| Rules — java | ✅ Installed | `~/.claude/rules/ecc/java/` |
| Rules — react | ✅ Installed | `~/.claude/rules/ecc/react/` |
| Rules — typescript | ✅ Installed | `~/.claude/rules/ecc/typescript/` |
| Skills | ✅ Installed (via plugin) | `~/.claude/skills/ecc/` (118+ skills) |
| Agents | ✅ Installed (plugin-loaded) | `~/.claude/agents/` |
| MCP — Firecrawl | ⚠️ Configuration Active (No API Key) | `~/.claude/.mcp.json` |
| Plugin | ✅ Active | `ecc@ecc` |
| Hooks — global | ✅ Installed & Active | `~/.claude/hooks/hooks.json` (147 ops) |

### Project Configuration (`.claude/` — checked into repo)

| Component | Status | File |
|---|---|---|
| Permissions allowlist | ✅ 26 entries | `.claude/settings.json` |
| Security hooks — Write guard | ✅ Blocks secrets | `.claude/settings.json` |
| Security hooks — Bash guard | ✅ Blocks dangerous cmds | `.claude/settings.json` |
| Local overrides (API keys) | ✅ Not committed | `.claude/settings.local.json` |
| Memory | ✅ Active | `.claude/memory.md` |

### Session Configuration (`CLAUDE.md`)

| Component | Status |
|---|---|
| Project context | ✅ Present (backend + frontend URLs, commands) |
| Harness config hierarchy | ✅ Documented |
| Auto-enforced rules | ✅ Referenced |
| Active hooks | ✅ Documented |
| Development workflow | ✅ Mandatory pipeline |
| Model routing | ✅ Sonnet default, Opus for deep reasoning |

### Immersio Tech Stack Mapping

| Layer | Technology | ECC Rules Active |
|---|---|---|
| Backend | ASP.NET Core 9, C#, PostgreSQL | `common/` + `csharp/` |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 | `common/` + `web/` + `typescript/` + `react/` |
| ORM | Entity Framework Core | `common/` + `csharp/` |
| Auth | JWT + Google OAuth | `common/` + `security.md` |
| UI | Radix UI, Motion (Framer), Recharts | `common/` + `web/` + `react/` |

### Known Active Agents & Skills

| Resource | Available In Immersio Session |
|---|---|
| planner | ✅ (via `/ecc:plan`) |
| architect | ✅ (via `/ecc:plan` + architect) |
| code-reviewer | ✅ (via `.claude/rules/ecc/common/code-review.md`) |
| security-reviewer | ✅ (via `.claude/rules/ecc/common/security.md`) |
| tdd-guide | ✅ (via `/ecc:tdd-workflow`) |
| typescript-reviewer | ✅ (via `/typescript-reviewer` agent) |
| react-reviewer | ✅ (via `.claude/rules/ecc/react/`) |
| build-error-resolver | ✅ (via `/build-fix`) |
| e2e-runner | ✅ (via `e2e-testing` skill) |
| agent-evaluator | ✅ (via plugin) |
| database-reviewer | ✅ (via plugin) |
| performance-optimizer | ✅ (via plugin) |
| refactor-cleaner | ✅ (via plugin) |
| doc-updater | ✅ (via `/update-docs`) |

---

## Summary

ECC transforms Claude Code from a simple chat interface into a **full production-grade harness** with:

1. **67 agents** for every aspect of software development
2. **271 skills** covering TDD, security review, E2E testing, API design, and more
3. **92 commands** for instant workflow activation
4. **34 rules** enforcing code quality, security, testing, and performance
5. **20+ hooks** for automated guards, formatting, and session lifecycle
6. **14+ MCP servers** for external tool integration
7. **Cross-tool support** for Cursor, Codex, OpenCode, Copilot, Zed, and more
8. **Built-in security** with AgentShield
9. **Continuous learning** with instinct-based pattern extraction
10. **Token optimization** with model routing and strategic compaction

**Next steps for contributors:**
- Run `/harness-audit` or `node scripts/harness-audit.js` to score your installation
- Read [The Shorthand Guide](https://x.com/affaan/status/2012378465664745795)
- Read [The Longform Guide](https://x.com/affaan/status/2014040193557471352) for advanced usage
- Explore the codebase at [github.com/affaan-m/ECC](https://github.com/affaan-m/ECC)

---

*MIT License — Use freely, modify as needed, contribute back if you can.*
