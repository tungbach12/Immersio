# Immersio — Deployment Guide

Full step-by-step guide for deploying Immersio to production.
Architecture: **React SPA (Vercel or VPS + Nginx)** + **ASP.NET Core 9 API (Docker on VPS)** + **PostgreSQL (Docker)**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [VPS Setup (first time only)](#3-vps-setup-first-time-only)
4. [GitHub Repository Secrets](#4-github-repository-secrets)
5. [Backend Secrets on VPS](#5-backend-secrets-on-vps)
6. [Nginx Setup](#6-nginx-setup)
7. [SSL with Certbot (HTTPS)](#7-ssl-with-certbot-https)
8. [CI/CD Pipeline (GitHub Actions)](#8-cicd-pipeline-github-actions)
9. [Frontend on Vercel (alternative)](#9-frontend-on-vercel-alternative)
10. [Manual Deploy (without CI)](#10-manual-deploy-without-ci)
11. [Database Management](#11-database-management)
12. [Monitoring & Logs](#12-monitoring--logs)
13. [Rollback](#13-rollback)
14. [Environment Variable Reference](#14-environment-variable-reference)

---

## 1. Architecture Overview

```
Internet
    │
    ▼
[Nginx :80/:443]  ← static React SPA files at /var/www/immersio
    │
    ├── /api/*  →  proxy  →  [Docker: immersio-api :5249]
    │                              │
    └── /swagger  →  proxy  →     │
                                  ▼
                         [Docker: postgres-db :5432]
```

| Component | Where | How |
|-----------|-------|-----|
| React frontend | VPS `/var/www/immersio` | Built by CI, copied via SCP |
| ASP.NET Core API | Docker container on VPS | Image pulled from GHCR |
| PostgreSQL | Docker container on VPS | Volume-mounted, never exposed publicly |
| Nginx | Native on VPS | Reverse proxy + SPA static host |

---

## 2. Prerequisites

### Local machine
- Git + GitHub account
- SSH client

### VPS requirements
- Ubuntu 22.04 LTS or 24.04 (tested)
- Min 1 vCPU, 1 GB RAM (2 GB recommended)
- Ports open: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- A domain or public IP

### Install on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Docker
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (avoids sudo every time)
sudo usermod -aG docker $USER
newgrp docker

# Nginx
sudo apt install -y nginx

# Certbot for HTTPS
sudo apt install -y certbot python3-certbot-nginx
```

---

## 3. VPS Setup (first time only)

### 3.1 Create deployment directory

```bash
mkdir -p /home/azureuser/immersio
mkdir -p /var/www/immersio
sudo chown -R azureuser:azureuser /var/www/immersio
```

### 3.2 Generate SSH key pair for GitHub Actions

Run this **on your local machine** (or anywhere convenient):

```bash
ssh-keygen -t ed25519 -C "github-actions-immersio" -f ~/.ssh/immersio_deploy
```

This creates two files:
- `~/.ssh/immersio_deploy` — **private key** → paste into GitHub secret `VPS_SSH_KEY`
- `~/.ssh/immersio_deploy.pub` — **public key** → add to VPS

**On VPS:**
```bash
# Append the public key to authorized_keys
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3.3 Test SSH connection

```bash
ssh -i ~/.ssh/immersio_deploy azureuser@YOUR_VPS_IP
```

---

## 4. GitHub Repository Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value | Notes |
|---|---|---|
| `VPS_HOST` | `123.45.67.89` | VPS public IP or domain |
| `VPS_USER` | `azureuser` | SSH username on VPS |
| `VPS_SSH_KEY` | Contents of `~/.ssh/immersio_deploy` | Full private key including `-----BEGIN...` lines |
| `DB_PASSWORD` | strong random password | Used for PostgreSQL and connection string |

> The `GITHUB_TOKEN` secret is provided automatically by GitHub Actions — do NOT add it manually.

### Generate a strong DB password

```bash
openssl rand -base64 32
```

---

## 5. Backend Secrets on VPS

The backend reads secrets from `secrets.env` in the deployment folder. This file is **never committed to git** and **never sent by CI** — you create it once on the VPS manually.

```bash
# On VPS
nano /home/azureuser/immersio/secrets.env
```

Paste and fill in:

```env
# JWT
Jwt__Key=YOUR_SUPER_SECRET_JWT_KEY_BASE64_32_BYTES_OR_MORE=
Jwt__Issuer=ImmersioApi
Jwt__Audience=ImmersioUsers
Jwt__AccessTokenExpiryMinutes=15
Jwt__RefreshTokenExpiryDays=7

# Google OAuth
Google__ClientId=YOUR_GOOGLE_CLIENT_ID_HERE

# AI providers
Groq__ApiKey=YOUR_GROQ_API_KEY_HERE
Gemini__ApiKey=YOUR_GEMINI_API_KEY_HERE
Nvidia__ApiKey=YOUR_NVIDIA_API_KEY_HERE
StepFun__ApiKey=YOUR_STEPFUN_API_KEY_HERE
OpenCode__ApiKey=YOUR_OPENCODE_API_KEY_HERE

# Azure Speech (pronunciation scoring)
Azure__Speech__Key=YOUR_AZURE_SPEECH_KEY
Azure__Speech__Region=YOUR_AZURE_REGION

# Cloudinary (image upload)
Cloudinary__CloudName=YOUR_CLOUD_NAME
Cloudinary__ApiKey=YOUR_CLOUDINARY_API_KEY
Cloudinary__ApiSecret=YOUR_CLOUDINARY_API_SECRET

# Email SMTP
Email__Smtp__Host=smtp.gmail.com
Email__Smtp__Port=587
Email__Smtp__User=your@gmail.com
Email__Smtp__Password=YOUR_APP_PASSWORD

# PayOS (Vietnamese payment)
PayOS__ClientId=YOUR_PAYOS_CLIENT_ID
PayOS__ApiKey=YOUR_PAYOS_API_KEY
PayOS__ChecksumKey=YOUR_PAYOS_CHECKSUM_KEY
```

Secure the file:
```bash
chmod 600 /home/azureuser/immersio/secrets.env
```

> ASP.NET Core maps `Jwt__Key` → `Jwt:Key` automatically (double underscore = nested key).

---

## 6. Nginx Setup

### 6.1 Copy config to VPS

```bash
# From local machine
scp nginx.conf azureuser@YOUR_VPS_IP:/tmp/immersio.conf

# On VPS
sudo mv /tmp/immersio.conf /etc/nginx/sites-available/immersio
sudo ln -sf /etc/nginx/sites-available/immersio /etc/nginx/sites-enabled/immersio
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 If using a domain — update server_name

Edit `/etc/nginx/sites-available/immersio`:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

Then reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. SSL with Certbot (HTTPS)

```bash
# Replace with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos -m your@email.com

# Verify auto-renewal
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Certbot automatically modifies your Nginx config to add SSL and redirect HTTP → HTTPS.

---

## 8. CI/CD Pipeline (GitHub Actions)

The workflow file is at [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### What happens on every push to `main`

```
push to main
    │
    ├── [Job: build-frontend]
    │     npm ci → npm run build → upload artifact (dist/)
    │
    ├── [Job: build-backend]  (runs in parallel)
    │     docker buildx → push image to ghcr.io/OWNER/immersio-be:latest
    │
    └── [Job: deploy]  (waits for both jobs above)
          download artifact (dist/)
          tar compress dist/ → dist.tar.gz
          SCP: dist.tar.gz + docker-compose.yml → VPS
          SSH commands on VPS:
            extract dist.tar.gz → /var/www/immersio
            docker login ghcr.io
            write .env (DB_PASSWORD + GITHUB_REPOSITORY_OWNER)
            docker compose pull → docker compose up -d
            docker image prune -f
```

### Enable pipeline

1. All 4 secrets from [Section 4](#4-github-repository-secrets) must be set.
2. `secrets.env` must exist on VPS (see [Section 5](#5-backend-secrets-on-vps)).
3. Nginx must be running (see [Section 6](#6-nginx-setup)).
4. Push to `main` — GitHub Actions starts automatically.

### Monitor a running pipeline

- Go to **GitHub repo → Actions tab**
- Click the latest workflow run to watch live logs
- Each job (build-frontend, build-backend, deploy) shows step-by-step output

---

## 9. Frontend on Vercel (alternative)

If you want to host the frontend on Vercel separately instead of on the VPS:

### 9.1 Connect repo

1. Log in to [vercel.com](https://vercel.com)
2. **New Project → Import** your GitHub repo
3. Set **Root Directory** to `immersioFe`
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`

### 9.2 Set environment variables in Vercel dashboard

**Project → Settings → Environment Variables:**

| Name | Value |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Your Google Client ID |
| `APP_URL` | Your Vercel URL (e.g. `https://immersio.vercel.app`) |
| `GROQ_API_KEY` | Your Groq API key (used by serverless `/api/chat` and `/api/tts` routes) |

### 9.3 Update backend CORS

In `secrets.env` on VPS, add your Vercel domain to the allowed origins:
```env
AllowedOrigins=https://immersio.vercel.app
```

### 9.4 Auto-deploy

Every push to `main` triggers a Vercel deployment automatically. No further setup needed.

---

## 10. Manual Deploy (without CI)

Useful for one-off deploys or if GitHub Actions is not set up yet.

### Build and push Docker image locally

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Build and push
cd src
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/immersio-be:latest .
docker push ghcr.io/YOUR_GITHUB_USERNAME/immersio-be:latest
```

### Build frontend

```bash
cd immersioFe
npm ci
npm run build
tar -czf dist.tar.gz -C dist .
```

### Copy to VPS

```bash
scp dist.tar.gz docker-compose.yml azureuser@YOUR_VPS_IP:/home/azureuser/immersio/
```

### Deploy on VPS

```bash
ssh azureuser@YOUR_VPS_IP

cd /home/azureuser/immersio

# Extract frontend
sudo rm -rf /var/www/immersio/*
sudo tar -xzf dist.tar.gz -C /var/www/immersio
sudo chown -R azureuser:azureuser /var/www/immersio
sudo chmod -R 755 /var/www/immersio
rm dist.tar.gz

# Write .env (replace values)
echo "DB_PASSWORD=YOUR_DB_PASSWORD" > .env
echo "GITHUB_REPOSITORY_OWNER=YOUR_GITHUB_USERNAME_LOWERCASE" >> .env

# Pull and restart
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

---

## 11. Database Management

### Run EF Core migrations (production)

Migrations run automatically on startup via `app.MigrateDatabase()` in `Program.cs`. No manual step needed after deploy.

### Manual migration (if needed)

```bash
# From local machine, targeting production DB (use carefully)
cd src
dotnet ef database update \
  --project Immersio.Infrastructure \
  --startup-project Immersio.WebApi \
  --connection "Host=YOUR_VPS_IP;Port=5432;Database=ImmersioDb;Username=postgres;Password=YOUR_DB_PASSWORD"
```

### Backup database

```bash
# On VPS — dump to file
docker exec immersio-db pg_dump -U postgres ImmersioDb > backup_$(date +%Y%m%d).sql

# Download backup to local
scp azureuser@YOUR_VPS_IP:~/backup_*.sql ./backups/
```

### Restore database

```bash
# Upload backup to VPS
scp backup_20260101.sql azureuser@YOUR_VPS_IP:~/

# Restore on VPS
docker exec -i immersio-db psql -U postgres ImmersioDb < ~/backup_20260101.sql
```

---

## 12. Monitoring & Logs

### Container status

```bash
# On VPS
docker compose ps
docker stats --no-stream
```

### API logs

```bash
# Live logs
docker logs immersio-api -f

# Last 200 lines
docker logs immersio-api --tail 200

# With timestamps
docker logs immersio-api -f --timestamps
```

### Database logs

```bash
docker logs immersio-db -f
```

### Nginx logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check if everything is running

```bash
# All containers up?
docker compose ps

# API responding?
curl http://localhost:5249/api/health

# Nginx passing requests?
curl http://localhost/api/health
```

---

## 13. Rollback

### Rollback Docker image to previous

```bash
# On VPS
docker compose down

# Tag the previous image (if you have the digest)
docker pull ghcr.io/YOUR_GITHUB_USERNAME/immersio-be:previous-tag

# Edit docker-compose.yml to use that tag temporarily
# Then restart
docker compose up -d
```

### Quick rollback via GitHub Actions

1. Find the last good commit in GitHub → **Actions** tab
2. Manually re-run that workflow run (click **Re-run jobs**)

### Rollback frontend only

```bash
# On VPS — replace /var/www/immersio with a previous backup
# (keep a backup before each deploy as a habit)
sudo rsync -a /var/www/immersio-backup/ /var/www/immersio/
```

---

## 14. Environment Variable Reference

### GitHub Actions secrets

| Secret | Where used | Required |
|---|---|---|
| `VPS_HOST` | SSH/SCP target | Yes |
| `VPS_USER` | SSH/SCP username | Yes |
| `VPS_SSH_KEY` | SSH authentication | Yes |
| `DB_PASSWORD` | Written to `.env` on VPS, injected into PostgreSQL + API | Yes |

### VPS `.env` (written by CI)

| Variable | Value |
|---|---|
| `DB_PASSWORD` | PostgreSQL password (from GitHub secret) |
| `GITHUB_REPOSITORY_OWNER` | GitHub username in lowercase |

### VPS `secrets.env` (created manually, never touched by CI)

| Variable | Purpose |
|---|---|
| `Jwt__Key` | JWT signing secret (min 32 bytes base64) |
| `Jwt__Issuer` | Token issuer (`ImmersioApi`) |
| `Jwt__Audience` | Token audience (`ImmersioUsers`) |
| `Google__ClientId` | Google OAuth client ID |
| `Groq__ApiKey` | Groq LLM API key |
| `Gemini__ApiKey` | Google Gemini API key |
| `Nvidia__ApiKey` | Nvidia NIM API key |
| `StepFun__ApiKey` | StepFun API key |
| `OpenCode__ApiKey` | OpenCode API key |
| `Azure__Speech__Key` | Azure Cognitive Services key |
| `Azure__Speech__Region` | Azure region (e.g. `southeastasia`) |
| `Cloudinary__CloudName` | Cloudinary cloud name |
| `Cloudinary__ApiKey` | Cloudinary API key |
| `Cloudinary__ApiSecret` | Cloudinary API secret |
| `Email__Smtp__Host` | SMTP host |
| `Email__Smtp__Port` | SMTP port (587 for TLS) |
| `Email__Smtp__User` | SMTP username / email address |
| `Email__Smtp__Password` | SMTP app password |
| `PayOS__ClientId` | PayOS client ID |
| `PayOS__ApiKey` | PayOS API key |
| `PayOS__ChecksumKey` | PayOS checksum key |

### Frontend `.env` (Vercel environment variables or local `.env`)

| Variable | Purpose |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (must match backend) |
| `GROQ_API_KEY` | Groq API key for server-side TTS/chat proxy |
| `APP_URL` | Frontend URL for CORS/OAuth redirect |

---

## Quick Checklist — First Deploy

- [ ] VPS created and accessible via SSH
- [ ] Docker and Nginx installed on VPS (`Section 3`)
- [ ] SSH key pair generated; public key added to VPS (`Section 3.2`)
- [ ] 4 GitHub repository secrets set (`Section 4`)
- [ ] `secrets.env` created and secured on VPS (`Section 5`)
- [ ] `nginx.conf` copied and enabled (`Section 6`)
- [ ] SSL certificate issued via Certbot (`Section 7`)
- [ ] Push to `main` branch triggers the pipeline (`Section 8`)
- [ ] Visit `https://yourdomain.com` — React app loads
- [ ] Visit `https://yourdomain.com/api/swagger` — Swagger UI loads
- [ ] Test login and a basic API call

---

## Quick Checklist — Routine Deploy

```bash
git push origin main
# → GitHub Actions handles everything automatically
# → Monitor: GitHub repo → Actions tab
```

Done. The pipeline takes ~3–5 minutes end-to-end.
