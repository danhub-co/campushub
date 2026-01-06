# Study Abroad Assistant — Starter Monorepo

This repository contains a minimal scaffold for a study-abroad web app:
- Frontend: Next.js (web)
- Backend: NestJS (api)
- DB: PostgreSQL (via docker-compose)
- Prisma schema included for data modeling

Quick start (Docker)
1. Copy the environment file:
   - cp .env.example .env
2. Build and start:
   - docker compose up --build
3. Visit:
   - Frontend: http://localhost:3000
   - Backend health: http://localhost:4000/api/health

Notes
- The backend uses Prisma (schema located at `api/prisma/schema.prisma`). After containers are up you can run Prisma migrations or `prisma generate` locally (or in the running container).
- This scaffold is minimal and intended as a starting point. Next steps include adding authentication, application/document models, storage for uploads (S3), tasks/checklists, and search indexing.

Next recommended steps
- Run Prisma migrate / generate and seed initial data.
- Add auth (e.g., Clerk/Auth0) and RBAC in the API.
- Implement uploads (presigned S3).
- Add CI (GitHub Actions) and local dev scripts.

If you want, I can:
- Generate the GitHub Actions workflow to build/test containers.
- Add auth integration (Clerk or Auth0) wiring for Next.js + NestJS.
- Expand Prisma schema for users, applications, documents, tasks, scholarships, etc.
