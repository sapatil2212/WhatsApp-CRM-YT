# ⚡ ChatNexGen Ai

> The ultimate self-hostable CRM and no-code automation engine built for the official WhatsApp Business (Cloud) API. Empower your team with a real-time shared inbox, contact segmentation, visual Kanban pipelines, automated broadcasts, and an autonomous AI Healthcare Assistant.

---

## 🚀 Key Modules & Features

### 📥 Real-Time Shared Inbox
- **Multi-Agent Collaboration:** Connect one official WhatsApp number and let your entire customer support and sales teams collaborate under a single interface.
- **Thread Assignment:** Assign conversations to specific agents, transition states, and add internal collaborator notes to avoid customer collision.
- **Media Support:** Seamlessly send and receive text, images, documents, audio, and interactive buttons.

### 📊 Visual Kanban Pipelines
- **Design for Chat:** Drag-and-drop deals linked directly to active WhatsApp conversations.
- **Value Tracking:** Define pipeline stages, assign monetary values to deals, and track your total pipeline value in real-time.
- **Quick-Actions:** Trigger status updates or send template messages directly from the pipeline view.

### 📢 Targeted Broadcast Campaigns
- **Meta-Approved Templates:** Schedule or instantly dispatch broadcast campaigns to custom lists.
- **Dynamic Variable Substitution:** Personalize messages with client-specific custom fields.
- **Analytics Dashboard:** Track precise delivery rates, read rates, and quick-reply button clicks.

### 🔌 No-Code Flow & Automation Builder
- **Visual Node Builder:** Create complex automation trees with triggers like incoming keywords, contact registration, or schedule events.
- **Conditional Logic:** Branch flows based on contact tags, custom fields, or business hours.
- **Action Nodes:** Trigger custom webhooks, assign tags, send template follow-ups, or insert wait steps.

### 🏥 Autonomous AI Healthcare Assistant
- **Dual AI Engine:** Leverages **Google Gemini 1.5/2.0 Flash** as the primary responder with an automatic failover to **OpenAI GPT-4o-Mini** (or OpenRouter) via a built-in circuit breaker.
- **Strict 4-Step Appointment Booking Flow:**
  1. *Patient Details:* Collects patient name, age, and reason for visit in a single step.
  2. *Doctor Selection:* Presents available specialist options.
  3. *Dynamic Slot Calculation:* Reads real-time doctor schedules, clinic timings, and exceptions, presenting only open times (automatically filtering out lunch breaks and existing bookings).
  4. *Confirmation:* Finalizes details and logs the appointment.
- **Google Sheets Sync:** Integrates with Google Sheets using a secure webhook Script to automatically log booked visits in real-time.
- **Strict Guardrails:** Programmed to never diagnose conditions, never recommend/prescribe medications, bypasses HTML in responses, and triggers instant human agent handover upon detecting emergency or escalation keywords.

---

## 🛠️ Technological Stack

- **Frontend Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion (smooth page transitions and animations), Lucide Icons
- **Database & Backend:** Supabase (Postgres, Auth, Realtime listeners, Storage, Row-Level Security)
- **WhatsApp Gateway:** Meta WhatsApp Cloud API (compliant integration to prevent number bans)

---

## ⚙️ Environment Configuration

To run the application, copy the example environment template:
```bash
cp .env.local.example .env.local
```

### Required Configuration

| Key | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (must remain secret, used for webhook verification and cron triggers). |
| `ENCRYPTION_KEY` | 64 hex characters (32 bytes) used for encrypting WhatsApp API credentials. |
| `META_APP_SECRET` | Used to verify HMAC signatures of incoming WhatsApp webhook events. |

### Optional AI Healthcare Configuration

| Key | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key (required for AI auto-replies). |
| `OPENAI_API_KEY` | OpenAI/OpenRouter API key (fallback responder if Gemini hits rate limits or error thresholds). |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Web App URL for the Apps Script (logs and syncs booked appointments in Google Sheets). |
| `AUTOMATION_CRON_SECRET` | Secret to secure automation cron routes. |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sapatil2212/WhatsApp-Automation-CRM-V2.git
cd WhatsApp-Automation-CRM-V2
npm install
```

### 2. Configure Your Database
Run the SQL migration scripts located in [supabase/migrations](file:///e:/Full%20Stack%20Projects/WhatsApp-CRM-2/supabase/migrations) on your Supabase instance to set up all tables, relationships, and triggers:
- Apply initial schema, pipelines, broadcasts, and automation engines.
- Apply AI Healthcare schema and RLS policies (`013_ai_healthcare.sql` to `019_add_reminders_4h_2h.sql`).

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## 📂 Project Structure

```
├── docs/                      # Google Sheets apps scripts and offline documentation
├── src/
│   ├── app/                   # Next.js page layout and API routing
│   │   ├── (auth)/            # Login, Registration, Password resets
│   │   ├── (dashboard)/       # Dashboard, Shared Inbox, Contacts, Pipelines, Flows, AI Healthcare
│   │   └── (marketing)/       # Landing and product marketing pages
│   ├── components/            # Shared UI components and layout widgets
│   ├── context/               # Global React context providers
│   ├── hooks/                 # Reusable React hooks
│   ├── lib/                   # Meta WhatsApp API helper functions, caching tools, and utilities
│   ├── services/              # AI Healthcare processing services
│   └── types/                 # TypeScript type declarations
├── supabase/
│   └── migrations/            # SQL database migration files
```

---

## 📄 License

This project is licensed under the [MIT License](file:///e:/Full%20Stack%20Projects/WhatsApp-CRM-2/LICENSE) — feel free to customize, host, and white-label it for your own business or clients.
