# 🎰 BunaBingoBot

A fully automated, centralized Bingo Telegram Bot + Mini App platform. No agents, no cashiers — everything runs directly through the bot and admin.

---

## Project Structure

```
BunaBingoBot/
├── backend/          Node.js + Telegraf + Express API
├── frontend/         Next.js Telegram Mini App
└── docker-compose.yml   Local PostgreSQL
```

---

## Quick Start

### 1. Clone & Setup

```bash
# Backend
cd backend
cp .env.example .env
# Fill in BOT_TOKEN, DATABASE_URL, PUSHER_*, ADMIN_TELEGRAM_IDS
npm install

# Frontend
cd ../frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_URL, NEXT_PUBLIC_PUSHER_*
npm install
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Run Migrations & Seed

```bash
cd backend
npm run db:push
npm run db:seed
```

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Register and open Mini App |
| `/balance` | Check wallet balance |
| `/deposit` | Submit deposit request |
| `/buyticket` | Browse rooms and buy ticket |
| `/join` | Same as /buyticket |
| `/mycards` | View your active cards |
| `/results` | View game results & wins |
| `/withdraw` | Request withdrawal |
| `/support` | Get support |
| `/admin` | Admin panel (admins only) |

---

## Game Rooms

| Room | Min Players | Ticket Price | Countdown |
|---|---|---|---|
| Casual | 2+ | 10 ETB | 30 seconds |
| Standard | 5+ | 25 ETB | 15 seconds |
| Jackpot | 20+ | 100 ETB | 5 seconds |

---

## Win Modes & Prize Distribution

| Mode | Prize % |
|---|---|
| Row | 10% |
| Column | 10% |
| Diagonal | 15% |
| Four Corners | 15% |
| Full House | 50% |

House edge: 10% of ticket price.

---

## Environment Variables

### Backend `.env`

```env
BOT_TOKEN=
ADMIN_TELEGRAM_IDS=123456789
MINI_APP_URL=https://your-frontend.vercel.app
DATABASE_URL=postgresql://buna:bingo2024@localhost:5432/buna_bingo
PORT=3001
JWT_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=mt1
WEBHOOK_URL=https://your-backend.railway.app
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

---

## Deployment

### Backend → Railway

```bash
# Set environment variables in Railway dashboard
# Deploy from GitHub or Railway CLI
railway up
```

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

### Configure Telegram Bot

1. Go to [@BotFather](https://t.me/BotFather)
2. Create bot → get `BOT_TOKEN`
3. Set Mini App: `/newapp` → enter your Vercel URL
4. Set webhook: `POST https://api.telegram.org/bot{TOKEN}/setWebhook?url={BACKEND_URL}/bot{TOKEN}`

---

## Anti-Fraud Features

- One Telegram account per user (enforced by `telegramId` unique constraint)
- Rate limiting on deposits (5/hour), withdrawals (3/hour), game joins (3/10s)
- Automated fraud detection scan:
  - Multiple deposit requests in 1 hour
  - Multiple withdrawal requests in 24 hours
  - Suspicious win rate (>80% over 10+ games)
  - Large withdrawal alerts (>5,000 ETB)
- All admin actions logged to `admin_logs` table
- Full transaction audit trail

---

## Tech Stack

| Layer | Tech |
|---|---|
| Bot | Node.js, Telegraf v4, TypeScript |
| API | Express.js |
| Frontend | Next.js 14, App Router |
| Database | PostgreSQL + Prisma ORM |
| Realtime | Pusher |
| Hosting | Vercel + Railway |

---

## License

MIT — Build your own bingo empire! 🎰
