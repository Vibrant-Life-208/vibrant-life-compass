# Supabase activation - Hero's Compass

Per Decision 5 of the 2026-05-11 fleet meeting. The skeleton runs on localStorage by default. When Vibrant Life is ready for shared backend (cross-device persistence + multi-learner studio), follow these steps. No code rewrite is required - only configuration.

---

## What's already built

- `schema.sql` - tables, indexes, RLS policies, triggers
- `../js/backend/supabase-adapter.js` - same API as `store.js`, async via Supabase JS client
- `../js/backend/config.js` - the switch (`BACKEND_TYPE = 'local' | 'supabase'`)
- `../js/backend/migrate.js` - localStorage export + SQL generator for one-time migration

---

## Step 1 - Provision the Supabase project

1. Create a new Supabase project at https://supabase.com (free tier is fine for Vibrant Life scale)
2. In the SQL editor, paste and run `supabase/schema.sql`
3. Verify tables: `select tablename from pg_tables where schemaname = 'public'`
4. Note the project URL and the public anon key from Project Settings -> API

---

## Step 2 - Wire up the client

In `js/backend/config.js`:

```js
export const BACKEND_TYPE = 'supabase';
export const SUPABASE_CONFIG = {
  url: 'https://YOURPROJECT.supabase.co',
  anonKey: 'YOUR_PUBLIC_ANON_KEY',
};
```

The anon key is safe to commit; RLS policies protect the data. Never put the service-role key in client code.

In `index.html`, add the Supabase JS client before the app module:

```html
<script type="module">
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
  window.__supabaseCreateClient = createClient;
</script>
<script type="module" src="js/app.js"></script>
```

---

## Step 3 - Wire auth

Real Google sign-in replaces the test-login form. In Supabase Auth settings, enable Google as a provider with the OAuth client ID + secret from Google Cloud Console (the parents' Gmails work as expected).

Update `js/auth.js` to call `getClient().auth.signInWithOAuth({ provider: 'google' })` instead of the role buttons. The skeleton's role buttons can stay as a fallback for offline review.

---

## Step 4 - Provision learner profiles

Each learner needs a row in `profiles` (auto-created on first auth.users insert via a trigger you can add, or via app-layer signup flow) plus a row in `learners` with their studio.

For Vibrant Life staff: a guide creates a learner's invitation, the parent accepts via email, Supabase creates the auth.users row, the app reads the `profiles` row and creates the `learners` row on first sign-in.

Parent-learner and guide-learner links live in `parent_learner_link` and `guide_learner_assignment`. A guide assigns themselves to a learner via an admin tool (TBD) or by direct SQL.

---

## Step 5 - Migrate existing data

If you've been using the skeleton with real data in localStorage and want to bring it over:

1. While running on `BACKEND_TYPE = 'local'`, open the browser console and run:

   ```js
   import('/js/backend/migrate.js').then(m => m.exportToJSON());
   ```

   This downloads `heros-compass-export-YYYY-MM-DD.json`.

2. To convert to SQL inserts:

   ```js
   import('/js/backend/migrate.js').then(async m => {
     const payload = await m.exportToJSON();
     const sql = m.exportToSQL(payload);
     console.log(sql);
   });
   ```

   Run the resulting SQL in Supabase SQL editor. Make sure `auth.users` and `profiles` rows for each learner exist first (or temporarily disable RLS for the bulk import).

3. Flip `BACKEND_TYPE = 'supabase'` in config.js. The app now reads/writes from Supabase.

**Encrypted passwords:** the per-learner AES-GCM key lives in IndexedDB, browser-only. Encrypted password records (`{ ct, iv }`) come along in the export, but they can only be decrypted in the browser that holds the key. If a learner switches to a new device, they re-enter their passwords - this is the cost (and feature) of client-only encryption. The boundary holds without a server seeing plaintext.

---

## Step 6 - Verify

After activation:

1. Sign in as a learner. Verify North loads from Supabase (network tab shows `https://YOURPROJECT.supabase.co/rest/v1/...` requests).
2. Add a task. Verify it appears in the Supabase Table Editor under `tasks`.
3. Sign in on a second device with the same learner email. Verify the task appears.
4. Sign in as a parent linked to that learner. Verify they see the task (but cannot edit it).
5. Sign in as a peer learner. Verify they do **not** see the task (RLS in action).

If verification fails at step 4 or 5, RLS policies are misconfigured. Check the policies in the SQL editor.

---

## Runtime refactor still owed

The current `store.js` exposes a mix of sync and async functions (sync for getters, async for `saveLogin` after Decision 4). For Supabase activation, every getter must become async, and every renderer must await its data.

This refactor is scoped as **post-activation** rather than pre-activation:

- The skeleton stays usable today on local.
- When Vibrant Life provides Supabase keys, do the full async refactor + activation together (estimate: 1-2 days, per Geordi's meeting estimate).

The Supabase adapter in `supabase-adapter.js` exposes the async shape every renderer will eventually consume. Use it as the spec for the refactor.

---

*Wire-up scaffolding shipped 2026-05-11. Activation gated on Vibrant Life's Supabase project + the runtime async refactor.*

*"The best infrastructure is invisible until you need it, then obvious when you look." - Lux*
