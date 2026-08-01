# Local Docker Runbook

This guide is for running the IEEE Hackathon website locally using Docker Compose.

## Prerequisites
- Docker Desktop installed and running
- Git installed
- Valid environment file at `server/.env`

## One-Time Setup
1. Clone the repository.
2. Ensure `server/.env` exists and has real values for required keys.
3. From project root, build and start containers:

```bash
docker compose up --build -d
```

## Daily Commands
- Start existing containers:

```bash
docker compose up -d
```

- Stop containers:

```bash
docker compose down
```

- Stop and remove containers + networks + volumes:

```bash
docker compose down -v
```

## Access URLs
- Frontend: `http://localhost`
- Backend health: `http://localhost:8080/health`

## Logs and Status
- Check service status:

```bash
docker compose ps
```

- Tail backend logs:

```bash
docker compose logs -f server
```

- Tail frontend logs:

```bash
docker compose logs -f client
```

## Rebuild After Code Changes
- Rebuild both services:

```bash
docker compose up --build -d
```

- Rebuild only backend:

```bash
docker compose build server
docker compose up -d server
```

- Rebuild only frontend:

```bash
docker compose build client
docker compose up -d client
```

## Environment Updates
If you change values in `server/.env`, recreate backend container:

```bash
docker compose up -d --force-recreate server
```

If frontend env/build args change, rebuild client:

```bash
docker compose build client
docker compose up -d client
```

## Quick Troubleshooting
- If ports are busy (`80` or `8080`), stop conflicting local apps.
- If API calls fail in UI, check backend logs and confirm `server` is healthy.
- If CORS errors appear, verify `CLIENT_ORIGIN` and `CLIENT_ORIGINS` in `server/.env`.
- If email is not sending, verify `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.

## Security Notes
- Never commit `server/.env`.
- Rotate secrets before any public deployment.
