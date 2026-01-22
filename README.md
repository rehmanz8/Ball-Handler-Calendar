# Circle Calendar

A shared calendar app powered by Next.js (App Router), Supabase, and Tailwind CSS. Create a Circle, invite anyone with a link, and manage shared week/day schedules with realtime updates.

## Features
- Circle-based shared calendars with invite links.
- Member profiles with display name, timezone, and color assignment.
- Week and day views with member filters and color legend.
- Realtime updates via Supabase Realtime.
- Weekly recurring events with start/end bounds.
- Host-managed membership removal and circle renaming.

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/DB/Auth/Realtime:** Supabase (Postgres, Auth, Realtime, RLS)
- **Validation:** Zod
- **Forms:** React Hook Form

## Supabase Setup
1. Create a new Supabase project.
2. Enable Email auth in **Authentication → Providers**.
3. Apply SQL migrations:
   - Open **SQL Editor** and run the migration in `supabase/migrations/001_init.sql`.
4. Copy your project URL and anon key.

## Environment Variables
Create a `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Running Locally
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Deploying to Vercel
1. Push this repo to GitHub.
2. Import into Vercel.
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Notes
- Event timestamps are stored in UTC in the database.
- Recurring events are expanded client-side within the visible date range.
- Removing a member automatically removes their events via a database trigger.
