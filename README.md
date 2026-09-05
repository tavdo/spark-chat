# Spark — verified random chat

Random 1:1 chat with photo verification, text/photo/voice/GIF messages, and an admin moderation console.

## Stack

- **Next.js 16** App Router (UI + REST API)
- **Custom Node server** with **Socket.io** (matchmaking + realtime chat)
- **PostgreSQL** via **Prisma**
- **Local disk or S3-compatible** storage for photos/voice
- JWT httpOnly cookies for sessions

## Setup

1. Copy env (Postgres is already the default):

```bash
copy .env.example .env
```

`DATABASE_URL` should be `postgresql://spark:spark@localhost:5432/spark?schema=public`. This project creates that database on the local PostgreSQL 17 service. `docker-compose.yml` is an optional alternative.

2. Install, migrate, seed:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
```

3. Run the app (custom server — required for WebSockets):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Accounts after seed

| Role | Email | Password |
|---|---|---|
| Admin | `admin@spark.local` | `changeme-admin` |
| Demo user A | `alex@spark.local` | `demo12345` |
| Demo user B | `jordan@spark.local` | `demo12345` |

Admin console: `/admin/login`

To test matchmaking, sign in as Alex and Jordan in two different browsers (or one normal + one incognito) and click **Start chat** on both.

Set `DEV_AUTO_APPROVE=true` in `.env` if you want new webcam signups to skip the admin queue locally.

Add a [Klipy API key](https://docs.klipy.com/) as `KLIPY_API_KEY` to enable GIF search.

## Routes

- `/` landing
- `/register` nickname, email, password, gender, age, live webcam capture
- `/pending` under-review / rejected + resubmit
- `/profile` bio, interests, verification badge
- `/chat` queue, skip, block, report, text/photo/voice/GIF
- `/admin` verification queue
- `/admin/reports` warn / suspend / ban
- `/admin/users` search and account actions

## Safety

- Unverified users cannot join the matchmaking queue
- Verification photos are served only to admins (`/api/media/verification/...`)
- Reports store a snapshot of recent messages
- Messages and chat media older than `MESSAGE_RETENTION_HOURS` (default 48) are deleted, except chats with open reports

## Deploy

Remote: [github.com/tavdo/spark-chat](https://github.com/tavdo/spark-chat)

### Vercel (pages, auth, admin)

Import the GitHub repo in [Vercel](https://vercel.com/new). Set these environment variables:

- `DATABASE_URL` — hosted Postgres (Neon, Supabase, or Vercel Postgres). Local `localhost` will not work on Vercel.
- `JWT_SECRET` — long random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — first admin after you run seed against the hosted DB
- `KLIPY_API_KEY` — optional GIF search
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` — required on Vercel for photos/voice (the serverless filesystem is not writable)

After the first deploy, run migrations against the hosted database:

```bash
npx prisma migrate deploy
npx prisma db seed
```

### Realtime chat

Matchmaking uses a long-running Socket.io process (`server.ts`). Vercel serverless cannot host that, so **Start chat will not work on a Vercel-only deploy**. For full chat, run this app on [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io) with `npm run start`, or keep Vercel for the website and point a Socket.io host at the same database.

