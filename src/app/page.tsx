"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Chat from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  HeartHandshake,
  Clock,
  Bot,
  Database,
  QrCode,
  UserCog,
  ClipboardCheck,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Send,
  LineChart,
  LayoutDashboard,
  Settings,
  Warehouse,
  ShoppingCart,
  Wrench,
  Layers,
  BarChart3,
  Cable,
  Cloud,
  Server,
  SlidersHorizontal,
  Lock,
} from "lucide-react";

type Stat = {
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
};

type IconFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type FeatureGroup = IconFeature & {
  items: string[];
};

const quickStats: Stat[] = [
  {
    icon: Sparkles,
    value: "90%",
    label: "chat auto-resolve rate",
    description: "OpenAI answers recurring repair questions with CRM context.",
  },
  {
    icon: HeartHandshake,
    value: "<2 mins",
    label: "quotation approvals",
    description: "Technicians receive structured prompts and customers reply in WhatsApp.",
  },
  {
    icon: Clock,
    value: "150/day",
    label: "safe broadcast messages",
    description: "Anti-ban guardrails pace delivery windows and break schedules.",
  },
];

const heroHighlights = [
  {
    title: "AI concierge on WhatsApp",
    description:
      "Auto-replies pull order history, pricing, and FAQs before looping in humans.",
  },
  {
    title: "Technician-ready workflows",
    description:
      "Route missing data, capture diagnostics, and trigger invoices from one timeline.",
  },
  {
    title: "Omni operations hub",
    description:
      "Run POS checkout, inventory, CRM, and broadcast campaigns without tab hopping.",
  },
];

const aiFeatures: IconFeature[] = [
  {
    icon: Bot,
    title: "Contextual AI replies",
    description:
      "OpenAI answers Bahasa or English questions and flags anything missing from the database before escalating.",
  },
  {
    icon: Database,
    title: "Knowledge-aware detection",
    description:
      "Conversation memory checks Supabase so the bot knows when customer info, models, or job IDs are incomplete.",
  },
  {
    icon: QrCode,
    title: "QR intake capture",
    description:
      "Generate QR slips to capture nama, no telefon, jenis barang, and model as soon as devices arrive.",
  },
  {
    icon: UserCog,
    title: "Technician fallback",
    description:
      "If AI can’t resolve, it posts a fallback message — \"Tunggu sebentar, teknisi kami akan melayan anda\" — and routes the chat to a technician channel.",
  },
];

const technicianTools: FeatureGroup[] = [
  {
    icon: ClipboardCheck,
    title: "Diagnosis prompts",
    description: "Technicians log root cause, parts needed, and harga estimates with guided forms.",
    items: [
      "Structured repair checklists",
      "Pre-filled labor tiers",
      "Job priority and SLA timers",
    ],
  },
  {
    icon: ImageIcon,
    title: "Photo documentation",
    description: "Upload before, progress, and after photos for proof-of-work inside the thread.",
    items: [
      "Supports multi-image uploads",
      "Stamp timestamps automatically",
      "Keep attachments linked to the job",
    ],
  },
  {
    icon: Wrench,
    title: "Status + invoice actions",
    description: "Move jobs from Pending to In Progress or Siap, trigger invoice pushes, and update costs in one click.",
    items: [
      "Route Setuju/Tak Setuju approvals",
      "Log parts & labour hours",
      "Notify cashier when payment is due",
    ],
  },
  {
    icon: Send,
    title: "Customer confirmation flow",
    description: "Send quotations, wait for replies, and auto-branch based on responses.",
    items: [
      "Track approval status in chat history",
      "Trigger follow-up reminders on Day 1/20/30",
      "Escalate silent threads to technicians",
    ],
  },
];

const reminderFlow = [
  {
    day: "Day 1",
    focus: "Friendly nudge",
    detail: "Gentle reminder if the customer hasn’t replied to the quotation or diagnosis summary.",
  },
  {
    day: "Day 20",
    focus: "Second follow-up",
    detail: "Highlights outstanding approvals and offers to reschedule or revise pricing.",
  },
  {
    day: "Day 30",
    focus: "Final reminder",
    detail: "Warns that the device will be archived and prompts escalation to manual outreach.",
  },
];

const messageTemplates = [
  "Terima kasih message",
  "Update status repair",
  "Quotation message",
  "Invoice message",
  "Reminder messages",
  "Review request",
];

const aiDataPoints = [
  "Chat history with every customer and technician note",
  "Customer response status for approvals and follow-ups",
  "Timestamped interactions and escalation events",
  "AI conversation context snapshots for audit",
];

