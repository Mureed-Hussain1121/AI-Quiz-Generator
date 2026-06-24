# AI Quiz Generator - Fix Report

## Main issues found

1. **Tailwind CSS was not being compiled**
   - `globals.css` had Tailwind directives.
   - `tailwind.config.ts` existed.
   - But `postcss.config.js` was missing, so Tailwind processing could fail and the UI could appear unstyled.

2. **The zip included `node_modules` and `.next`**
   - These folders should not be shared in a project zip.
   - They contain platform-specific binaries. The uploaded project had Windows Next.js/Prisma binaries, which fail on other machines.
   - Fix: the cleaned zip excludes `node_modules`, `.next`, and `.env`.

3. **TypeScript build errors**
   - Prisma JSON fields were being assigned plain arrays/null values in ways TypeScript rejected.
   - The toast hook referenced an unassigned `dispatch` variable.
   - The results page needed a safe cast from Prisma JSON to the attempt-answer type.

4. **ESLint configuration was missing**
   - `npm run lint` could not run because there was no ESLint config.

5. **Local development required Supabase storage**
   - The storage code created the Supabase client at module load time, so missing Supabase env vars could break upload-related routes.
   - Fix: storage now uses local disk storage by default and Supabase only when Supabase env vars are provided.

6. **Google OAuth was required even when not configured**
   - Google provider was registered with empty strings.
   - Fix: Google login is now included only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.

7. **Sensitive/local files were included**
   - `.env` should not be shared or committed.
   - Fix: added `.gitignore` and `.env.example`.

## Validation performed

The following checks passed after fixes:

```bash
npx tsc --noEmit --pretty false
npx eslint . --ext .ts,.tsx --max-warnings=0
npm run lint
npx tailwindcss -c tailwind.config.ts -i src/app/globals.css -o /tmp/ai-quiz-tailwind.css --minify
```

`npm run build` could not be completed inside this sandbox because the uploaded zip contained Windows-only Next.js SWC binaries and the sandbox has no internet to download Linux SWC. This is exactly why `node_modules` must be deleted and reinstalled fresh on the target machine.

## How to run the fixed project locally

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Then open:

```text
http://localhost:3000
```

Minimum required `.env` values for core local testing:

```env
DATABASE_URL=your_postgres_database_url
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_long_random_secret
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
LOCAL_UPLOAD_DIR=uploads/pdfs
```

Supabase storage is now optional for local development. If you do not configure Supabase, PDFs are saved locally in `uploads/pdfs`.

Stripe is only required for payment testing. Google OAuth is only required if you want Google login.
