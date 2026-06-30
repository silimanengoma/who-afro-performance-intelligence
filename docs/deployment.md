# SAM 1 Deployment Guide

This app deploys as two services:

- Frontend: Vercel static Vite build from `client/dist`
- Backend: Render Node web service from `server/src/index.js`
- Database: Render PostgreSQL, migrated by the backend pre-deploy command

## Backend on Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository root.
3. Render reads `render.yaml` and creates:
   - `sam1-api`
   - `sam1-postgres`
4. Confirm these environment variables on `sam1-api`:
   - `DATABASE_URL`: from the managed Render database
   - `JWT_SECRET`: generated secret
   - `MAX_UPLOAD_MB`: `25`
   - `DB_SSL`: `false` for Render internal database URLs, `true` for external SSL URLs
   - `NODE_VERSION`: `20`
5. Deploy. The `preDeployCommand` runs `pnpm --filter server deploy:migrate`.

The migrations create the schema, seed demo users, and seed pilot country workspaces for Zambia, Sierra Leone, and Chad.

Backend smoke checks:

```bash
curl https://YOUR_RENDER_SERVICE.onrender.com/api/health
curl https://YOUR_RENDER_SERVICE.onrender.com/api/users
```

Expected health response:

```json
{ "ok": true }
```

## Frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Keep the project root as the repository root. Vercel reads `vercel.json`.
3. Set this environment variable:
   - `VITE_API_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com/api`
4. Deploy.

Frontend smoke checks:

1. Open the Vercel URL.
2. Select `MSC Admin`.
3. Open the Pilot Centre.
4. Confirm pilot readiness, pilot workspaces, help/training resources, and notifications load.

## Demo Users

The deployed database includes these mock-login users:

- MSC Admin
- Zambia PMO / WR / Team Lead
- Sierra Leone PMO / WR / Team Lead
- Chad PMO / WR / Team Lead

## Public URLs

After deployment, record:

- Frontend: `https://YOUR_VERCEL_PROJECT.vercel.app`
- Backend: `https://YOUR_RENDER_SERVICE.onrender.com`
- Health: `https://YOUR_RENDER_SERVICE.onrender.com/api/health`
