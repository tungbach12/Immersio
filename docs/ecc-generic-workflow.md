---
name: ecc-generic-workflow
description: Generic workflow template for project implementation pipelines using the ECC harness
metadata:
  type: reference
---

# ECC Generic Harness Workflow

A project-agnostic CLAUDE.md template using the [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) harness.

> Based on deep research of ECC architecture, Claude Code internals, and multi-agent workflow best practices (June 2026).

---

## How to Use This Template

1. Copy this file to a new project as `CLAUDE.md`
2. Fill in the `## Project Overview` section
3. Update `## Stack & Commands` with your actual build/test/run commands
4. Adjust the Permissions Allowlist to match your toolchain
5. Run `/run-audit` after setup to verify harness health

---

## Project Overview

<!-- Required: fill these in -->
**Name:**
**Description:** What the project does in one sentence.
**Stack:** (e.g. React + FastAPI + PostgreSQL)

| Part | Path | Tech | URL |
|---|---|---|---|
| Backend | `src/` | — | `http://localhost:XXXX` |
| Frontend | `web/` | — | `http://localhost:XXXX` |

---

## Stack & Commands

```bash
# Backend
<build command>
<test command>
<run command>

# Frontend
<install command>
<dev command>
<build command>
<lint command>
```

**Config files** (copy `.example` → actual, never commit):
| File | Purpose |
|---|---|
| `.env` | Environment variables |

---

## Harness Configuration

