# DomainSniper AI 🎯

**Expired Domain Valuation, Backlink Juice & Drop-Catching Radar.**

Live drop radar over the ICANN pending-delete queue with a mathematical
SniperScore (0–100), secondary-market valuations, authority backlink audits,
and sub-second Telegram / WhatsApp / email tripwire alerts.

## Quick start
```bash
npm install
npm run build && npm start        # or: npm run dev
```

The app runs **fully offline**: if `DATABASE_URL` is missing or PostgreSQL is
down, every query transparently falls back to the verified 30-domain catalog
and an in-memory store (`globalThis.__dsMem*`).

## Configuration (all optional)
| Variable | Enables |
| --- | --- |
| `DATABASE_URL` | PostgreSQL persistence (auto-seeded from catalog) |
| `SESSION_SECRET` | HMAC session signing (dev default provided) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Live $9/mo checkout |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Live ₹499/mo checkout |
| `RESEND_API_KEY` | Real magic-link + alert emails (otherwise QA dev-link mode) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Live Telegram alerts |
| `WHATSAPP_CLOUD_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Live WhatsApp alerts |
| `CRON_SECRET` | Locks `/api/cron/refresh-drops` behind `Bearer` auth |
| `NEXT_PUBLIC_APP_URL` | Canonical base URL for links/sitemap |

## QA cheat codes
- **Sign in**: `/login` → any email → when no email provider is configured the
  magic link is shown directly ("QA mode") — one click lands you in `/dashboard`.
- **VIP**: `POST /api/billing/sandbox-activate` (or the ⚡ button in the pricing
  modal / dashboard) activates Club Pro instantly.
- **Tripwire sweep**: `POST /api/cron/refresh-drops` fires matching alerts and
  records delivery latency per channel.

## Scripts
```bash
npm run dev         # dev server
npm run build       # production build (never requires a live DB)
npm run typecheck   # tsc --noEmit
npx drizzle-kit push  # apply schema to PostgreSQL (optional)
```

## Monetization (disclosed in-app)
Registrar affiliate commissions · Club Pro subscriptions (₹499 / $9) ·
$19 appraisal certificates · digest sponsor slots · 10% drop-catching concierge.
See the Revenue Model section on the home page.
