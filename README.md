# FirstCall

**A personal wake-up call at the exact minute you choose.**

FirstCall schedules AI-voiced phone calls to your verified number. Pick a custom script or get a weather-aware morning brief, choose an ElevenLabs voice, and Twilio dials you at the exact time you chose. Press **1** to confirm you're awake, or **9** to snooze. Optionally enable a **wake-up challenge** — solve it and you're confirmed automatically.

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
3. **Schedule** a one-shot or recurring wake-up with a custom script or generated content (weather, local news, sports, markets, horoscope, motivation, history, word of the day, or fun fact).
4. **Vercel Cron** runs every minute, prepares dynamic audio just-in-time, and initiates outbound calls.
5. **Twilio** plays your message and listens for DTMF: press **1** to confirm, **9** to snooze 5 minutes. With challenge mode, solve the keypad check to confirm — no extra step needed.
6. **SMS recap** sends your wake-up script summary after a successful confirmation.

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
| Mode | API key needed |
|------|----------------|
| Write my own | None |
| Weather report | `OPENAI_API_KEY` (script polish) + Open-Meteo (free) |
| Daily motivation, Horoscope, Word of the day, Fun fact | `OPENAI_API_KEY` only |
| On this day | `OPENAI_API_KEY` + Wikipedia (free, no key) |
| Local news | `OPENAI_API_KEY` + Google News RSS (free; optional `NEWS_API_KEY`) |
| Sports scores | `OPENAI_API_KEY` + ESPN (free, no key) with TheSportsDB fallback |
| Market brief | `OPENAI_API_KEY` + Yahoo Finance (free; optional `FINNHUB_API_KEY`) |

If an optional key is missing, those modes still work using built-in fallback scripts instead of live data.
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
| `OPENAI_API_KEY` | Yes | Generated wake-up scripts |
| `NEWS_API_KEY` | No | Optional NewsAPI.org source; Google News RSS is used when absent |
| `FINNHUB_API_KEY` | No | Optional Finnhub quotes; Yahoo Finance is used when absent |
| `NEXT_PUBLIC_APP_URL` | Prod | Public app URL for Twilio webhooks |
| `VERCEL_URL` | Auto | Fallback URL on Vercel preview deploys |

## Deploy on Vercel

1. Import the repo into Vercel.
2. Add all environment variables from the table above.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Vercel Cron is configured in `vercel.json` to hit `/api/cron/wakeups` every minute.
5. Run `npm run db:migrate` against your production database (or use `db:push` for initial setup).

## 2-minute judge demo path

Use this flow to show the full product loop quickly:

1. **Sign in** at `/dashboard` and verify your phone with SMS OTP.
2. **Schedule a one-shot wake-up** for **In 5 min** with any message mode.
3. Enable **Wake-up challenge** on the confirm step (try **Quick math** or **Audio check**).
4. Wait for the outbound call, listen to the message, pass the challenge, then press **1**.
5. Confirm the dashboard shows updated **wake-up consistency** stats and you receive an **SMS recap**.

### Expected behavior during demo

| Step | What judges should see |
|------|------------------------|
| Schedule | Wake-up saved with `status=scheduled` |
| Cron fire | `/api/cron/wakeups` picks up due wake-up within 1 minute |
| Call | Twilio dials verified number and plays generated audio |
| Challenge | Optional keypad prompt after message (math/pattern/audio) |
| Confirm | Press **1** marks attempt confirmed and updates streak stats |
| Recap | SMS with wake-up script text arrives after confirmation |

### Manual cron trigger (optional)

If you need to force processing outside Vercel Cron:

```bash
curl -X POST "http://localhost:3000/api/cron/wakeups" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Reliability notes

- Stale `calling` wake-ups older than 10 minutes are automatically recovered on the next cron tick.
- Failed Twilio call initiation rolls the wake-up back into retry scheduling instead of leaving it stuck.

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
