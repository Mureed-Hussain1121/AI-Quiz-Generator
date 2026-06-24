# AI Quiz Generator from PDF

A production-ready SaaS platform that converts PDF documents into AI-generated quizzes using Google Gemini AI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (Email + Google OAuth) |
| AI | Google Gemini 1.5 Flash (configurable) |
| Storage | Supabase Storage |
| Payments | Stripe Subscriptions |
| Deployment | Vercel + Neon/Supabase PostgreSQL |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (marketing)/
│   │   ├── page.tsx                  # Landing page
│   │   ├── pricing/page.tsx
│   │   ├── terms/page.tsx
│   │   └── privacy/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── quiz/
│   │   │   ├── page.tsx              # Quiz list
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Quiz detail
│   │   │       ├── attempt/page.tsx  # Attempt mode
│   │   │       └── results/[attemptId]/page.tsx
│   │   ├── account/page.tsx
│   │   └── admin/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/register/route.ts
│       ├── auth/me/route.ts
│       ├── pdf/route.ts              # Upload + list
│       ├── pdf/[id]/route.ts         # Get + delete
│       ├── quiz/generate/route.ts    # AI generation
│       ├── quiz/route.ts             # List
│       ├── quiz/[id]/route.ts        # CRUD
│       ├── quiz/[id]/attempt/route.ts
│       ├── payment/create-checkout-session/route.ts
│       ├── payment/webhook/route.ts
│       ├── payment/cancel-subscription/route.ts
│       ├── payment/subscription-status/route.ts
│       └── admin/stats/route.ts
│           admin/users/route.ts
│           admin/users/[id]/route.ts
├── components/
│   ├── layout/Navbar.tsx
│   ├── layout/Footer.tsx
│   ├── ui/                           # Shadcn components
│   ├── dashboard/UsageCard.tsx
│   ├── quiz/QuizCard.tsx
│   └── admin/AdminUserTable.tsx
├── lib/
│   ├── prisma.ts                     # DB singleton
│   ├── auth.ts                       # NextAuth config
│   ├── stripe.ts                     # Stripe helpers
│   ├── usage.ts                      # Plan limits
│   ├── rate-limit.ts                 # In-memory rate limiter
│   ├── api-helpers.ts                # requireAuth, apiSuccess, apiError
│   ├── ai/
│   │   ├── types.ts                  # AIProvider interface
│   │   ├── prompt.ts                 # Prompt engineering
│   │   ├── gemini.ts                 # Gemini provider
│   │   └── provider.ts               # Provider factory
│   ├── pdf/extract.ts                # pdf-parse wrapper
│   ├── storage/supabase.ts           # Supabase Storage
│   └── validations/                  # Zod schemas
├── types/
│   ├── next-auth.d.ts                # Session type augmentation
│   └── quiz.ts                       # Domain types
└── middleware.ts                     # Route protection
prisma/
├── schema.prisma
└── seed.ts
```

---

## Part 1: Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud)
- A Google Cloud project (for Gemini API + OAuth)
- A Supabase project (for storage)
- A Stripe account (for payments)

---

### Step 1: Clone and install

```bash
git clone <your-repo-url> ai-quiz-generator
cd ai-quiz-generator
npm install
```

---

### Step 2: Environment variables

```bash
cp .env.example .env.local
```

Fill in every variable in `.env.local`:

#### Database (Neon or local PostgreSQL)
```
DATABASE_URL="postgresql://user:pass@host:5432/ai_quiz_db?sslmode=require"
```

**Option A — Local PostgreSQL:**
```bash
createdb ai_quiz_db
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_quiz_db"
```

**Option B — Neon (free tier):**
1. Go to https://neon.tech
2. Create a project, copy the connection string

---

#### NextAuth
```
NEXTAUTH_SECRET="openssl rand -base64 32"   # run this command and paste output
NEXTAUTH_URL="http://localhost:3000"
```

---

#### Google OAuth (for Google sign-in)
1. Go to https://console.cloud.google.com
2. Create a project → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret

```
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

#### Google Gemini API
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key (free quota: 15 requests/minute)

```
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIza..."
GEMINI_MODEL="gemini-1.5-flash"
```

---

#### Supabase Storage
1. Go to https://supabase.com → New Project
2. Go to Settings → API
3. Copy Project URL and Service Role key (not anon key!)
4. The bucket will be auto-created on first upload

```
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_BUCKET_NAME="pdfs"
```

---

#### Stripe
1. Go to https://dashboard.stripe.com
2. Copy test keys from Developers → API Keys
3. Create two products: monthly ($9/mo) and yearly ($79/yr)
4. Copy the Price IDs (start with `price_`)

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # Set after step 6
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

#### App config
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_MAX_SIZE_MB="10"
FREE_PDF_UPLOADS_PER_MONTH="3"
FREE_QUIZ_GENERATIONS_PER_MONTH="5"
FREE_MAX_QUESTIONS="10"
PREMIUM_PDF_UPLOADS_PER_MONTH="50"
PREMIUM_QUIZ_GENERATIONS_PER_MONTH="100"
PREMIUM_MAX_QUESTIONS="100"
```

---

### Step 3: Database setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# OR run migrations (production-ready)
npm run db:migrate

# Seed with admin user
npm run db:seed
```