const blasterHighlights: IconFeature[] = [
  {
    icon: Clock,
    title: "Human-like pacing",
    description:
      "Random 30-60 second delays between messages with gentle jitter keep the account safe from bans.",
  },
  {
    icon: ShieldCheck,
    title: "Daily thresholds",
    description:
      "Cap broadcasts at 100-150 messages per day and auto-stop when quotas are reached.",
  },
  {
    icon: Sparkles,
    title: "Dynamic templates",
    description:
      "Personalise content with {nama}, {model}, service history, and promo rules for each audience.",
  },
  {
    icon: Send,
    title: "Safe hour windows",
    description:
      "Schedule inside business hours (9am-6pm) and skip weekends or holidays automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Session resilience",
    description:
      "Multiple WhatsApp sessions auto-reconnect if a device drops offline to keep campaigns flowing.",
  },
];

const campaignTools: FeatureGroup[] = [
  {
    icon: FileText,
    title: "Message builder",
    description: "Craft compelling broadcasts with personalisation and media support.",
    items: [
      "Rich text with bold, italic, and quick replies",
      "Attach images, videos, or documents",
      "Dynamic variables {nama}, {model}, {expiry_date}",
      "Template library for promos and reminders",
    ],
  },
  {
    icon: Send,
    title: "Campaign planner",
    description: "Set up the when and how of each broadcast with confidence.",
    items: [
      "Set campaign name & description",
      "Choose scheduled broadcast time within safe hours",
      "Preview WhatsApp message before launching",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "Filtering system",
    description: "Target exactly who should receive each message.",
    items: [
      "Segment VIP, Regular, or New customers",
      "Filter by device type, last visit date, or purchase history",
      "Tag-based inclusion/exclusion with AND/OR logic",
    ],
  },
  {
    icon: BarChart3,
    title: "Tracking & analytics",
    description: "Monitor how audiences interact with every campaign.",
    items: [
      "Sent, delivered, and read breakdowns",
      "Response rate tracking with quick replies",
      "Export metrics to CSV/PDF for reporting",
    ],
  },
];

const safetyControls = [
  "Blacklist customers who opt out",
  "Automatic opt-out link in every blast",
  "Monitor WhatsApp session status",
  "Emergency stop button for campaign freezes",
];

const posModules: FeatureGroup[] = [
  {
    icon: ShoppingCart,
    title: "Sales counter",
    description: "Checkout hardware or service bundles instantly.",
    items: [
      "Lightning-fast product search & barcode scans",
      "Cash, card, e-wallet, and credit payments",
      "Split bills and apply promotions or discounts",
      "Product & service catalogue with images, categories, and pricing tiers",
    ],
  },
  {
    icon: Layers,
    title: "Quotation & invoice",
    description: "Generate quotes that convert into invoices with a click.",
    items: [
      "Auto-generate invoice numbers & PDF output",
      "Email or WhatsApp invoices to customers",
      "Customise templates with branding and tax",
      "Follow-up reminders for pending quotations",
    ],
  },
  {
    icon: Wrench,
    title: "Repair desk",
    description: "Track every job from intake to delivery.",
    items: [
      "Status flow: Pending, In Progress, Completed, Delivered",
      "Assign technicians and set priority levels",
      "Estimate and capture actual completion dates",
    ],
  },
];

const inventoryModules: FeatureGroup[] = [
  {
    icon: Warehouse,
    title: "Inventory control",
    description: "Stay on top of stock without spreadsheets.",
    items: [
      "Real-time quantities with low-stock alerts",
      "Full stock movement history",
      "Supplier management tied to purchase cost",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Purchasing & adjustments",
    description: "Replenish parts with audit-ready trails.",
    items: [
      "Create and track purchase orders",
      "Auto-update inventory on goods received",
      "Schedule stock take sessions with digital checklists",
      "Manual stock adjustments with reasons and audit logs",
    ],
  },
  {
    icon: FileText,
    title: "Parts & labour costing",
    description: "Calculate profitability per repair job.",
    items: [
      "Track parts consumed and labour hours",
      "Apply pricing tiers and warranties",
      "Attach before/during/after photos",
    ],
  },
];

const reportingMetrics = [
  "Daily sales report & cash drawer summary",
  "Monthly revenue dashboards",
  "Best-selling products and services ranking",
  "Technician performance leaderboards",
  "Profit margin analysis across jobs",
];

const crmTables = [
  {
    name: "Customer",
    fields: [
      "customer_id (PK)",
      "nama, no_telefon, email, alamat",
      "date_registered, total_visits, total_spending",
      "customer_type + marketing opt-in",
      "tags & categories",
    ],
  },
  {
    name: "Device/Product",
    fields: [
      "device_id (PK) linked to customer",
      "jenis_barang, brand, model, serial_number",
      "purchase_date & warranty_status",
    ],
  },
  {
    name: "Job/Repair",
    fields: [
      "job_id (PK) with customer & device FK",
      "technician_id, problem_description, diagnosis",
      "repair_cost, status, priority",
      "estimated_completion & actual_completion",
      "notes and escalation history",
    ],
  },
  {
    name: "Invoice",
    fields: [
      "invoice_id, invoice_number, totals",
      "tax, discount, payment_status, payment_method",
      "due_date and customer linkage",
    ],
  },
  {
    name: "Payment",
    fields: [
      "payment_id (PK) with invoice FK",
      "payment_date, amount, payment_method",
      "reference_number and reconciliation notes",
    ],
  },
  {
    name: "Inventory",
    fields: [
      "inventory_id, product_name, SKU",
      "quantity_on_hand, reorder_level",
      "unit_cost, selling_price, supplier_id",
    ],
  },
  {
    name: "WhatsApp Message Log",
    fields: [
      "message_id, customer_id, campaign_id",
      "message_type, content, delivery & read status",
      "timestamps for AI context replay",
    ],
  },
  {
    name: "Campaign",
    fields: [
      "campaign_id (PK), campaign_name, description",
      "message_template, target_audience, scheduled_date",
      "status, total_sent, total_delivered, total_read",
    ],
  },
];

const dataMaintenance = [
  "Archive records older than two years",
  "Scheduled database optimisation jobs",
  "Audit logs for critical operations",
  "Encryption at rest for sensitive info",
];

const uiHighlights: IconFeature[] = [
  {
    icon: LayoutDashboard,
    title: "Command centre dashboard",
    description:
      "Quick stats for revenue, pending jobs, completed jobs, and new customers at a glance.",
  },
  {
    icon: Sparkles,
    title: "Theme system",
    description:
      "Light, dark, auto, and custom brand palettes powered by shadcn/ui and Tailwind.",
  },
  {
    icon: LineChart,
    title: "Realtime workspace",
    description:
      "Socket-driven updates for WhatsApp chats, job status, and POS transactions without refreshes.",
  },
];

const navigationTree = `
Dashboard
WhatsApp Management
  ├─ Conversations
  ├─ Broadcast Campaigns
  ├─ Message Templates
  └─ Chat Settings
Sales & POS
  ├─ New Sale
  ├─ Invoices
  ├─ Quotations
  └─ Payment Records
Repair Jobs
  ├─ All Jobs
  ├─ Pending
  ├─ In Progress
  └─ Completed
Customers
  ├─ Customer List
  ├─ Add New Customer
  └─ Customer Groups
Inventory
  ├─ Products
  ├─ Stock Management
  ├─ Purchase Orders
  └─ Suppliers
Reports
  ├─ Sales Reports
  ├─ Inventory Reports
  ├─ Customer Reports
  └─ WhatsApp Analytics
Settings
  ├─ General Settings
  ├─ WhatsApp Configuration
  ├─ AI Settings
  ├─ Invoice/Quotation Templates
  ├─ User Management
  ├─ Backup & Restore
  ├─ System Updates
  └─ Theme Customisation
`;

const keyUiFeatures = [
  "Responsive layouts for desktop, tablet, and mobile",
  "Live notifications for WhatsApp messages and job milestones",
  "Global search with advanced filters and saved presets",
  "Data tables with sorting, pagination, export to CSV/Excel/PDF, and bulk actions",
  "Client-side validation with clear error messaging and required field indicators",
  "Keyboard shortcuts (Ctrl+K, quick actions, accessibility helpers)",
];

const settingsOptions = [
  "WhatsApp device management, QR display, session monitoring, anti-ban tuning",
  "AI prompt configuration, OpenAI API key management, fallback message controls",
  "Business profile: company info, tax, currency, business hours",
  "Template editors for invoice, WhatsApp, and email layouts",
  "Role-based user management with activity logs",
  "System maintenance: backups, restores, cache clear, system logs",
  "Update management with release notes and one-click upgrades",
];

const accessibilityPoints = [
  "WCAG 2.1 compliant colour and contrast",
  "Full keyboard navigation across modules",
  "Screen reader labels on actionable UI",
  "Optional high contrast theme toggle",
];

const integrationFlows: IconFeature[] = [
  {
    icon: Cable,
    title: "WhatsApp ↔ CRM",
    description:
      "Automatically create customer records from chats and link every message to a CRM timeline.",
  },
  {
    icon: Send,
    title: "POS ↔ WhatsApp",
    description:
      "Send invoices, payment confirmations, and delivery updates the moment a sale closes.",
  },
  {
    icon: Bot,
    title: "AI ↔ Database",
    description:
      "Let the AI concierge query history, product info, and upsell recommendations in milliseconds.",
  },
  {
    icon: Warehouse,
    title: "Inventory ↔ POS",
    description:
      "Deduct stock in real time, trigger low-stock alerts, and block sales when items are out.",
  },
];

const backupStrategy = [
  "Daily automated backups with 30-day retention",
  "Weekly full backup snapshots to external storage (Google Drive/Dropbox)",
  "One-click restore workflow for disaster recovery",
];

const securityPillars = [
  "User authentication & authorisation across roles",
  "API key vault with encryption",
  "Rate limiting on public endpoints",
  "SQL injection and XSS protection with query sanitisation",
  "CORS configuration for trusted origins",
  "Regular security patch cadence",
];

const deploymentPillars = [
  "Docker Compose orchestrates frontend, backend, and database containers",
  "Environment variables manage secrets per environment",
  "Nginx reverse proxy with SSL termination",
  "Auto-restart policies and health checks",
  "Structured log rotation for long-running services",
];

const performancePillars = [
  "Database indexing and query optimisation",
  "Image compression for uploaded photos",
  "Lazy loading for chat history and media",
  "Caching strategy for dashboards and product catalogues",
  "CDN delivery for static assets",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-black/5 dark:border-white/10 backdrop-blur-sm bg-white/70 dark:bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-emerald-400 shadow-inner shadow-sky-500/30 flex items-center justify-center text-white font-semibold">
              VS
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">
                Voltura Service Hub
              </p>
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                WhatsApp Bot • CRM • POS System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignedOut>
              <SignInButton>
                <Button size="sm" variant="outline">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <section className="pt-16 sm:pt-20 pb-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 dark:bg-slate-900/60 dark:border-slate-800 px-4 py-1 text-xs font-medium text-sky-600 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              Unified repair business operating system
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              WhatsApp automation, CRM intelligence, and POS workflows in one command centre.
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
              Voltura Service Hub modernises device repair shops with an AI-powered WhatsApp bot, anti-ban campaign blaster, rich POS, and deep CRM database built on PostgreSQL.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" className="shadow-lg shadow-sky-500/30">
                Start repair workflow demo
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#capabilities">Explore full capabilities</Link>
              </Button>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {quickStats.map((stat) => (
              <Card
                key={stat.label}
                className="p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3" id="capabilities">
            {heroHighlights.map((highlight) => (
              <Card
                key={highlight.title}
                className="p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {highlight.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="whatsapp" className="py-16">
          <div className="grid gap-8 lg:grid-cols-[2fr,1.2fr]">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                  1. WhatsApp AI Concierge
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                  Automate WhatsApp conversations with AI, capture device intake instantly, and escalate to technicians with full context.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {aiFeatures.map((feature) => (
                  <Card
                    key={feature.title}
                    className="p-5 bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Customer confirmation flow</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  The bot drives approvals end-to-end: send quotation, track Setuju/Tak Setuju responses, and route next steps automatically.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    AI drafts the quotation and attaches technician notes.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    Voltura waits for confirmation, updates CRM status, and notifies the assigned technician.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    Declines trigger alternative offers or manual follow-up tasks.
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Data captured for every chat</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {aiDataPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Smart reminder system</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  Automatic follow-ups keep customers engaged during longer repairs.
                </p>
                <div className="mt-4 space-y-4">
                  {reminderFlow.map((reminder) => (
                    <div
                      key={reminder.day}
                      className="rounded-lg border border-slate-200/60 dark:border-slate-800 p-4 bg-white/70 dark:bg-slate-950/40"
                    >
                      <p className="text-xs uppercase tracking-wider text-sky-600 dark:text-sky-300">
                        {reminder.day}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{reminder.focus}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{reminder.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Message templates library</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  Pre-built copy keeps responses consistent and on-brand.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {messageTemplates.map((template) => (
                    <li key={template} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <span>{template}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Technician prompt system</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  Everything a technician needs lives beside the conversation.
                </p>
                <div className="mt-4 space-y-4">
                  {technicianTools.map((tool) => (
                    <div
                      key={tool.title}
                      className="rounded-xl border border-slate-200/60 dark:border-slate-800 p-4 bg-white/70 dark:bg-slate-950/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                          <tool.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{tool.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{tool.description}</p>
                          <ul className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {tool.items.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="broadcast" className="py-16">
          <div className="rounded-3xl border border-sky-200/60 dark:border-slate-800 bg-gradient-to-br from-white/80 via-sky-50/80 to-emerald-50/80 dark:from-slate-950/80 dark:via-slate-900/80 dark:to-teal-900/50 p-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                2. WhatsApp Blaster with Anti-Ban
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Run mass messaging campaigns safely with human-like pacing, personalisation, and analytics.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blasterHighlights.map((highlight) => (
                <Card
                  key={highlight.title}
                  className="p-5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                      <highlight.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                        {highlight.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {highlight.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {campaignTools.map((tool) => (
                <Card
                  key={tool.title}
                  className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{tool.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{tool.description}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {tool.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
              <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Safety controls</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Keep your WhatsApp number in good standing.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {safetyControls.map((control) => (
                    <li key={control} className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-300 mt-0.5" />
                      <span>{control}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        <section id="pos" className="py-16">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            3. POS System & Repair Job Management
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-3xl">
            Manage the entire repair lifecycle: from sales and quotations to labour tracking, photo documentation, and after-service follow ups.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {posModules.map((module) => (
              <Card
                key={module.title}
                className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{module.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{module.description}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {module.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {inventoryModules.map((module) => (
              <Card
                key={module.title}
                className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{module.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{module.description}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {module.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <Card className="mt-8 p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Reporting & insights</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Understand performance across sales, repairs, and technicians.
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {reportingMetrics.map((metric) => (
                <li key={metric} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section id="crm" className="py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">4. Database CRM</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Built for PostgreSQL reliability with Supabase integration, yet flexible enough to run on SQLite for smaller deployments.
            </p>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Database choice</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    PostgreSQL is recommended for production reliability, complex queries, and backups. SQLite remains a lightweight option for kiosks or offline pilots.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Backup strategy</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Never lose critical repair history or invoices.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {backupStrategy.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <Card className="mt-8 p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Schema structure</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {crmTables.map((table) => (
                <div key={table.name} className="rounded-lg border border-slate-200/60 dark:border-slate-800 p-4 bg-white/60 dark:bg-slate-950/40">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{table.name}</h4>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {table.fields.map((field) => (
                      <li key={field} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
          <Card className="mt-8 p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Data maintenance</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Keep the database lean and compliant without manual chores.
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {dataMaintenance.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section id="ui" className="py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              5. Web UI & Experience
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Built with Next.js, shadcn/ui, and Tailwind CSS for a modern, responsive workspace tailored to repair teams.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {uiHighlights.map((feature) => (
              <Card
                key={feature.title}
                className="p-5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-8 p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Navigation structure</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-900/80 text-slate-100 text-xs sm:text-sm p-4 font-mono">
{navigationTree}
            </pre>
          </Card>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Key UI features</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {keyUiFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Settings workspace</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Configure the business without developer support.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {settingsOptions.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Accessibility</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {accessibilityPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section id="integrations" className="py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Integration flow</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Each module talks to the others so your team never double-enters data.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {integrationFlows.map((flow) => (
              <Card
                key={flow.title}
                className="p-5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                    <flow.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      {flow.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {flow.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="security" className="py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Security, deployment, and performance
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Voltura Service Hub is production-ready with hardened APIs, containerised services, and tuned performance.
            </p>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Security</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Shield customer data and business workflows.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {securityPillars.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Deployment</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Run in the cloud or on-prem with confidence.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {deploymentPillars.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <LineChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Performance</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Keep the experience fast, even at scale.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {performancePillars.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section id="demo" className="py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Live AI concierge demo</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Sign in to experience how Voltura handles customer questions, escalations, and follow-ups.
            </p>
          </div>
          <div className="mt-8">
            <SignedOut>
              <Card className="p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-center space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sign in to chat with the Voltura concierge bot.
                </p>
                <SignInButton>
                  <Button size="lg">Sign in to try the demo</Button>
                </SignInButton>
              </Card>
            </SignedOut>
            <SignedIn>
              <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-6">
                <Chat />
              </div>
            </SignedIn>
          </div>
        </section>

        <section className="py-20">
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-gradient-to-br from-sky-500/10 via-emerald-500/10 to-blue-500/10 dark:from-sky-500/20 dark:via-emerald-500/10 dark:to-blue-500/20 p-10 text-center space-y-6">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Ready to launch Voltura Service Hub?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Combine WhatsApp automation, repair CRM, and POS workflows into a single platform tailored for your technicians and customers.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="#whatsapp">Review WhatsApp AI flow</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">Try the live concierge</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
