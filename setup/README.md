# Mosaic setup (GitHub Pages)

## What is in the zip
- `index.html`, `js/` (the app, split into files so the security policy can forbid inline scripts), `vendor/` (supabase-js and Yjs, bundled so no third-party script runs on your site)
- `legal.html` Terms of Service, Privacy Policy, copyright reporting, storage notice
- icons, `manifest.webmanifest`, `robots.txt`
- `_headers` (security headers for Cloudflare Pages / Netlify; GitHub Pages ignores it, and the same policy is built into `index.html`)
- `setup/` this file and three SQL files

## 1. Publish on GitHub Pages
Put every file and folder at the TOP LEVEL of the `zergrjdev/Mosaic` repo (same level as `index.html`).
Settings > Pages > Deploy from a branch > main / root. Site: https://zergrjdev.github.io/Mosaic/

## 2. Central Supabase (the one built into index.html), one time
1. SQL Editor: run `central-setup.sql` (safe to run again after updates).
2. Authentication > URL Configuration: **Site URL** `https://zergrjdev.github.io/Mosaic/`, **Redirect URLs** add
   `https://zergrjdev.github.io/Mosaic/**`, remove any localhost entries.
3. Authentication > Sign In / Providers > Email: turn ON **Confirm email**. Optional: minimum password length 8.
4. Supabase's built-in email sender allows only a few emails an hour; add your own SMTP for real use.
5. Sign up as `egertonzac@gmail.com` FIRST and confirm that email. That account becomes the owner with Dev tools.

## 2b. Plugin store, one time
1. In the same central Supabase SQL Editor run `plugin-store.sql` (after `central-setup.sql`; safe to run again).
2. Optional: run `seed-ai-assistant.sql` to publish the AI assistant & MCP plugin as an approved store plugin owned by your account.
   (Or use Settings > Plugins > Submit a plugin with the two files in `store-plugins/ai-assistant/` and approve it in the Review queue.)
3. Who can do what: anyone can browse and install approved plugins (guests too); any signed-in account can submit; **you (the owner) and anyone
   you give Dev tools can approve, reject or remove**. Submitted code cannot be edited afterwards, and the app re-checks the approved SHA-256
   on install and every start.
4. `docs.html` (the plugin API docs, linked from the site navigation) is generated from `PLUGINS.md`: after editing it run
   `pip install markdown` then `python3 setup/build-docs.py`.
5. The Content-Security-Policy contains `blob:` in `script-src` (store plugins are loaded from blob URLs) and `https:` in `connect-src`
   (plugins may talk to servers users approve). See the Network access section of `PLUGINS.md`.

## 3. Each person's own Supabase (needed to create projects)
Settings > Your Supabase. Run `your-supabase-setup.sql` in their own SQL Editor, paste the Project URL and the publishable key,
press **Test and save**. The app checks the protection: "Database-level protection is on" means read-only links are enforced by
the database. If the app says the headers are blocked, run `your-supabase-open-fallback.sql` instead (less secure).

## What protects what
- Strict Content-Security-Policy: only your own scripts run; nothing inline, nothing from a CDN. Frame-busting script included.
- Read-only vs edit is enforced in the database for protected connections: reading needs the project id, writing needs the edit key.
- Files live in a public bucket under an unguessable folder; anyone holding a file's link can open it.
- Accounts: email confirmation, 8+ character passwords, sign-in lock after repeated failures, "sign out everywhere".
- Dev tools can open any project read-only and give Dev tools to others; every view and grant is logged.
- Projects created before this change (no own Supabase) stay on the shared server with the old open access.

## Before going public
`legal.html` is a template. Fill in `[YOUR LEGAL NAME]` and `[YOUR STATE AND COUNTRY]` and have a lawyer review it.


## Hosting on Netlify (instead of GitHub Pages)
1. Drag the folder (everything at the top level, same level as `index.html`) into Netlify. `_headers` is applied by Netlify automatically.
2. In Supabase > Authentication > URL Configuration set **Site URL** to your Netlify address and add `https://YOUR-SITE.netlify.app/**` to **Redirect URLs** (keep the old ones if you still use them). Sign-up and password-reset emails link there.
3. Using the desktop/mobile app too? Open `config.js` in the APP project and set `window.MOSAIC_SITE = 'https://YOUR-SITE.netlify.app/';` so share links and confirmation emails from the app point at your website.

## "Failed to fetch" when signing in
The sign-in box now explains the cause itself. The usual ones:
- **Supabase project paused** (free projects pause after about a week of no use): Supabase dashboard > the project > Restore. Then try again.
- **Blocked by the host's security policy**: the host must allow `https://*.supabase.co` in `connect-src`; the supplied `_headers` already does.
- Wrong URL or key in the baked-in settings, or a VPN / ad blocker blocking `*.supabase.co`.

## Web and app together
Both use the same account and the same projects list, and live collaboration runs through your Supabase, so people on the website and in the app can edit the same project at once. Paste a share link from either into "Open a link" on the other.

## Design pages and exporting
Design pages no longer use frames. Place shapes, text and images freely; each is one asset. **Export UI** (top right) saves every item, or your selection, as its own transparent PNG plus `layout.json` (positions and sizes) in one ZIP. Items that overlap (a button and its label) are merged into one asset unless you untick that in the Export panel.


## Upgrading an existing install (multiple Supabases per person)
Re-run `setup/central-setup.sql` once in your **central** Supabase (SQL Editor). It is safe to run again. It lets one person share
several connections as extra storage; until you do, only the first shared connection per person is kept.

## Settings, owner storage pool, plugins
- **Settings** now has categories: Account, Appearance (theme, accent colour), Storage (several Supabases, a default, and per-connection
  "let the owner use this as extra storage"), Files & export, Game design, Discord, Plugins, About.
- The owner account (and anyone given dev tools) sees every opted-in connection in the storage picker when creating a project,
  including an automatic "least used" choice. Sign-in accounts always stay in the central Supabase.
- **Plugins:** see `PLUGINS.md`. An example lives in `plugins/example-asset-report`.
- **Discord:** a webhook posts notifications (exports, comments, new pages). The webhook URL stays on the device.


## Public pages, Discover and the workspace
- `index.html` (Home), `discover.html`, `download.html` and `about.html` share one header. The workspace (boards, docs, design canvas)
  is `app.html`; Log in / Sign up in the header open it on the right tab.
- Old links to the site root that carry a project or a sign-in token are forwarded to `app.html` automatically.
- **Discover:** re-run `setup/central-setup.sql` once in your central Supabase to create the `mosaic_public` table. Owners and dev
  accounts can unlist projects from Dev tools.
- The default theme is dark and the default accent is a desaturated red. Any accent chosen in Settings is remembered on every page.
- `downloads/downloads.json` controls the download buttons.


## Interface, fonts and icons
- The interface fonts (Inter, Caveat, JetBrains Mono) and all icons (Lucide) are served from your own site, so the pages make no requests to Google.
  Google Fonts is contacted only if someone picks a custom font inside a design.
- `_headers` was updated so same-site fonts are allowed. Re-deploy it together with the rest of the site.
- `ui.css` and `js/ui.js` hold the phone, tablet and ultrawide layouts and the touch gestures (pinch to zoom, two-finger pan, a Pan tool).
- Licences for the bundled icons and fonts are in `licenses/`.