After seeding:
- Admin: `admin@quizai.com` / `Admin123!`
- Demo: `demo@quizai.com` / `Demo123!`

---

### Step 4: Stripe webhook (local)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
stripe login
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Copy the `whsec_...` key printed to terminal → set as `STRIPE_WEBHOOK_SECRET`

---

### Step 5: Run development server

```bash
npm run dev
```

Open http://localhost:3000

---

## Part 2: Production Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/ai-quiz-generator.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables from `.env.local` — but update:
   - `NEXTAUTH_URL` → your Vercel URL, e.g. `https://quizai.vercel.app`
   - `NEXT_PUBLIC_APP_URL` → same Vercel URL
   - `DATABASE_URL` → your production DB (Neon recommended)

5. Deploy!

### Step 3: Production Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-vercel-url.vercel.app/api/payment/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy signing secret → set as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 4: Update Google OAuth redirect

In Google Cloud Console → Credentials → Your OAuth Client:
- Add: `https://your-vercel-url.vercel.app/api/auth/callback/google`

### Step 5: Run migrations in production

```bash
# Install Vercel CLI
npm i -g vercel

# Pull production env vars locally
vercel env pull .env.production.local

# Run migrations against production DB
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

---

## Part 3: AI Provider Switching

Switch AI provider by changing `.env.local`:

```bash
# Use OpenAI
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"

# Use Groq (fast + free tier)
AI_PROVIDER="groq"
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.1-70b-versatile"

# Use OpenRouter (access 100+ models)
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="google/gemini-flash-1.5"
```

No code changes needed — the factory in `src/lib/ai/provider.ts` handles routing.

---

## Part 4: Security Overview

| Threat | Mitigation |
|---|---|
| SQL Injection | Prisma ORM parameterized queries |
| XSS | Next.js auto-escapes JSX |
| CSRF | NextAuth CSRF tokens |
| Auth bypass | `requireAuth()` on every API route |
| Unauthorized data access | Owner checks on every resource |
| File upload attacks | Magic bytes check + MIME validation + size limit |
| AI abuse | Rate limiting (10 generations/10 min) + monthly quotas |
| Stripe webhook spoofing | Webhook signature verification |
| Password exposure | bcrypt cost 12, never returned to client |
| Env secrets | Server-only vars, never prefixed with NEXT_PUBLIC_ |
| Account takeover | Disabled check on JWT refresh |

---

## Part 5: Testing Checklist

### Auth
- [ ] Register with email + password
- [ ] Login with email + password
- [ ] Login with Google OAuth
- [ ] Disabled account cannot login
- [ ] Protected routes redirect to /login when not authenticated

### PDF Upload
- [ ] Upload a valid PDF
- [ ] Reject non-PDF files
- [ ] Reject files over size limit
- [ ] Reject empty PDFs
- [ ] Free user blocked at upload limit

### Quiz Generation
- [ ] Generate MCQ quiz
- [ ] Generate True/False quiz
- [ ] Generate Short Answer quiz
- [ ] Premium user generates Mixed quiz
- [ ] Free user blocked from explanations
- [ ] Free user blocked at question limit
- [ ] Rate limit triggers after 10 requests
- [ ] Monthly quota blocks generation after limit

### Quiz Attempt
- [ ] Attempt a quiz end to end
- [ ] Submit with unanswered questions
- [ ] Score calculated correctly
- [ ] Results page shows correct/incorrect
- [ ] Explanations shown for premium quizzes

### Payments
- [ ] Checkout session created
- [ ] Webhook updates subscription status
- [ ] Premium features unlock after upgrade
- [ ] Cancel subscription works
- [ ] Cancelled user loses premium features

### Admin
- [ ] Admin can view stats
- [ ] Admin can disable a user
- [ ] Admin cannot disable themselves
- [ ] Non-admin cannot access /admin

---

## Part 6: Future Improvements

1. **OCR Support** — Integrate Tesseract.js or AWS Textract for scanned PDFs
2. **Quiz Export to PDF** — Use Puppeteer or react-pdf to generate PDF exports
3. **Team/Classroom** — Add team workspaces for educators
4. **Quiz Embeds** — Embeddable quiz widget via iframe
5. **LMS Integration** — Export to SCORM for Moodle/Canvas
6. **Leaderboards** — Competitive scoring for shared quizzes
7. **Spaced Repetition** — SM-2 algorithm for flashcard mode
8. **Analytics Dashboard** — Charts for attempt history, topic weaknesses
9. **Email Notifications** — Quiz completion reports, monthly usage summaries
10. **Mobile App** — React Native with Expo using the same REST API
11. **Redis Rate Limiting** — Replace LRU cache with Redis for multi-instance deployments
12. **Webhook Retry Queue** — BullMQ for reliable Stripe webhook processing
13. **CDN for Signed URLs** — Cache Supabase signed URLs at the edge
14. **Multi-language UI** — i18n with next-intl
