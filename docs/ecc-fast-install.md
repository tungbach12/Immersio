---
name: ecc-fast-install
description: Concise step-by-step installation guide for the ECC harness on a fresh machine
metadata:
  type: reference
---

# Hướng dẫn Cài đặt Nhanh ECC Harness (Fresh Machine)

> **Tài liệu tham khảo đầy đủ:** [docs/ecc-harness-guide.md](ecc-harness-guide.md)  
> **Dành cho:** Máy mới cài đặt Claude Code CLI v2.1.0+, Node.js 18+, và Git.

Tài liệu này hướng dẫn cài đặt nhanh hệ thống Everything Claude Code (ECC) Harness lên máy mới để bắt đầu code dự án Immersio.

---

## 0. Yêu cầu hệ thống (Prerequisites)
- **Claude Code CLI** v2.1.0+
- **Node.js** 18+ (và npm/pnpm)
- **Git**

---

## Bước 1: Đăng ký ECC Marketplace & Cài đặt Plugin

Mở một session Claude Code ở bất kỳ đâu và chạy 2 lệnh sau:

```bash
# 1. Đăng ký marketplace
/plugin marketplace add https://github.com/affaan-m/ECC

# 2. Cài đặt plugin
/plugin install ecc@ecc
```
*Lệnh này tự động cấu hình nạp **67 agents, 271 skills, và 92 commands** vào Claude Code.*

---

## Bước 2: Tải Rules và sao chép vào thư mục toàn cục

Do hệ thống plugin của Claude Code chưa hỗ trợ tự phân phối tệp Rules, bạn phải thực hiện sao chép thủ công.

Chạy các lệnh dưới đây trong Terminal (Git Bash / WSL / macOS):

```bash
# 1. Clone tạm thời mã nguồn ECC
git clone https://github.com/affaan-m/ECC.git /tmp/ECC

# 2. Tạo thư mục rules
mkdir -p ~/.claude/rules/ecc

# 3. Copy bộ quy tắc chung (Common Rules)
cp -r /tmp/ECC/rules/common ~/.claude/rules/ecc/

# 4. Copy bộ quy tắc đặc thù cho Immersio (C#, React, Web, TypeScript)
for d in web typescript react csharp; do
  cp -r "/tmp/ECC/rules/$d" ~/.claude/rules/ecc/
done
```

*Đối với **Windows PowerShell**, thay thế phần copy bằng:*
```powershell
# Sao chép Common Rules
Copy-Item -Recurse -Force G:\tmp\ECC\rules\common ~\.claude\rules\ecc\

# Sao chép các rules đặc thù
foreach ($d in "web", "typescript", "react", "csharp") {
    Copy-Item -Recurse -Force "G:\tmp\ECC\rules\$d" ~\.claude\rules\ecc\
}
```

---

## Bước 3: Cài đặt Hooks Runtime Toàn cục (Global Hooks)

Hooks tự động định dạng code (prettier), type check (tsc), và quan sát Turn để học hỏi mẫu hành vi (Continuous Learning).

Chạy script cài đặt thích hợp từ thư mục đã clone ở Bước 2:

* **macOS / Linux / Git Bash:**
  ```bash
  bash /tmp/ECC/install.sh --target claude --modules hooks-runtime
  ```
* **Windows PowerShell:**
  ```powershell
  pwsh -File C:\tmp\ECC\install.ps1 --target claude --modules hooks-runtime
  ```

---

## Bước 4: Clone Dự án Immersio & Chạy thử
Sau khi cài đặt xong global, clone dự án Immersio về máy:
```bash
git clone https://github.com/tungbach12/Immersio.git
cd Immersio
```
*Lưu ý: Thư mục `.claude/` cục bộ chứa 2 hook bảo vệ (Write và Bash Guard) đã được commit trong git repository nên sẽ tự động hoạt động ngay khi bạn mở dự án.*

---

## Bước 5: Xác minh Cài đặt (Verification)

Mở session Claude Code mới trong thư mục dự án Immersio và kiểm tra:

1. **Xác minh Plugin**: Chạy lệnh `/plugin list ecc@ecc` để xem danh sách lệnh đã nạp.
2. **Chạy Audit**: Chạy lệnh `/run-audit` (hoặc `node scripts/harness-audit.js repo --format text`) để kiểm tra độ tin cậy của cấu hình.
   *Kết quả mong đợi: **39/39 (0 failing checks)**.*
3. **Kiểm tra Rules**: Thử gõ câu hỏi bất kỳ, hệ thống sẽ tự nạp 37 file rules trong `~/.claude/rules/ecc/` ở phần đầu context.

---

## Cấu hình Nâng cao (Tùy chọn)
Để cấu hình các khóa API dịch vụ (như MCP Firecrawl) hoặc tối ưu hóa chi phí token (Token Optimization), hãy đọc chi tiết tại các phần tương ứng của [Hướng dẫn đầy đủ](ecc-harness-guide.md).
