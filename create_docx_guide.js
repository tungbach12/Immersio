const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const heading1Run = (text) => new TextRun({ text, bold: true, font: "Arial", size: 32, color: "2E75B6" });
const heading2Run = (text) => new TextRun({ text, bold: true, font: "Arial", size: 28, color: "1F4E79" });
const heading3Run = (text) => new TextRun({ text, bold: true, font: "Arial", size: 26, color: "2E75B6" });
const bodyRun = (text, opts = {}) => new TextRun({ text, font: "Arial", size: 24, ...opts });
const codeRun = (text) => new TextRun({ text, font: "Consolas", size: 20, color: "333333" });
const labelRun = (text) => new TextRun({ text, bold: true, font: "Arial", size: 24, color: "C00000" });
const highlightRun = (text) => new TextRun({ text, bold: true, font: "Arial", size: 24, color: "375623" });
const noteRun = (text) => new TextRun({ text, font: "Arial", size: 22, italics: true, color: "666666" });

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [heading1Run(text)] });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [heading2Run(text)] });
}
function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [heading3Run(text)] });
}
function body(text, opts = {}) {
  return new Paragraph({ spacing: { before: 80, after: 80 }, ...opts, children: [bodyRun(text, opts.run || {})] });
}
function codeLine(text) {
  return new Paragraph({ spacing: { before: 40, after: 40 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, indent: { left: 200 }, children: [codeRun(text)] });
}
function bullet(text, ref = "bullets") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { before: 60, after: 60 }, children: [bodyRun(text)] });
}
function numbered(text, ref = "numbers") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { before: 60, after: 60 }, children: [bodyRun(text)] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function note(text) {
  return new Paragraph({ spacing: { before: 100, after: 100 }, shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, indent: { left: 200 }, children: [noteRun("\u{1F4A1} " + text)] });
}
function tip(text) {
  return new Paragraph({ spacing: { before: 100, after: 100 }, shading: { fill: "E2EFDA", type: ShadingType.CLEAR }, indent: { left: 200 }, children: [noteRun("\u{2705} " + text)] });
}
function warn(text) {
  return new Paragraph({ spacing: { before: 100, after: 100 }, shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, indent: { left: 200 }, children: [noteRun("\u26A0\uFE0F " + text)] });
}

