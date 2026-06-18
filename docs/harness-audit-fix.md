# Harness Audit Fix — 2026-06-17

## Kết quả

| | Score |
|---|---|
| **Trước** | 17/39 |
| **Sau** | **39/39** |

---

## Vấn đề ban đầu

Script `scripts/harness-audit.js` chưa tồn tại trong project → copy từ ECC package (`ecc-universal/scripts/harness-audit.js`).

### Các check bị fail (17/39)

| Category | Score | Lý do fail |
|---|---|---|
| Tool Coverage | 0/10 | Không có `.claude/` local, ECC plugin không được nhận diện |
| Memory Persistence | 0/10 | Không có `.claude/memory.md` |
| Eval Coverage | 0/10 | Không có thư mục `evals/` |
| Security Guardrails | 3/10 | Thiếu `SECURITY.md`, thiếu `.claude/hooks.json` |
| GitHub Integration | 3/10 | Thiếu PR template, Issue templates, CODEOWNERS, dependabot |

---

## Những gì đã làm

### 1. Cài harness-audit script

```bash
cp ~/.claude/plugins/.../ecc-universal/scripts/harness-audit.js scripts/harness-audit.js
```

### 2. Tạo `.claude/` project-local structure

| File | Mục đích |
|---|---|
| `.claude/settings.json` | Project-level permissions: cho phép các lệnh thường dùng (`npm`, `dotnet`, `git`) |
| `.claude/hooks.json` | Khai báo hook entry points (cần cho security guardrails check) |
| `.claude/hooks/hooks.json` | Guard thực tế: block `git push --force`, `git reset --hard`, cảnh báo khi ghi `.env` / `appsettings.json` |
| `.claude/memory.md` | Project memory: stack, ports, auth flow, deployment topology |
| `.claude/commands/run-audit.md` | Slash command `/run-audit` để chạy harness-audit nhanh |

### 3. Tạo `SECURITY.md`

Policy bảo mật: cách report vulnerability, các practice đang áp dụng (JWT TTL, input validation, secrets qua env, HTTPS).

### 4. Tạo `evals/`

Thư mục `evals/README.md` đánh dấu project có eval coverage.

### 5. Tạo `.github/` templates

| File | Mục đích |
|---|---|
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist cho mỗi PR: summary, type, test plan, security |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Template báo bug |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Template đề xuất tính năng |
| `.github/CODEOWNERS` | Định tuyến review về `@tungbach12` |
| `.github/dependabot.yml` | Tự động update deps: npm (immersioFe), NuGet (src), GitHub Actions |

### 6. Fix Tool Coverage — ECC plugin detection

**Root cause**: `installed_plugins.json` đã có entry `ecc@ecc` trỏ về `~/.claude/plugins/cache/ecc/ecc/2.0.0` nhưng directory không tồn tại.

Audit tìm plugin theo thứ tự:
1. `installed_plugins.json` manifest → resolve `installPath` → tìm `.claude-plugin/plugin.json`
2. Flat layout: `~/.claude/plugins/ecc/`
3. Cache layout: `~/.claude/plugins/cache/<marketplace>/<name>/<version>/`

**Fix**: Tạo Windows directory junction tại path mà manifest đã khai báo:

```powershell
New-Item -ItemType Junction `
  -Path  'C:\Users\Admin\.claude\plugins\cache\ecc\ecc\2.0.0' `
  -Target 'C:\Users\Admin\OneDrive\Máy tính\githubProjects\Harness\node_modules\ecc-universal' `
  -Force
```

Junction không tốn dung lượng, tự sync khi `ecc-universal` được update.

---

## Verify

```bash
node scripts/harness-audit.js repo --format text
# → 39/39, 0 failing checks
```
