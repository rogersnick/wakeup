# FirstCall

**A personal wake-up call at the exact minute you choose.**

FirstCall schedules AI-voiced phone calls to your verified number. Pick a custom script or get a weather-aware morning brief, choose an ElevenLabs voice, and Twilio dials you at the exact time you chose. Press **1** to confirm you're awake, or **2** to snooze.

## How it works

```mermaid
flowchart LR
  subgraph schedule [Schedule]
    User[User dashboard]
    EL[ElevenLabs TTS]
    Blob[(Vercel Blob)]
    DB[(Neon Postgres)]
    User --> DB
    User --> EL --> Blob --> DB
  end

  subgraph fire [Every minute]
    Cron[Vercel Cron]
    CronLogic[cron.ts]
    Weather[Open-Meteo]
    GPT[OpenAI]
    TwilioOut[Twilio outbound]
    Cron --> CronLogic --> DB
    CronLogic --> Weather
    CronLogic --> GPT
    CronLogic --> EL
    CronLogic --> TwilioOut
  end

  subgraph call [During call]
    Twiml[Twilio TwiML]
    Confirm[DTMF confirm or snooze]
    TwilioOut --> Twiml --> Confirm
    Confirm --> DB
  end
```

1. **Sign in** with Clerk (Google OAuth imports your first name automatically).
2. **Verify your phone** via Twilio SMS OTP.
3. **Schedule** a one-shot or recurring wake-up with a static script or dynamic weather report.
4. **Vercel Cron** runs every minute, prepares dynamic audio just-in-time, and initiates outbound calls.
5. **Twilio** plays your message and listens for DTMF: press **1** to confirm, **2** to snooze 5 minutes.

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16, React 19, Tailwind CSS v4 |
| Auth | Clerk |
| Database | Neon Postgres + Drizzle ORM |
| Telephony | Twilio Programmable Voice + SMS |
| TTS | ElevenLabs |
| AI scripts | OpenAI GPT-4o-mini |
| Weather | Open-Meteo (no API key) |
| Storage | Vercel Blob |
| Scheduling | Vercel Cron |

## Local development

### Prerequisites

- Node.js 20+
- Accounts: Clerk, Neon, Twilio, ElevenLabs, Vercel Blob, OpenAI

### Setup

1. Clone and install:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local` (see table below).

4. Push the database schema:

```bash
npm run db:push
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Twilio webhooks in development

Twilio needs a public URL for voice callbacks. Use [ngrok](https://ngrok.com/) or similar:

```bash
ngrok http 3000
```

Set `NEXT_PUBLIC_APP_URL` to your ngrok URL (e.g. `https://abc123.ngrok.io`).

Twilio signature validation is skipped outside `NODE_ENV=production`, so local dev works without signatures.

### Database commands

```bash
npm run db:generate   # generate migrations from schema changes
npm run db:migrate    # apply migrations
npm run db:push       # push schema directly (dev)
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` |
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token + webhook validation |
| `TWILIO_PHONE_NUMBER` | Yes | Outbound calls and SMS OTP |
| `ELEVENLABS_API_KEY` | Yes | Text-to-speech |
| `ELEVENLABS_DEFAULT_VOICE_ID` | Yes | Default voice for wake-ups |
| `ELEVENLABS_MODEL_ID` | No | Defaults to `eleven_flash_v2_5` |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob for wake-up MP3s |
| `CRON_SECRET` | Yes | Bearer token for `/api/cron/wakeups` |
| `OPENAI_API_KEY` | Yes | Dynamic weather-aware scripts |
| `NEXT_PUBLIC_APP_URL` | Prod | Public app URL for Twilio webhooks |
| `VERCEL_URL` | Auto | Fallback URL on Vercel preview deploys |

## Deploy on Vercel

1. Import the repo into Vercel.
2. Add all environment variables from the table above.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Vercel Cron is configured in `vercel.json` to hit `/api/cron/wakeups` every minute.
5. Run `npm run db:migrate` against your production database (or use `db:push` for initial setup).

## Project structure

```
src/
├── app/
│   ├── api/           # REST + Twilio webhook routes
│   ├── dashboard/     # Main app UI
│   └── page.tsx       # Marketing landing page
├── components/        # React UI components
└── lib/
    ├── db/            # Drizzle schema + client
    ├── wakeup/        # Scheduling, cron, recurrence, scripts
    ├── twilio.ts      # Twilio client + TwiML builder
    ├── elevenlabs.ts  # TTS generation
    └── weather.ts     # Open-Meteo geocoding + forecast
```

## License

Private — hackathon submission.
