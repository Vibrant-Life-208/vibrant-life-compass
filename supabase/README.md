# Supabase activation - Hero's Compass

The app runs on browser localStorage by default. To activate Supabase as the shared backend (cross-device, multi-learner), follow these steps. No code changes required - everything is runtime-configurable.

---

## What's wired

- `schema.sql` - all 14 tables + RLS policies + triggers
- `../js/backend/local-store.js` - localStorage backend (default)
- `../js/backend/supabase-adapter.js` - Supabase backend, same 57-function API
- `../js/backend/config.js` - the switch, reads from `window.__HC_RUNTIME_CONFIG__`
- `../js/store.js` - thin dispatcher; flips backends at module init

To activate Supabase: drop a `config.runtime.js` at the repo root containing the URL + anon key. That's it. Vercel deploys generate this file from env vars at build time. Locally, create the file by hand.

---

## Step 1 - Create the Supabase project

1. Sign up at https://supabase.com (free tier covers 80+ users easily)
2. Create a project, name it `vibrant-life-compass`
3. Pick a region close to your users (West US 1 is fine for Idaho)
4. **CRITICAL:** Go to Authentication -> Providers -> Email and **uncheck "Confirm email"**. Hero's Compass uses synthetic emails (`heroname@vibrantlife.local`) that nobody can confirm. Without this setting, sign-up will fail.
5. Wait ~2 minutes for provisioning to finish

## Step 2 - Run the schema

1. In the Supabase dashboard, open SQL Editor (left sidebar)
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**. Should complete in ~2 seconds.
4. Verify by running:
   ```sql
   select tablename from pg_tables where schemaname = 'public' order by tablename;
   ```
   You should see 14 tables.

## Step 3 - Seed the founding guide account

The first sign-in needs to work on a fresh deploy. Since no accounts exist yet, you cannot use the in-app bulk import to create the first guide. So we create it manually.

1. In the Supabase dashboard, go to **Authentication -> Users -> Add User**
2. Email: pick the hero name you want for the founding guide. Use the synthetic-email format: `<heroname>@vibrantlife.local`. For example: `captain-vl@vibrantlife.local`
3. Password: pick a strong one. **Write it down.** This is what you'll use to sign in to the deployed app.
4. Check **Auto Confirm User** (skip email verification)
5. Click Create User. The new user's UUID will appear in the user list.
6. Copy that UUID.
7. Open SQL Editor and run:
   ```sql
   insert into profiles (id, role, name, email)
   values (
     '<paste-the-uuid-here>',
     'guide',
     'Vibrant Life Captain',
     'captain-vl@vibrantlife.local'
   );
   ```
   Replace `'captain-vl'` and `'Vibrant Life Captain'` with whatever values you used.

Now you have one guide account. The first deployed page-load can sign in as this guide and bulk-import the full Vibrant Life roster.

## Step 4 - Note your project credentials

In Supabase dashboard: **Settings -> API**

Copy these two values:
- **Project URL** - looks like `https://abcdefgh.supabase.co`
- **anon public** key - long JWT starting with `eyJ...`

These get plugged into the Vercel deploy in Step 6. The `service_role` key on this page is **never** for the app - keep it private.

## Step 5 - Test locally (optional but recommended)

Before deploying, verify the wiring locally. Create a file `config.runtime.js` at the repo root (gitignored, never commit):

```js
window.__HC_RUNTIME_CONFIG__ = {
  BACKEND_TYPE: 'supabase',
  SUPABASE_URL: 'https://abcdefgh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...',
};
```

Reload the local dev server. The app should:
- Default-role L/P/G buttons should be hidden (production mode)
- Sign in as `captain-vl` with the password you set in Step 3
- Land on the guide dashboard with admin tools

If sign-in fails: double-check the email confirmation setting (Step 1.4) and the profile row insert (Step 3.7).

Delete `config.runtime.js` after testing if you want the local dev server to go back to localStorage mode.

## Step 6 - Deploy to Vercel

On the Vercel project for Vibrant Life:

1. In Vercel project settings -> Environment Variables, add:
   - `BACKEND_TYPE` = `supabase`
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon key
2. Add a build step that writes `config.runtime.js` from these env vars. In Vercel project settings -> Build & Output, set the **Build Command** to:
   ```sh
   echo "window.__HC_RUNTIME_CONFIG__ = { BACKEND_TYPE: '$BACKEND_TYPE', SUPABASE_URL: '$SUPABASE_URL', SUPABASE_ANON_KEY: '$SUPABASE_ANON_KEY' };" > config.runtime.js
   ```
3. Trigger a deploy. The build output should include `config.runtime.js` alongside `index.html`.

## Step 7 - Bulk-import the roster

After deploy:

1. Open the deployed URL
2. Sign in as `captain-vl` (or whatever founding guide you created)
3. Open the Guide dashboard -> Bulk import (CSV)
4. Paste the roster CSV (the format is documented in the import modal)
5. Submit. The app creates each account via the `adminCreateAccount` path: signUp + profile + learner/parent insert + signOut, in a loop. For ~70 rows, this takes ~30 seconds.
6. Capture the displayed temp passwords (they're shown once). Save them to hand out on paper.

## Step 8 - Verify multi-device

After the import:
1. On Device A (your phone): sign in as a learner (e.g., `kyra-j` with her temp password)
2. Add a task to Today
3. On Device B (your laptop): sign in as that learner's parent (e.g., `jenna-j`)
4. Verify the parent view shows that learner

Confirms data is persisting in Supabase and visible across devices.

---

## Notes

- **Encrypted passwords stay client-side.** Logins (Khan, Lexia, etc.) are encrypted with a per-learner AES-GCM key that lives in the device's IndexedDB. Switching devices means re-entering those external service passwords. This is intentional - the server never sees plaintext.
- **The anon key is safe in source.** It's designed to be public; all access is enforced by RLS. The service_role key is what must stay secret.
- **RLS depends on Supabase Auth.** Every profile row has `id` matching an `auth.users` UUID. Without that, `auth.uid()` returns null and policies deny all access.
- **Migration from localStorage data:** if you've used the localStorage backend with real data and need to bring it across, `js/backend/migrate.js` can export the localStorage state as JSON or SQL inserts. Run those in the Supabase SQL editor *with RLS temporarily disabled*, then flip BACKEND_TYPE.
