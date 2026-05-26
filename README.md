# Immersio - Full-Stack Language Learning Application

Immersio is a modern language-learning platform featuring an interactive React Frontend, a robust .NET 9.0 Web API Backend, and a PostgreSQL database.

## System Architecture & Deployment

The application is deployed on a Linux VPS with a fully automated **one-click CI/CD deployment pipeline** powered by **GitHub Actions**.

### Technology Stack
* **Frontend**: React (Vite, TypeScript, TailwindCSS) served by Nginx.
* **Backend**: C# .NET 9.0 Web API containerized inside Docker.
* **Database**: PostgreSQL 16 Alpine containerized inside Docker.
* **Orchestration**: Docker Compose bridging the API and DB on an isolated network.
* **Reverse Proxy**: Nginx acting as SSL terminator, serving static FE assets, and proxying API endpoints.

### CI/CD Deployment Flow
1. **GitHub Runner Build**:
   * Frontend: Compiles Vite static assets (`npm run build`).
   * Backend: Builds and publishes the .NET Web API container to GitHub Container Registry (GHCR).
2. **VPS Deploy**:
   * Copies compiled frontend assets directly to `/var/www/immersio` via SCP.
   * Copies `docker-compose.yml` configuration to `/home/azureuser/immersio`.
   * Triggers remote SSH commands to pull the latest backend image from GHCR, restart container services, and safely prune old images.

This architecture protects the VPS's 1GB RAM memory constraint by executing all heavy compiler workloads inside GitHub's cloud runners.