This project uses the [ECC harness](https://github.com/affaan-m/everything-claude-code). The harness extends Claude Code's four native extensibility mechanisms:

```
~/.claude/                   ← Global ECC harness (rules, skills, agents)
  rules/common/              ← Auto-enforced coding standards
  rules/ecc/web/             ← Web/frontend extensions
  skills/                    ← Slash command reference modules
  agents/                    ← Specialized subagents

.claude/                     ← Project-level config (checked into repo)
  settings.json              ← Bash permissions allowlist + PreToolUse hooks
  settings.local.json        ← Local-only overrides (API keys, etc.)
  memory.md                  ← Persistent project context
  commands/run-audit.md      ← /run-audit slash command

CLAUDE.md                    ← Session briefing (this file)
```

### How the Harness Works

Claude Code separates **model reasoning** from **harness execution**: the model decides what to do, the harness executes it. ECC layers on top with its own hook/skill/agent configuration.

**Key architectural facts:**
- Claude Code has **27 hook event types** (5 safety, 22 lifecycle/orchestration)
- ECC hooks map onto this pipeline via `.claude/settings.json`
- **CLAUDE.md constraints are advisory** — enforced by model instruction-following, not hard limits. `--allowedTools` in settings.json is the only hard enforcement boundary
- A **5-layer context compaction pipeline** runs before every model call (budget reduction → snip → microcompact → context collapse → auto-compact)
- Subagents return only **summary text** to the parent, not full conversation history — this controls context bloat

### Auto-Enforced Rules

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

**PreToolUse: Bash security guard**
- Blocks: `git push --force`, `git reset --hard`, `rm -rf /`, `DROP TABLE`, `DELETE FROM … WHERE 1`
- Warns: commands touching sensitive config or `.env`

**PreToolUse: Sensitive file write guard**
- Warns before writing to config files, `.env`, or `secrets.*`

### Permissions Allowlist

Pre-approved in `.claude/settings.json` (no prompt required):
```
# Adjust to your toolchain:
git status/diff/log/add/commit/checkout/branch/fetch/pull
ls, find, Read(**)
# npm run lint/build/dev/test
# python -m pytest / pip install
# dotnet build/run/test
```

---

## Development Workflow

### ⚠️ STRICT Enforcement

**Pipeline is MANDATORY for all non-trivial tasks.** Do not skip steps.

### Pipeline by Task Type

| Task Type | Required Steps |
|---|---|
| Bug fix (code logic) | Plan → TDD → Verify → Review → Commit |
| Bug fix (CSS/visual) | Plan → Implement → Visual Verify → Review → Commit |
| New feature (code) | Research → Plan → TDD → Implement → Verify → Review → Commit |
| New feature (frontend) | Research → Plan → Implement → Visual Verify → Review → Commit |
| Auth/security change | All steps + security-reviewer agent |
| Database migration | Plan → TDD → Verify → Review → Commit |
| Config/env change | Plan → Implement → Verify → Commit |
| Docs/typo | User confirm → Implement → Commit |

**Allowed exceptions (skip pipeline):**
1. User explicitly says "just a typo" or "docs only"
2. Task truly changes only 1 line

**❌ NOT exceptions:**
- Fix spacing/margin/padding (must plan + visual verify)
- Fix color, font, layout (must plan + screenshot before/after)
- Any `.tsx` / `.ts` file change (must plan + TDD or visual verify)
- Config or `.env` changes (must plan)

### Step 0 — Research First (mandatory)

**⚠️ STOP POINT — Do not proceed to step 1 until complete.**

| Priority | Action | Tool | When |
|---|---|---|---|
| 1 | GitHub code search | `gh search repos` / `gh search code` | Always start here |
| 2 | Library/framework docs | `/ecc:documentation-lookup` or vendor docs | Confirm API behavior |
| 3 | Broader web research | WebSearch, Exa | When GitHub + docs aren't enough |
| 4 | Package registries | npm, PyPI, crates.io | Before hand-rolling utility code |
| 5 | Adopt if 80%+ match | Fork, port, or wrap existing impl | Prefer adopt over write new |

**Adopt mindset:** If an open-source solution meets 80%+ of requirement → **fork/port/wrap** instead of writing new. Only write net-new code when no suitable alternative exists.

**SKIP when:** User has provided enough context, task changes only 1 line, or task is purely config/docs.

### Step 1 — Plan

**⚠️ STOP POINT — Do not proceed without a clear plan.**

| Complexity | Tool | Example |
|---|---|---|
| Simple (1 file, <50 lines) | `EnterPlanMode` | Fix spacing, change env var, fix typo |
| Medium (2–5 files) | Spawn **planner** agent or `/ecc:plan` | Feature component, small refactor |
| Complex (multi-service) | `/ecc:plan-orchestrate` | Multi-file refactor needing parallel agents |
| Large feature + PR | `/ecc:prp-plan` | Feature needing planning → PRD → implement → PR |

**Do NOT call `/ecc:plan` or `/ecc:prp-plan` for simple tasks** — violates YAGNI.

**Plan output requires:**
- Describe specific changes (file, line, current value → new)
- Confirm with user before implementing

### Step 2 — Implement

#### Code logic changes:
**Must TDD:**
- Write failing tests first (RED)
- Write minimal implementation to pass (GREEN)
- Refactor for quality (IMPROVE)
- Verify coverage ≥ 80%
- Use `/ecc:tdd-workflow` for step-by-step guidance

#### Visual/CSS changes:
**Skip TDD, use Visual Verify instead:**
- Implement change
- Screenshot BEFORE (if possible)
- Screenshot AFTER
- Compare and confirm with user

### ⚠️ Self-Check Before Every Edit (MANDATORY)

| Task type | Required checks |
|---|---|
| Code logic | ✅ Researched? ✅ Have a plan? ✅ Tests written first? |
| Visual/CSS | ✅ Researched? ✅ Have a plan? ✅ Screenshot before? |
| Config/env | ✅ Researched? ✅ Have a plan? |
| Docs/typo | ✅ Confirmed with user? |

**If ANY answer is "NO" → STOP, go back to that step.**

### Step 3 — Verify (before Review)

**⚠️ STOP POINT — Do not commit if verify fails.**

| Task type | How to verify |
|---|---|
| Backend code | Build + tests pass |
| Frontend code | Build pass + lint pass |
| Visual/CSS | Screenshot before/after + confirm with user |
| Config/env | App starts and runs OK with new config |
| API endpoint | Test with curl, Postman, or equivalent |

### Step 4 — Review

- After any code write: spawn **code-reviewer** agent
- After auth/payment/input handling: spawn **security-reviewer** agent
- If build fails: spawn **build-error-resolver** agent
- Use `/ecc:verification-loop` for multi-step validation after changes

**Parallel agents:** When reviews are independent (code + security), spawn in parallel.

### Step 5 — Commit

Ultra-granular commits function as **save points** — commit early and often, even more than in manual coding. This enables easy rollback from AI missteps.

```
<type>: <short description>

<optional body — explain the why, not the what>
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### Step 6 — Pre-PR Checks

**⚠️ STOP POINT — Do not request review if checks haven't passed.**
- Verify CI/CD checks pass
- Resolve merge conflicts (if any)
- Ensure branch is up to date with target branch
- Only request review after all checks pass

### Step 7 — PR (when needed)

- `git diff [base-branch]...HEAD` to see all changes
- Draft PR title (<70 chars) + detailed summary
- Include test plan with TODOs
- Push with `-u` flag if new branch

---

## Multi-Agent Patterns

### Team Composition

**Start small.** A 3-agent system (orchestrator, worker, reviewer) is often sufficient for most tasks. If your orchestrator manages more than 6–8 worker types, the workflow is likely poorly decomposed.

| Pattern | When to Use | Token Cost |
|---|---|---|
| Single agent | Focused tasks, <3 files | 1x baseline |
| 2 agents (implement + review) | Standard features | ~2x baseline |
| 3 agents (plan + implement + review) | Complex features | ~2.5–4x baseline |
| Parallel fan-out | Independent subtasks | Scales with agent count |

**Key rules:**
- The **orchestrator does not execute work** — it coordinates workers
- **Parallel execution** for independent tasks, **sequential** when tasks depend on each other
- Set **token limits per task** and hard workflow-level cost ceilings
- Log every dispatch, invocation, and result with a shared trace ID

### When NOT to use multi-agent

- Sub-second response times needed → single optimized agent
- Task touches only 1–2 files → single agent
- Exploratory/debugging work → single agent with thinking

---

## Model Routing

| Model | Use for | When |
|---|---|---|
| **Sonnet 4.6** | Research, Implementation, TDD, Build fix | 90% tasks — default choice |
| **Opus 4.8** | Planning, Code Review, Security Review | Deep reasoning only |

---

## Skills by Task

| Task | Skill |
|---|---|
| React components, hooks | `/ecc:react-patterns` |
| Vite config, env vars | `/ecc:vite-patterns` |
| REST API design | `/ecc:api-design`, `/ecc:backend-patterns` |
| PostgreSQL | `/ecc:postgres-patterns` |
| Database migrations | `/ecc:database-migrations` |
| TDD step-by-step | `/ecc:tdd-workflow` |
| E2E browser tests | `/ecc:e2e-testing` |
| Security audit | `/ecc:security-review` |
| Post-change verification | `/ecc:verification-loop` |
| TS/JS naming & structure | `/ecc:coding-standards` |
| Library/framework docs | `/ecc:documentation-lookup` |
| Deep research | `/ecc:deep-research` |
| Harness health check | `/run-audit` |

---

## Agents

| Agent | Trigger |
|---|---|
| `planner` | Complex features, multi-file changes |
| `code-reviewer` | After writing or modifying any code |
| `tdd-guide` | New features, bug fixes |
| `security-reviewer` | Auth, payments, DB queries, user input |
| `build-error-resolver` | Build failures |
| `react-reviewer` | Changes to `.tsx`/`.jsx` |
| `typescript-reviewer` | Changes to `.ts` |
| `python-reviewer` | Changes to `.py` |
| `e2e-runner` | Critical user flows |
| `refactor-cleaner` | Dead code removal, module extraction |
| `doc-updater` | Documentation updates |

**Spawn agents in parallel when work is independent.**

---

## Context Management

- Use `/clear` between unrelated tasks (don't carry over stale context)
- Compact at logical breakpoints: after research, after milestone, after failed approach
- **Do NOT compact** mid-implementation (loses variable names, file paths, partial state)

---

## Loop Patterns (for complex tasks)

```
Simple, focused task?
├─ Yes → Sequential Pipeline (plan → TDD → review → commit)
└─ No → Has spec/RFC + needs parallel?
        ├─ Yes → Spawn multiple agents in parallel
        └─ No → Sequential + Review loop
```

---

## Harness Health

Run `/run-audit` to score against ECC best practices.

### MCP Servers

| Server | Purpose | Config |
|---|---|---|
| Firecrawl | Web scraping, search, extraction | `~/.claude/.mcp.json` |

### Documentation

- **ECC Harness Guide**: `docs/ecc-harness-guide.md`
- **ECC Repository**: https://github.com/affaan-m/everything-claude-code
- **wshobson/agents** (37k+ stars): Multi-harness plugin marketplace pattern — demonstrates per-plugin context isolation and harness-native artifact generation

---

## Sources

Research conducted June 2026 across 15 sources:

| Source | Key Insight |
|---|---|
| [ECC GitHub](https://github.com/affaan-m/everything-claude-code) | Primary harness: rules, skills, agents, hooks architecture |
| [Addy Osmani — AI Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/) | Spec-first planning, CLAUDE.md behavioral steering, multi-model switching |
| [Agent Teams — Multi-Agent Guide](https://lushbinary.com/blog/claude-code-agent-teams-multi-agent-development-guide/) | Agent Teams shipped Feb 2026 with Opus 4.6, 2.5–4x token cost |
| [Claude Code as Autonomous Agent](https://www.sitepoint.com/claude-code-as-an-autonomous-agent-advanced-workflows-2026/) | Headless invocation flags, orchestrator/worker patterns, git checkpoint recovery |
| [wshobson/agents](https://github.com/wshobson/agents) | 84 plugins, 192 agents, 156 skills, 102 commands — multi-harness marketplace with context isolation |
| [arXiv — Claude Code Design Space](https://arxiv.org/html/2604.14228v1) | Academic taxonomy of Claude Code capabilities and constraints |
| [MindStudio — Multi-Agent Workflow](https://www.mindstudio.ai/blog/how-to-build-multi-agent-workflow) | Orchestrator/worker separation, coordination patterns, failure handling |
