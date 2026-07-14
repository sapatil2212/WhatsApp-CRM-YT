# 🚀 WhatsApp CRM — Complete Setup Guide

A step-by-step guide to get the project running locally and connect it to the Meta WhatsApp Cloud API.

---

## 📋 Prerequisites

Before starting, make sure you have the following installed and ready:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | ≥ 20.0.0 | [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 10.x (ships with Node 20) | Included with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

You also need accounts on:

- **[Supabase](https://supabase.com)** — free tier is sufficient to start
- **[Meta for Developers](https://developers.facebook.com)** — to create a WhatsApp Business App
- **[Google AI Studio](https://aistudio.google.com)** *(optional)* — for the AI Healthcare assistant
- **[OpenAI](https://platform.openai.com)** *(optional)* — AI fallback provider

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/sapatil2212/WhatsApp-CRM-YT.git
cd WhatsApp-CRM-YT
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

> This installs all packages listed in `package.json`, including Next.js 16, React 19, Supabase client, Framer Motion, and more. It may take 1–2 minutes.

---

## Step 3 — Set Up Supabase

### 3a. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Choose an **Organization**, enter a **Project Name**, set a strong **Database Password**, and select a **Region** close to your users.
4. Click **Create New Project** and wait ~2 minutes for provisioning.

### 3b. Get Your API Keys

1. In your Supabase project, go to **Project Settings → API**.
2. Copy the following values — you'll need them in Step 5:

| Value | Where to find it |
|-------|-----------------|
| **Project URL** | `Project Settings → API → Project URL` |
| **Anon / Public Key** | `Project Settings → API → Project API Keys → anon public` |
| **Service Role Key** | `Project Settings → API → Project API Keys → service_role` ⚠️ Keep secret |

### 3c. Run the Database Migrations

The project ships with 26 SQL migration files that create all tables, relationships, triggers, and Row-Level Security policies.

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Run each file in order from `supabase/migrations/`:

```
001_initial_schema.sql        ← Core tables (profiles, contacts, conversations, messages)
002_pipelines_enhancements.sql
003_broadcast_recipient_wamid.sql
004_contact_delete_set_null.sql
005_broadcast_counts_incremental.sql
006_automations.sql
007_automations_increment_counter.sql
008_profile_avatars_storage.sql
009_message_actions.sql
010_flows.sql
011_profile_beta_features.sql
012_flows_increment_counter.sql
013_ai_healthcare.sql         ← AI Healthcare module tables
014_appointment_reminders.sql
015_healthcare_rls_fix.sql
016_healthcare_followups.sql
017_appointment_patient_details.sql
018_portfolio_showcase.sql
019_add_reminders_4h_2h.sql
020_add_business_info_to_profiles.sql
021_add_booking_state_to_conversations.sql
022_ai_business_profiles.sql
023_multi_tenant_foundation.sql  ← Multi-tenant architecture
024_add_tenant_id_to_existing_tables.sql
025_tenant_configurations.sql
026_multi_tenant_child_tables_rls.sql
```

> **Tip:** Paste the contents of each `.sql` file into the SQL Editor and click **Run**. Do them **one at a time**, in order, to avoid dependency errors.

### 3d. Configure Supabase Auth

1. Go to **Authentication → URL Configuration** in your Supabase dashboard.
2. Set **Site URL** to `http://localhost:3000` (for local development).
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

---

## Step 4 — Set Up Your Meta WhatsApp App

### 4a. Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps → Create App**.
3. Select **Business** as the app type and click **Next**.
4. Fill in the app name and contact email, then click **Create App**.

### 4b. Add the WhatsApp Product

1. On your App Dashboard, find **WhatsApp** and click **Set Up**.
2. Follow the setup wizard to connect a **WhatsApp Business Account (WABA)**.
3. Add a **test phone number** or verify your business number.

### 4c. Get Your Credentials

Navigate to **WhatsApp → API Setup** in your app dashboard and collect:

| Value | Location |
|-------|----------|
| **Phone Number ID** | Shown under "From" on the API Setup page |
| **WhatsApp Business Account ID** | Shown on the API Setup page |
| **Temporary / Permanent Access Token** | Generate under the token section |

Navigate to **App Settings → Basic** to collect:

| Value | Location |
|-------|----------|
| **App Secret** | App Settings → Basic → App Secret (click "Show") |

### 4d. Configure the Webhook

After the app is running and publicly accessible (e.g., via ngrok for local dev):

1. In **WhatsApp → Configuration**, click **Edit** next to Webhook.
2. Set **Callback URL** to: `https://your-domain.com/api/webhook`
3. Set **Verify Token** to any random string (you'll enter it in the app's Settings → WhatsApp later).
4. Under **Webhook Fields**, enable: `messages`
5. Click **Verify and Save**.

> **Local Development Webhook:** Use [ngrok](https://ngrok.com) to expose localhost:
> ```bash
> ngrok http 3000
> ```
> Use the `https://xxxx.ngrok.io` URL as your Callback URL.

---

## Step 5 — Configure Environment Variables

### 5a. Copy the example file

```bash
# Windows
copy .env.local.example .env.local

# macOS / Linux
cp .env.local.example .env.local
```

### 5b. Fill in your values

Open `.env.local` and set the following:

```env
# ── REQUIRED ────────────────────────────────────────────────────────
# Supabase (from Step 3b)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp credential encryption key (32 random bytes as 64 hex chars)
# Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-hex-char-encryption-key

# Meta App Secret (from Step 4c)
META_APP_SECRET=your-meta-app-secret

# ── RECOMMENDED ──────────────────────────────────────────────────────
# The public URL of your deployment (no trailing slash)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ── OPTIONAL — AI Healthcare ─────────────────────────────────────────
# Google Gemini (primary AI engine)
GEMINI_API_KEY=your-gemini-api-key

# OpenAI (fallback AI engine)
OPENAI_API_KEY=your-openai-api-key

# ── OPTIONAL — Automations Cron ──────────────────────────────────────
# Required only if you use Wait steps in Automations
# Generate with:  openssl rand -hex 32
# AUTOMATION_CRON_SECRET=your-long-random-secret

# ── OPTIONAL — Google Sheets Sync ────────────────────────────────────
# GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

> ⚠️ **Never commit `.env.local` to git.** It is already listed in `.gitignore`.

---

## Step 6 — Generate the Encryption Key

If you haven't already, generate a secure 32-byte encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters) into `ENCRYPTION_KEY` in your `.env.local`.

---

## Step 7 — Run the Development Server

```bash
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

You should see the marketing/landing page. Navigate to `/auth/login` to create your first account.

---

## Step 8 — Connect Your WhatsApp Number (In-App)

Once logged in:

1. Go to **Settings → WhatsApp Settings** from the sidebar.
2. Enter your:
   - **Phone Number ID** (from Step 4c)
   - **WhatsApp Business Account ID** (from Step 4c)
   - **Access Token** (from Step 4c)
   - **Webhook Verify Token** (the string you chose in Step 4d)
3. Click **Save Settings**.

The app will encrypt your token using the `ENCRYPTION_KEY` and store it securely.

---

## Step 9 — Verify the Webhook

1. Make sure your dev server is running and publicly accessible (via ngrok or a deployed URL).
2. In the Meta Developer Console (**WhatsApp → Configuration**), click **Verify and Save** on your webhook.
3. Send a test message to your WhatsApp number — it should appear in the **Inbox** within seconds.

---

## Step 10 — (Optional) Enable AI Healthcare Assistant

1. Get a **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey) — it's free to start.
2. Add it to `.env.local`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   ```
3. Restart the dev server: `npm run dev`
4. Navigate to **Settings → AI Healthcare** to configure your business profile, doctors, clinic hours, and specialties.

---

## Step 11 — (Optional) Set Up Google Sheets Sync

To automatically log booked appointments to a Google Sheet:

1. Create a new **Google Sheet**.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `docs/google-sheets-script.js`.
4. Click **Deploy → New Deployment**, set:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Copy the `/exec` deployment URL.
6. Add it to `.env.local`:
   ```env
   GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

---

## Step 12 — (Optional) Automate Cron Triggers

If you use **Wait** steps in automations, you need a cron pinger to process pending executions:

1. Add a cron secret to `.env.local`:
   ```env
   AUTOMATION_CRON_SECRET=your-long-random-secret
   ```
2. Set up an external cron job (e.g., [cron-job.org](https://cron-job.org), GitHub Actions, or your hosting platform) to call:
   ```
   GET https://your-domain.com/api/automations/cron
   Authorization: Bearer your-long-random-secret
   ```
   Recommended interval: **every 1 minute**.

---

## 🏗️ Project Structure

```
WhatsApp-CRM-YT/
├── docs/                      # Google Sheets Apps Script
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Register, Password Reset
│   │   ├── (dashboard)/       # Inbox, Contacts, Pipelines, Broadcasts, Flows, AI Healthcare
│   │   ├── (marketing)/       # Landing page
│   │   └── api/               # API routes (webhook, automations, healthcare, auth)
│   ├── components/            # Reusable UI components
│   ├── context/               # React context providers (auth, realtime)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Meta API helpers, encryption, utilities
│   ├── services/              # AI Healthcare processing services
│   └── types/                 # TypeScript type definitions
├── supabase/
│   └── migrations/            # 26 ordered SQL migration files
├── .env.local.example         # Environment variable template
├── SETUP.md                   # This guide
└── package.json
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server (after build) |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run unit tests with Vitest |
| `npm run format` | Auto-format code with Prettier |

---

## ❓ Troubleshooting

### App starts but shows a blank/error page
- Check that all **Required** env vars in `.env.local` are filled in.
- Make sure the Supabase migrations were all applied in order.
- Check the terminal console for error messages.

### Webhook verification fails
- Confirm your server is publicly accessible (use ngrok for local dev).
- The **Verify Token** in the Meta console must exactly match what you entered in **Settings → WhatsApp Settings** inside the app.
- Ensure the webhook URL is `https://your-domain.com/api/webhook` (not `/api/webhooks`).

### Messages not appearing in Inbox
- Verify `META_APP_SECRET` in `.env.local` matches your Meta App Secret exactly.
- Check that the **messages** webhook field is subscribed in the Meta console.
- Look at server logs for any HMAC signature errors.

### AI auto-replies not working
- Confirm `GEMINI_API_KEY` (or `OPENAI_API_KEY`) is set and valid.
- Restart the dev server after adding new env vars.
- Check the AI Healthcare module is enabled in **Settings → AI Healthcare**.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Feel free to customize, self-host, and white-label it.
