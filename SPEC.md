# DomainSniper AI — Technical Specification

Institutional-grade **Expired Domain Valuation, Backlink Juice & Drop-Catching Radar**.
Every day 100,000+ domains expire into the ICANN *Pending Delete* cycle. DomainSniper AI
monitors the drop queue, scores every candidate with a mathematical SniperScore (0–100),
estimates secondary-market valuation, and fires sub-second Telegram / WhatsApp / email
tripwire alerts before auction snipers strike.

## Stack
- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind CSS 4 · Space Grotesk (display) + JetBrains Mono (data)
- Drizzle ORM + PostgreSQL with **resilient offline fallback**
- Stripe ($9/mo global) + Razorpay (₹499/mo India) · sandbox VIP activation
- Passwordless magic-link auth · stateless HMAC-SHA256 `ds_session` cookie

## Resilience guarantee
The app MUST boot, pre-render and run with **zero** live PostgreSQL connection.
`src/db/index.ts` exposes `withDb(fallback, run)` with a 2.5s connect timeout and
30s negative caching. Every query in `src/lib/queries.ts` falls back to the
`globalThis.__dsMem*` in-memory store seeded from the verified 30-domain offline
catalog (`src/lib/fallback-domains.ts`). `next build` never opens a connection
(`NEXT_PHASE === "phase-production-build"` short-circuits `getDb()`).

## SniperScore formula (`src/lib/sniper-score.ts`)
```
SniperScore = 0.35·S_authority + 0.25·S_backlinks + 0.15·S_age
            + 0.15·S_brand  + 0.10·S_arbitrage
            + B_edu_gov − P_spam − P_trademark        (clamped 0–100)

S_authority  = clamp(DR / 80 · 100)
S_backlinks  = clamp(log10(RD + 1) / log10(1000) · 100)
S_age        = clamp(ArchiveAgeYears / 15 · 100)
S_brand      = 100 (≤6-char .com/.ai) | 80 (.io/.co) | 50 (hyphen/number)
S_arbitrage  = clamp((EstVal − Bid) / EstVal · 100)
B_edu_gov    = +15 verified .edu/.gov editorial backlinks
P_spam       = −35 casino/adult/PBN anchor history
P_trademark  = −50 active trademark collision

isHighValueSniper ⇔ SniperScore ≥ 82 AND EstValuation ≥ $1,200
```

## Data model (9 tables, `src/db/schema.ts`)
domains · backlink_history · profiles · user_watchlists · subscriptions ·
affiliate_clicks · newsletter_subscribers · alert_events · system_state

## API surface
| Route | Purpose |
| --- | --- |
| `GET /api/health` | service + DB status, catalog count |
| `GET /api/domains` | filtered drops (tld, minDr, maxPrice, q, category, sort) |
| `GET /api/domain/[id]/history` | 60-day valuation tape + interest series |
| `GET /api/go/domain/[id]` | tracked affiliate redirector |
| `GET /api/og` | 1200×630 appraisal certificate (ImageResponse + SVG fallback) |
| `GET/POST /api/watchlists` · `PATCH/DELETE /api/watchlists/[id]` | tripwire CRUD |
| `POST /api/newsletter/subscribe` | morning digest signup |
| `POST /api/auth/magic-link` → `GET /api/auth/verify` | 15-min single-use tokens |
| `GET /api/auth/session` · `POST /api/auth/signout` | session lifecycle |
| `POST /api/billing/checkout` | Razorpay / Stripe router |
| `POST /api/billing/sandbox-activate` | 1-click QA VIP |
| `POST /api/webhooks/razorpay|stripe` | signature-verified subscription sync |
| `GET/POST /api/cron/refresh-drops` | drop sweep + tripwire dispatch |

## Alert channels (`src/lib/notify.ts`)
Telegram Bot API, WhatsApp Cloud API, Resend email — each wrapped in latency
tracking; unconfigured channels degrade to `simulated` events so cron and QA
work end-to-end offline.