function makeTable(headers, rows, colWidths) {
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders, width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      margins: cellMargins,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: "Arial", size: 22, color: "FFFFFF" })] })]
    }))
  });
  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders, width: { size: colWidths[i], type: WidthType.DXA },
      margins: cellMargins,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [bodyRun(cell, { size: 22 })] })]
    }))
  }));
  return new Table({ width: { size: tableWidth, type: WidthType.DXA }, columnWidths: colWidths, rows: [headerRow, ...dataRows] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets4", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets5", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets6", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers6", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "IMMERSIO", bold: true, font: "Arial", size: 56, color: "1F4E79" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Learning Guide", bold: true, font: "Arial", size: 40, color: "2E75B6" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Docker & CI/CD", bold: true, font: "Arial", size: 40, color: "2E75B6" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "\u2501".repeat(40), font: "Arial", size: 24, color: "2E75B6" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Learning guide based on real-world codebase", font: "Arial", size: 24, color: "666666" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Project: Immersio \u2014 Full-Stack Language Learning Platform", font: "Arial", size: 22, color: "666666" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "React + .NET 9 + PostgreSQL + Docker + GitHub Actions", font: "Arial", size: 22, color: "666666" })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Created: June 2026", font: "Arial", size: 22, color: "999999" })] }),
      ]
    },
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [noteRun("Immersio \u2014 Docker & CI/CD Learning Guide")] })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 20 })] })] })
      },
      children: [
        heading1("TABLE OF CONTENTS"),
        new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: "Chapters in this guide:", font: "Arial", size: 24, color: "444444" })] }),
        numbered("Overview of Docker and Containerization", "numbers2"),
        numbered("Docker Compose \u2014 Orchestration in Immersio", "numbers2"),
        numbered("Dockerfile \u2014 Multi-stage .NET 9 Build", "numbers2"),
        numbered("CI/CD Pipeline with GitHub Actions", "numbers2"),
        numbered("Reading and Analyzing Real Code", "numbers2"),
        numbered("Hands-on Exercises from the Codebase", "numbers2"),
        numbered("Troubleshooting & Best Practices", "numbers2"),
        numbered("References", "numbers2"),
        pageBreak(),

        heading1("CHAPTER 1: OVERVIEW OF DOCKER AND CONTAINERIZATION"),
        body("In this chapter, you will learn the basics of Docker, containers, images, and why Immersio uses Docker for backend deployment."),
        heading2("1.1 What is Docker?"),
        body("Docker is a platform that packages an application and all its dependencies (libraries, configuration, runtime) into a standardized unit called a container."),
        bullet("Containers run independently, isolated from the host environment"),
        bullet("Like a \"lightweight virtual machine\" \u2014 starts in seconds, uses minimal RAM"),
        bullet("Enables \"it works on my machine\" \u2014 consistent behavior everywhere"),
        heading2("1.2 Core Concepts"),
        makeTable(
          ["Concept", "Meaning", "Example in Immersio"],
          [
            ["Image", "Read-only \"blueprint\" to create a container", "postgres:16-alpine, immersio-be:latest"],
            ["Container", "Running process created from an image", "immersio-db, immersio-api"],
            ["Dockerfile", "File containing step-by-step image build instructions", "src/Dockerfile"],
            ["Volume", "Persistent data storage outside the container", "pgdata (stores PostgreSQL data)"],
            ["Network", "Private connection between containers", "immersio-network (bridge)"],
            ["Docker Compose", "Tool to define multi-container applications", "docker-compose.yml"],
          ],
          [3000, 3000, 3360]
        ),
        heading2("1.3 Why does Immersio use Docker?"),
        bullet(".NET 9 backend runs in a container \u2014 consistent deployment across local and VPS"),
        bullet("PostgreSQL runs in a container \u2014 no need to install DB on the host"),
        bullet("Resource limits (256MB\u2013512MB) \u2014 fits a 1GB RAM VPS"),
        bullet("GHCR (GitHub Container Registry) \u2014 stores images for automated deployment"),
        pageBreak(),

        heading1("CHAPTER 2: DOCKER COMPOSE \u2014 ORCHESTRATION IN IMMERSIO"),
        body("Docker Compose lets you define and manage multiple containers in a single YAML file. Immersio uses Compose to run both the Database and API."),
        heading2("2.1 docker-compose.yml \u2014 Overview"),
        codeLine("services:"),
        codeLine("  postgres-db:       # Service 1: Database"),
        codeLine("  immersio-api:      # Service 2: Backend API"),
        codeLine(""),
        codeLine("volumes:"),
        codeLine("  pgdata:            # Volume for persistent PostgreSQL data"),
        codeLine(""),
        codeLine("networks:"),
        codeLine("  immersio-network: # Private network connecting both services"),
        heading2("2.2 Service Breakdown"),
        heading3("Service 1: postgres-db"),
        makeTable(
          ["Property", "Value", "Explanation"],
          [
            ["image", "postgres:16-alpine", "PostgreSQL 16 image on Alpine Linux (~30MB)"],
            ["container_name", "immersio-db", "Fixed name so other services can connect"],
            ["restart", "always", "Auto-restart when VPS reboots"],
            ["environment", "POSTGRES_DB/USER/PASSWORD", "Env vars to create the default database"],
            ["ports", "127.0.0.1:5432:5432", "Exposed only on VPS localhost (secure)"],
            ["volumes", "pgdata:/var/lib/postgresql/data", "Mount volume so data survives container restart"],
            ["healthcheck", "pg_isready ...", "Verify DB is ready before API connects"],
          ],
          [2200, 3200, 3960]
        ),
        warn("Note: PORTS are bound to 127.0.0.1 (localhost) \u2014 only the VPS can access them; external connections are blocked."),
        note("Variable ${DB_PASSWORD:-your_secure_password_here}: If no .env file exists, it falls back to the default password (DO NOT use in production!)."),
        heading3("Service 2: immersio-api"),
        makeTable(
          ["Property", "Value", "Explanation"],
          [
            ["image", "ghcr.io/.../immersio-be:latest", "Image built by GitHub Actions, pushed to GHCR"],
            ["depends_on", "postgres-db: service_healthy", "Only start API when DB passes healthcheck"],
            ["ports", "127.0.0.1:5249:5249", "API runs on port 5249, exposed on VPS localhost"],
            ["env_file", ".env + secrets.env", "Load environment variables from files (optional secrets)"],
            ["deploy.resources", "512M limit / 256M reserve", "RAM limits to prevent container from consuming the entire VPS"],
          ],
          [2200, 4200, 2960]
        ),
        heading2("2.3 Startup Flow"),
        tip("Order: Docker Compose reads docker-compose.yml \u2192 creates network \u2192 starts postgres-db \u2192 runs healthcheck \u2192 then starts immersio-api \u2192 API connects to DB using the service name 'postgres-db'."),
        body("On restart: Nginx (outside Docker) proxies requests to http://127.0.0.1:5249 \u2192 Docker NAT \u2192 immersio-api container \u2192 processes request \u2192 connects to postgres-db via internal network."),
        pageBreak(),

        heading1("CHAPTER 3: DOCKERFILE \u2014 MULTI-STAGE .NET 9 BUILD"),
        body("A Dockerfile is a set of instructions for building an image. Immersio uses multi-stage builds to create a lightweight image containing only what is needed at runtime."),
        heading2("3.1 Why Multi-stage?"),
        bullet("Stage 1 (build): Uses full .NET SDK (~1GB) to compile code"),
        bullet("Stage 2 (runtime): Uses slim ASP.NET runtime (~200MB), copies only published output"),
        bullet("Result: Final image is much smaller, deploys faster, and has a smaller attack surface"),
        heading2("3.2 Line-by-line Analysis"),
        codeLine("# \u2500\u2500\u2500 STAGE 1: BUILD \u2500\u2500\u2500"),
        codeLine("FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build   # SDK base image"),
        codeLine("WORKDIR /app                                        # Working directory"),
        codeLine("COPY .../Immersio.WebApi.csproj .../                # Copy csproj first (cache layer)"),
        codeLine("COPY .../Immersio.Application.csproj .../          # Copy each project"),
        codeLine("COPY .../Immersio.Domain.csproj .../"),
        codeLine("COPY .../Immersio.Infrastructure.csproj .../"),
        codeLine("RUN dotnet restore ...                              # Restore NuGet packages"),
        codeLine("COPY . .                                            # Copy entire source code"),
        codeLine("RUN dotnet publish ... -o /publish                  # Publish to /publish folder"),
        codeLine(""),
        codeLine("# \u2500\u2500\u2500 STAGE 2: RUNTIME \u2500\u2500\u2500"),
        codeLine("FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime # Lightweight runtime image"),
        codeLine("WORKDIR /app"),
        codeLine("COPY --from=build /publish .                       # Only copy publish output"),
        codeLine("ENV ASPNETCORE_ENVIRONMENT=Production               # Set environment"),
        codeLine("ENV ASPNETCORE_URLS=http://+:5249                   # Bind port 5249"),
        codeLine("EXPOSE 5249                                         # Document the port"),
        codeLine("ENTRYPOINT [\"dotnet\", \"Immersio.WebApi.dll\"]       # Container startup command"),
        heading2("3.3 Layer Cache Optimization"),
        tip("COPY csproj files \u2192 RUN dotnet restore: In subsequent builds, if csproj files haven't changed, Docker reuses the cached layer \u2192 restore is almost instant. This is a critical build-time optimization."),
        heading2("3.4 The .dockerignore File"),
        body("This file removes unnecessary files from the build context (the data sent to the Docker daemon):"),
        bullet("**/bin/, **/obj/ \u2014 .NET build output files"),
        bullet("**/.vs/, **/.idea/, **/.vscode/ \u2014 IDE metadata"),
        bullet("**/*.user, **/*.suo \u2014 local configuration files"),
        bullet("**/*.db, **/*.pfx \u2014 database files and certificates"),
        tip("Smaller build context \u2192 faster builds, better security (no secrets sent to Docker daemon)."),
        pageBreak(),

        heading1("CHAPTER 4: CI/CD PIPELINE WITH GITHUB ACTIONS"),
        body("CI/CD (Continuous Integration / Continuous Deployment) automates the process: code \u2192 build \u2192 test \u2192 deploy. Immersio uses GitHub Actions, which runs on GitHub's servers."),
        heading2("4.1 Pipeline Structure"),
        makeTable(
          ["Job", "Trigger", "Purpose", "Runner"],
          [
            ["build-frontend", "Push to main", "Build React FE into static files", "ubuntu-latest"],
            ["build-backend", "Push to main", "Build Docker image & push to GHCR", "ubuntu-latest"],
            ["deploy", " After both above", "Copy to VPS & restart services", "ubuntu-latest"],
          ],
          [2200, 2000, 2600, 2560]
        ),
        note("3 jobs run sequentially (job 3 waits for jobs 1 and 2) \u2192 ensures FE and BE are deployed in the same version."),
        heading2("4.2 Step-by-step Breakdown of deploy.yml"),
        heading3("Step 1: build-frontend"),
        numbered("Checkout code from GitHub", "numbers3"),
        numbered("Setup Node.js 20 + npm cache", "numbers3"),
        numbered("npm ci \u2014 install dependencies from lock file", "numbers3"),
        numbered("npm run build \u2014 build Vite \u2192 dist/ directory", "numbers3"),
        numbered("Upload frontend-dist artifact (retained for 1 day)", "numbers3"),
        heading3("Step 2: build-backend"),
        numbered("Checkout code", "numbers3"),
        numbered("Setup QEMU + Docker Buildx (multi-platform support)", "numbers3"),
        numbered("Login to GHCR using GITHUB_TOKEN (auto-provided)", "numbers3"),
        numbered("Build image from src/Dockerfile, push to GHCR", "numbers3"),
        numbered("Cache Docker layers using GHA cache (type=gha)", "numbers3"),
        tip("Cache: In subsequent builds, unchanged layers are reused \u2192 builds are 60\u201380% faster."),
        heading3("Step 3: deploy"),
        numbered("Download frontend-dist artifact", "numbers3"),
        numbered("Compress into dist.tar.gz (optimize SCP bandwidth)", "numbers3"),
        numbered("SCP copy dist.tar.gz + docker-compose.yml to VPS", "numbers3"),
        numbered("SSH into VPS: extract FE to /var/www/immersio", "numbers3"),
        numbered("SSH: docker login GHCR, create .env, compose pull + up -d", "numbers3"),
        numbered("SSH: docker image prune -f (clean old images, save disk space)", "numbers3"),
        heading2("4.3 Required GitHub Secrets"),
        makeTable(
          ["Secret", "Purpose", "Used In"],
          [
            ["VPS_HOST", "VPS IP address or domain", "SCP + SSH steps"],
            ["VPS_USER", "SSH username (e.g., azureuser)", "SCP + SSH steps"],
            ["VPS_SSH_KEY", "SSH private key to connect to VPS", "SCP + SSH steps"],
            ["DB_PASSWORD", "PostgreSQL password", "Create .env on VPS"],
            ["GITHUB_TOKEN", "Auto-provided \u2014 used to login to GHCR", "Build + push image"],
          ],
          [2800, 3600, 2960]
        ),
        warn("GITHUB_TOKEN is automatically provided by GitHub Actions; no manual creation needed. Other secrets must be added under Settings \u2192 Secrets and variables \u2192 Actions."),
        heading2("4.4 Complete Deployment Flow"),
        body("1. Developer pushes code to the main branch"),
        body("2. GitHub Actions automatically triggers \u2192 runs 3 jobs in sequence (FE and BE build in parallel first) \u2192 then deploy"),
        body("3. On the VPS: new FE assets are extracted, new BE image is pulled, containers restart"),
        body("4. Users access the updated application"),
        pageBreak(),

        heading1("CHAPTER 5: READING AND ANALYZING REAL CODE"),
        body("This section teaches you how to read each file in the Immersio codebase, understand its purpose, and how the files connect to each other."),
        heading2("5.1 How to Read docker-compose.yml"),
        numbered("Read the services section \u2014 count how many services exist", "numbers4"),
        numbered("For each service: identify image, ports, volumes, environment", "numbers4"),
        numbered("Find depends_on \u2014 determine the startup order", "numbers4"),
        numbered("Find networks \u2014 determine which services can communicate", "numbers4"),
        numbered("Find volumes \u2014 determine which data is persistent", "numbers4"),
        tip("Self-check question: Why does the API use the name 'postgres-db' in the connection string instead of an IP address?"),
        heading2("5.2 How to Read a Dockerfile"),
        numbered("Count the number of stages (AS build, AS runtime...) \u2014 is it multi-stage?", "numbers4"),
        numbered("Identify the base image of each stage (SDK or runtime?)", "numbers4"),
        numbered("Find COPY . . \u2014 which stage is it in? Before or after restore?", "numbers4"),
        numbered("Identify the final ENTRYPOINT/CMD command", "numbers4"),
        numbered("Check if EXPOSE port matches docker-compose.yml?", "numbers4"),
        heading2("5.3 How to Read deploy.yml (GitHub Actions)"),
        numbered("Find on: trigger \u2014 when does the job run?", "numbers4"),
        numbered("Find needs: \u2014 which jobs depend on which?", "numbers4"),
        numbered("Find uses: \u2014 which action and version is used?", "numbers4"),
        numbered("Find secrets. \u2014 which secrets are referenced?", "numbers4"),
        numbered("Find run: script: \u2014 which shell script runs on the VPS?", "numbers4"),
        heading2("5.4 Full System Diagram"),
        body("GitHub Push \u2192 GitHub Actions Runner \u2192 Build FE + Build BE \u2192 Copy to VPS \u2192 VPS runs Docker Compose \u2192 Nginx \u2192 Docker Container \u2192 PostgreSQL \u2192 Response returned to user."),
        pageBreak(),

        heading1("CHAPTER 6: HANDS-ON EXERCISES FROM THE CODEBASE"),
        body("These exercises are designed to help you learn through Immersio's real code. Ordered from easy to hard."),
        heading2("Exercise 1: Read and Summarize (Easy)"),
        numbered("Read docker-compose.yml \u2014 write a 3-line summary of each service", "numbers5"),
        numbered("Read Dockerfile \u2014 list each stage and its purpose", "numbers5"),
        numbered("Read deploy.yml \u2014 name all 3 jobs and their trigger conditions", "numbers5"),
        heading2("Exercise 2: Change Configuration (Medium)"),
        numbered("Change API port from 5249 to 5050 in both Dockerfile and docker-compose.yml", "numbers5"),
        numbered("Change API memory limit from 512M to 1G", "numbers5"),
        numbered("Add a new environment variable ASPNETCORE_APP__MySetting=12345 to the API service", "numbers5"),
        numbered("Create a .env file for backend (containing DB_PASSWORD) instead of entering it manually", "numbers5"),
        tip("After each change, run docker compose config to validate the YAML is correct."),
        heading2("Exercise 3: Add a New Service (Medium+)"),
        numbered("Add a Redis service to docker-compose.yml (image: redis:7-alpine, port 6379)", "numbers5"),
        numbered("Connect Redis with API in the same immersio-network", "numbers5"),
        numbered("Add a Redis__ConnectionString environment variable for the API", "numbers5"),
        heading2("Exercise 4: Create a Dockerfile for Frontend (Hard)"),
        numbered("Write a Dockerfile for the React app (using Nginx to serve static files)", "numbers5"),
        numbered("Add a frontend service to docker-compose.yml", "numbers5"),
        numbered("Configure Nginx reverse proxy inside the container", "numbers5"),
        numbered("Update deploy.yml to build and push the FE image too", "numbers5"),
        heading2("Exercise 5: Add Checks to CI/CD (Hard)"),
        numbered("Add a test-frontend job that runs npm test before building", "numbers5"),
        numbered("Add a test-backend job that runs dotnet test (if a test project exists)", "numbers5"),
        numbered("Add a docker scan step (Snyk) to check for image vulnerabilities", "numbers5"),
        numbered("Add a YAML lint step for docker-compose.yml", "numbers5"),
        pageBreak(),

        heading1("CHAPTER 7: TROUBLESHOOTING & BEST PRACTICES"),
        heading2("7.1 Common Errors"),
        makeTable(
          ["Error", "Cause", "Fix"],
          [
            ["API won't start", "DB not ready yet", "Check healthcheck, increase retries"],
            ["Cannot connect to DB", "Wrong password or connection string", "Check DB_PASSWORD in .env"],
            ["Image pull fails", "GHCR is private, missing permissions", "Check GITHUB_TOKEN permissions"],
            ["FE 502 Bad Gateway", "API not running or wrong port", "Check docker compose ps"],
            ["Build is slow", "Not using cache", "Check docker/build-push-action cache-from"],
            ["VPS out of disk", "Old images not cleaned up", "Run docker image prune -f"],
          ],
          [2200, 3200, 3960]
        ),
        heading2("7.2 Best Practices from the Immersio Codebase"),
        bullet("DB healthcheck: Ensures DB is ready before API connects"),
        bullet("Bind port 127.0.0.1: Only expose on localhost, more secure"),
        bullet("Resource limits: Set RAM limits to prevent container from consuming the entire VPS"),
        bullet("Multi-stage build: Final image contains only runtime, smaller and safer"),
        bullet("GHA Cache: Cache Docker layers between builds \u2192 much faster builds"),
        bullet("Env file: Separate sensitive variables (DB_PASSWORD) from docker-compose.yml"),
        bullet("Image prune: Clean old images after each deploy \u2192 saves disk space"),
        bullet("restart: always: Container auto-restarts when VPS reboots"),
        heading2("7.3 Pre-push Checklist"),
        bullet("Dockerfile builds successfully local: docker build -t test ./src"),
        bullet("Docker Compose runs locally: docker compose up -d"),
        bullet("DB healthcheck passes: docker compose ps postgres-db"),
        bullet("API responds OK: curl http://127.0.0.1:5249/health (if endpoint exists)"),
        bullet("FE builds without errors: cd immersioFe && npm run build"),
        pageBreak(),

        heading1("CHAPTER 8: REFERENCES"),
        heading2("8.1 Files in the Immersio Codebase"),
        makeTable(
          ["File", "Location", "Description"],
          [
            ["docker-compose.yml", "Project root", "Defines 2 services: Postgres + API"],
            ["src/Dockerfile", "src/", "Multi-stage .NET 9 build \u2192 lightweight image"],
            ["src/.dockerignore", "src/", "Excludes unnecessary files from build context"],
            [".github/workflows/deploy.yml", ".github/workflows/", "CI/CD pipeline with 3 jobs"],
            ["immersioFe/.env.example", "immersioFe/", "Frontend environment variable template"],
            ["README.md", "Project root", "High-level project architecture overview"],
          ],
          [3200, 2400, 3760]
        ),
        heading2("8.2 External Documentation"),
        bullet("Docker Docs: https://docs.docker.com"),
        bullet("Docker Compose: https://docs.docker.com/compose"),
        bullet("GitHub Actions: https://docs.github.com/en/actions"),
        bullet("GitHub Container Registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry"),
        bullet(".NET Docker Images: https://hub.docker.com/_/microsoft-dotnet"),
        heading2("8.3 Useful Commands"),
        codeLine("# Docker Compose"),
        codeLine("docker compose up -d              # Start services"),
        codeLine("docker compose down               # Stop and remove containers"),
        codeLine("docker compose ps                 # Show service status"),
        codeLine("docker compose logs -f            # Stream logs in realtime"),
        codeLine("docker compose config             # Validate YAML"),
        codeLine(""),
        codeLine("# Docker"),
        codeLine("docker images                     # List images"),
        codeLine("docker ps -a                      # List all containers (including stopped)"),
        codeLine("docker logs <container_name>       # View container logs"),
        codeLine("docker exec -it <name> sh          # Enter container shell"),
        codeLine("docker image prune -f             # Remove unused images"),
        codeLine(""),
        codeLine("# GitHub Actions"),
        codeLine("gh run list                       # View workflow history"),
        codeLine("gh run watch <run_id>             # Watch workflow run in realtime"),
        codeLine("gh run view <run_id> --log-failed  # View failed logs"),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:\\Users\\Admin\\OneDrive\\M\u00E1y t\u00EDnh\\Immersio\\Docker_CICD_Learning_Guide.docx", buffer);
  console.log("DOCX created successfully!");
});
