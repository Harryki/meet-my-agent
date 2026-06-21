# meet-my-agent

## Prerequisites

- Docker + the Docker Compose plugin
- `backend/.env` — copy from `backend/.env.example` and fill in the secrets
  (`JWT_SECRET_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_REDIRECT_URI`)
- `frontend/.env.local` — for local dev only (already set up for `localhost`)

## Local

Runs **frontend + backend** with hot-reload. `docker-compose.override.yml`
is auto-loaded, so you don't pass any flags.

```bash
# start everything (backend + frontend)
docker compose up -d --build

# frontend -> http://localhost:3000
# backend  -> http://localhost      (host port 80 -> container 8000)

docker compose logs -f      # tail logs
docker compose down         # stop
```

## Prod (EC2)

Runs the **backend only** — the frontend is hosted on Vercel. Naming the base
file explicitly skips the dev override. The API is published on port 80, so it's
reachable from networks that block non-standard ports like 8000.

```bash
# start backend only (redis + app + worker), production mode, on port 80
docker compose -f docker-compose.yml up -d --build

docker compose -f docker-compose.yml logs -f      # tail logs
docker compose -f docker-compose.yml down         # stop
```

Health check: `curl http://<ec2-public-dns>/health` → `{"status":"ok"}`

Before deploying, make sure:

- `backend/.env` uses production values, in particular
  `GOOGLE_REDIRECT_URI=https://<your-app>.vercel.app/auth/callback`
- the EC2 security group allows inbound **TCP 80**
- in Vercel, `API_URL` points at `http://<ec2-public-dns>` (port 80)
