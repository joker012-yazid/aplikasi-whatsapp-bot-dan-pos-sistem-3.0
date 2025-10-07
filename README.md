# Voltura Service Hub

Voltura Service Hub transforms the CodeGuide Starter Kit into a full blueprint for a device-repair business platform. It combines an AI-powered WhatsApp bot, campaign blaster, CRM, POS, and inventory management into one Next.js 15 application with Clerk authentication and Supabase data infrastructure.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui components
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL) — SQLite supported for lightweight installs
- **AI:** Vercel AI SDK with OpenAI
- **Containerisation:** Docker Compose-ready services

## Quick Start
1. **Clone & install**
   ```bash
   git clone <repository-url>
   cd aplikasi-whatsapp-bot-dan-pos-sistem-3.0
   npm install
   ```
2. **Environment variables** — create `.env.local` with:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   OPENAI_API_KEY=
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and sign in with Clerk to test the WhatsApp concierge demo.

> Clerk dashboard: https://dashboard.clerk.com  
> Supabase dashboard: https://supabase.com/dashboard  
> OpenAI console: https://platform.openai.com

## Platform Modules
### 1. WhatsApp AI Concierge
- AI auto-replies using OpenAI with Supabase-powered context awareness
- QR intake slips capture nama, no telefon, jenis barang, and model instantly
- Detects missing database info and routes to technicians with the fallback message: “Tunggu sebentar, teknisi kami akan melayan anda”
- Technician prompt workspace for diagnosis, pricing, photos, status updates, and invoice triggers
- Customer confirmation flow tracks Setuju/Tak Setuju responses, escalates unanswered chats, and persists chat history + AI context
- Smart reminder cadence (Day 1, Day 20, Day 30) keeps customers engaged

### 2. WhatsApp Blaster with Anti-Ban
- Random 30–60 second delays, safe-hour windows (9am–6pm), weekend skip, and multi-session auto-reconnect
- Daily limit guardrail (100–150 messages) with auto-stop
- Campaign planner: name/description, scheduling, preview, and target selection
- Message builder: rich text, media attachments, dynamic variables ({nama}, {model}, {expiry_date}), template library
- Filtering: customer type, device type, last visit, purchase history, custom tags
- Tracking & analytics: sent/delivered/read counts, response rate, CSV/PDF export
- Safety controls: blacklist manager, opt-out link, session monitoring, emergency stop

### 3. POS System & Repair Desk
- Sales counter: quick product search, barcode scanning, multiple payment methods, split payments, promotions, product/service catalogue
- Quotation & invoice: auto-numbering, PDF generation, WhatsApp/email send, template customisation, follow-up reminders
- Repair jobs: status workflow (Pending → In Progress → Completed → Delivered), technician assignment, priority & SLA timers, ETA tracking
- Parts & labour: track consumed stock, labour hours, warranties, attach before/during/after photos
- Inventory control: real-time levels, low-stock alerts, supplier management, stock movement history
- Purchase orders & stock adjustments with audit trail + stock take sessions
- Reporting: daily sales, monthly revenue, best-selling items, technician performance, profit margins

### 4. CRM & Database
- PostgreSQL recommended; SQLite optional for kiosks/pilots
- Tables: Customer, Device/Product, Job/Repair, Invoice, Payment, Inventory, WhatsApp Message Log, Campaign
- Data retention: archive >2 years, optimisation scheduler, audit logs, encryption at rest
- Backup strategy: daily automated backups (30-day retention), weekly full snapshot to external storage, one-click restore

### 5. Web UI & Experience
- Dashboard quick stats (revenue, pending/completed jobs, new customers) and recent activity feeds
- Navigation tree covering WhatsApp Management, Sales & POS, Repair Jobs, Customers, Inventory, Reports, Settings
- Theme system: light, dark, auto, and custom brand palettes
- Real-time updates via sockets for chats and job progress
- Tables with sort/paginate/export/bulk actions; global search with advanced filters and saved presets
- Client-side validation with clear messaging and keyboard shortcuts (Ctrl+K)
- Settings workspace: WhatsApp sessions & anti-ban, AI prompts, business info, template editors, user management, maintenance, updates
- Accessibility: WCAG 2.1 colour contrast, full keyboard navigation, screen-reader support, high contrast mode

## Integration Flow
- **WhatsApp ↔ CRM:** Auto-create customers and attach message history
- **POS ↔ WhatsApp:** Send invoices, payment confirmations, and delivery updates automatically
- **AI ↔ Database:** AI concierge queries job history, inventory, and upsell suggestions
- **Inventory ↔ POS:** Real-time stock deduction, low-stock alerts, and out-of-stock guardrails

## Security, Deployment & Performance
- Authentication & authorisation with Clerk roles; encrypted API keys; rate limiting; SQL injection & XSS protection; strict CORS policies; regular security patch cadence
- Docker Compose layout with Nginx reverse proxy, SSL, health checks, auto-restart, and log rotation
- Performance optimisations: database indexing, query tuning, image compression, lazy loading, caching strategy, CDN for static assets

## Project Structure
```
apps/
  api/          # Fastify + Prisma REST API with Socket.IO
  web/          # Next.js 15 application
  worker/       # BullMQ background processor
packages/
  messaging/    # Shared Baileys session manager
```

## Local Development

Install dependencies once from the repo root:

```bash
npm install
```

Then start the desired workspace:

```bash
# Next.js frontend
npm run dev:web

# Fastify API (http://localhost:4000)
npm run dev:api

# BullMQ worker
npm run dev:worker
```

The API relies on PostgreSQL and Redis. For local prototyping use Docker Compose (below) or supply compatible `DATABASE_URL` and `REDIS_URL` values.

## Docker Compose

The repository ships with a production-style stack including PostgreSQL, Redis, API, worker, web, and Nginx. Launch everything with:

```bash
docker compose up --build
```

Services expose:

- Nginx gateway: http://localhost:8080
- API: http://localhost:4000
- Web (internal): http://web:3000

Persistent WhatsApp session data is shared between the API and worker through the `whatsapp_sessions` volume.

## Next Steps
- Configure Clerk & Supabase keys, then replace the Supabase schema with the tables outlined above
- Build WhatsApp Baileys integration for QR and messaging APIs
- Implement POS inventory logic inside Supabase functions/triggers
- Deploy with Docker Compose + Nginx reverse proxy in your preferred cloud environment

Enjoy building your own Voltura Service Hub! 🎉
