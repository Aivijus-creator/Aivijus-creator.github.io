# SquadGoals: daily habit tracker with a squad leaderboard

Track daily habits, earn EXP, level up, and compete with friends on a live leaderboard.
Accounts, progress and the leaderboard are stored in [Supabase](https://supabase.com).

The published app is the single self-contained file `../squadgoals.html`
(live at https://aivijus-creator.github.io/squadgoals.html once merged to `main`).

## One-time setup (about 5 minutes)

1. **Create a Supabase project** at https://supabase.com (the free tier is plenty).
2. **Create the tables and security rules:** open *SQL Editor → New query*, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) and click *Run*. It is safe to run again.
3. **Connect the app:** in *Project Settings → API* copy the **Project URL** and the
   **anon / publishable** key, and paste them into the `SQUADGOALS_CONFIG` block near the top of
   `squadgoals.html` (and of `squadgoals-src/index.html`, so rebuilds keep them):

   ```html
   <script>
     window.SQUADGOALS_CONFIG = {
       supabaseUrl: "https://abcd1234.supabase.co",
       supabaseAnonKey: "eyJhbGciOi… or sb_publishable_…"
     };
   </script>
   ```

   The anon key is designed to be public. Row Level Security keeps the data safe.
   **Never** use the `service_role` / secret key (the app refuses it).
4. **Auth settings** (*Authentication → URL Configuration*): set *Site URL* to
   `https://aivijus-creator.github.io/squadgoals.html` so email-confirmation links come back to the app.
   For a private friend group you can also turn off *Confirm email* under
   *Authentication → Providers → Email*, so new accounts can sign in straight away.

## How it works

| Table | Who can read | Who can write | Holds |
| --- | --- | --- | --- |
| `profiles` | every signed-in user | only the owner (own row) | display name, total EXP, today's EXP |
| `user_progress` | only the owner | only the owner | habits, history, daily EXP claims |

- Signed-out visitors can't read either table.
- A profile row is created automatically at sign-up (database trigger), using the display name from the sign-up form.
- The leaderboard subscribes to Supabase Realtime on `profiles`, so friends' EXP updates appear live.
  If realtime is unavailable it falls back to refreshing every 30 seconds.
- Progress saved by the earlier, sign-in-free version in the same browser is moved into the first account that signs in there.

### EXP rules

- **+20 EXP per habit, once per calendar day**, on its first check that day.
- **+100 EXP full-day bonus**, once per day, the first time every habit is checked.
- **Unchecking never removes EXP or levels** (misclick protection).
- **Re-checking a habit that already paid today gives nothing** (no double-dipping).
- Claims reset at local midnight.

RLS guarantees nobody can change someone else's data. A user could still write arbitrary numbers
to their *own* profile through the API, so this is built for friends, not for prize money.

## Development

```bash
npm install          # or: bun install
npm run dev          # http://localhost:3000
npm run lint         # type-check
npm run publish:html # build and copy the single file to ../squadgoals.html
```

For local development you can also put the connection in `.env.local`
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) or paste it into the setup screen,
which saves it in that browser only.
