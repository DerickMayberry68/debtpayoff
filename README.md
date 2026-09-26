# Mayberry Debt Payoff

Household credit-card payoff tracker. Vite + React + TypeScript, Supabase (Postgres, magic-link auth, realtime), hosted on Vercel.

## 1. Supabase
1. Create a project (free tier is fine).
2. Open `supabase/migrations/001_debt_tracker.sql`, replace `WIFE_EMAIL_HERE` with her email, then paste the whole file into **SQL Editor** and run it.
   It creates the tables, row-level security (only emails in `household_members` can read/write), a trigger that adjusts card balances when payments are logged or removed, realtime, and seeds the 9 cards.
3. **Authentication > URL Configuration**
   - Site URL: your Vercel URL (e.g. `https://debt-payoff.vercel.app`)
   - Redirect URLs: add the Vercel URL and `http://localhost:5173`
4. Optional hardening: once you've both signed in once, turn off **Allow new users to sign up** (Authentication > Sign In / Providers). RLS already blocks outsiders from the data either way.

## 2. Local dev
```
cp .env.example .env.local   # fill in URL + anon/publishable key (Project Settings > API)
npm install
npm run dev
```

## 3. Vercel
Import the repo, framework preset **Vite** (build `npm run build`, output `dist`), and add the env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## How the plan works
- Monthly budget = sum of each card's original minimum + the "extra" amount (stored in `plan_settings`).
- Every open card gets its minimum; everything left goes to cards in `sort_order` (hybrid: two small cards first, then highest APR).
- Paid-off cards' minimums roll into the pool automatically.
- APRs marked `est` are guesses; enter the real APR on each card ("Update from statement") and the projection updates.
- Logging a payment lowers the balance (DB trigger). When a statement posts, update the balance to include interest.

To change the attack order, edit `sort_order` in the `cards` table.
