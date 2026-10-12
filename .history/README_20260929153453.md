# Wokora Foods

Production-ready cafe site for **wokorafoods.com** — dark neon QSR branding, table-side ordering, and counter receipt printing.

## Stack

- Next.js 14 App Router, TypeScript, TailwindCSS, Framer Motion
- NextAuth.js (JWT, Google, password, and email OTP)
- Prisma + Hostinger MySQL
- Zustand cart
- Print abstraction in `src/lib/printReceipt.ts`

## Local setup

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Point `DATABASE_URL` at the Hostinger MySQL database (`mysql://user:password@host:3306/dbname`). Kitchen/admin changes and customer accounts all persist there. Seed only creates the kitchen admin when `KITCHEN_ADMIN_PHONE`, `KITCHEN_ADMIN_EMAIL`, and `KITCHEN_ADMIN_PASSWORD` are set.

Google login needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Email OTP needs `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`.

## Pages

- `/` home, `/menu`, `/cart`, `/login`, `/signup`
- `/order/[orderId]` confirmation + status
- `/account` history, loyalty, re-order
- `/admin` live orders, menu CRUD, print kiosk, table QR
- `/table/12` QR deep-link that pre-fills table 12

## Receipt printing

`POST /api/orders` always calls `printReceipt(order)`.

| `PRINT_MODE` | Behaviour |
| --- | --- |
| `kiosk` (default) | Jobs land in `PrintJob`. Open `/admin/kiosk` on the counter PC and leave it open. The tab polls `/api/print-queue` and runs `window.print()`. |
| `agent` | Also POSTs to `PRINT_AGENT_URL`. Run `print-agent/` on a Pi/PC next to the thermal printer (`node-thermal-printer` / ESC-POS). The agent can poll the queue if the cafe LAN is not inbound-reachable. |
| `escpos` | Scaffold for a networked printer at `PRINTER_IP:9100`. Needs a cafe-side relay or VPN from serverless. |

Swap approaches by changing env vars only — order APIs stay the same.

## Deploy

Cloudflare **free** is DNS + SSL for **wokorafoods.com**. This Next.js app needs Node (Prisma / NextAuth / uploads), so the site runs on a Hostinger VPS with Docker. MySQL stays on Hostinger.

1. Cloudflare → Add site `wokorafoods.com` → copy the two nameservers.
2. GoDaddy → DNS → Nameservers → replace with Cloudflare’s.
3. Cloudflare DNS (orange-cloud proxy, SSL **Full (strict)**):
   - `A` `@` → VPS IPv4
   - `CNAME` `www` → `wokorafoods.com`
4. On the VPS: set `.env` (`DATABASE_URL` Hostinger MySQL, `NEXTAUTH_URL=https://wokorafoods.com`, Google, SMTP, kitchen admin) then `docker compose -f docker-compose.vps.yml up -d --build`.
5. Google OAuth origins: `https://wokorafoods.com` and `https://www.wokorafoods.com`. Redirects: `/api/auth/callback/google` on both hosts.

Disable Cloudflare Rocket Loader for this site (it can break Next.js).

## Menu images

Seeded items use Unsplash placeholders. Replace with `/images/menu/{slug}.jpg` when photography is ready.
