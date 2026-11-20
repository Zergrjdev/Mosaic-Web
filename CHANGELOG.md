# Mosaic 1.3.1

## Fixes
- Opening a workspace no longer leaves the screen dimmed grey (a stuck fade-in on the side-panel backdrop).
- Docs: the “On this page” list no longer floats over the text on phones using “desktop site”; it only floats beside the page on screens with a mouse.

## Reporting
- New **Report an issue** page (`issues.html`) that opens a pre-filled GitHub issue. It replaces the email contact links on the website, in the app, and in the Terms and Privacy text.

# Mosaic 1.3

## Plugin store (new)
- **Settings → Plugins → Plugin store**: browse approved plugins, install, update and uninstall. Each install shows the permissions and the servers the plugin can contact, with a clear warning. Installed copies are verified against the approved **SHA-256** on install and every start; an edited copy is refused.
- **Anyone with an account can submit a plugin** (guests can browse and install). Submissions start *pending* and are visible only to their author and to reviewers. The form validates the manifest and code, checks the id matches, and shows the automatic scan reviewers will see. Authors follow status and reviewer notes under **My submissions**.
- **Review queue** for the owner and anyone with **Dev tools**: code viewer with flagged lines, an automatic scan (network calls outside `api.fetch`, account/session access, `eval`, direct storage, HTML injection…), the plugin API used, approve / reject / remove with a required reason, and an audit-log entry. Approving needs a tick for "I have read the code".
- Submitted code can never be edited (database trigger), only replaced by a new version. Ids cannot be taken over by someone else.
- **The AI assistant & MCP plugin is no longer built in.** Its Settings tab and bundled folder are gone; it now lives in `store-plugins/ai-assistant/` and is published through the store (`setup/seed-ai-assistant.sql`, or submit and approve it yourself). Wording on About, the home page, the footers and the legal page was updated to match.
- Setup: run `setup/plugin-store.sql` once in the central Supabase.

## Docs
- New **Docs** link in the website navigation and footer, and a **Docs** button in Settings → Plugins (opens inside the app, no website pages). `docs.html` is generated from `PLUGINS.md` (`setup/build-docs.py`) and covers the manifest, permissions, the full plugin API, network rules, writing good plugins, publishing and what reviewers check.

## Clear a Supabase
- **Settings → Storage → Clear…** on each Supabase connection wipes the projects **you own** that are stored there (boards, comments, files) and removes them from your account. Pick which ones, confirm by typing the project id. Projects owned by other people (for example the owner using your Supabase as extra storage) are never offered and never touched.

## Security notes
- Store plugins load from `blob:` URLs, so `script-src` now contains `blob:` (in `app.html`, `_headers` and `src/AssetServer.cpp`).
- Plugins are trusted code. Review is the control; read the code before approving.
- Fixed: the editor defines a global `open()` that shadows `window.open`; the new code uses link clicks instead.

# Mosaic 1.2.1 (second round)

## Guest mode (no account, no internet needed)
- **Continue without an account** on the sign-in screen (for Home and for on-device projects). Guests get a local-only Home, can create, open, rename and delete projects, use Settings and the AI plugin, and make **no** account or Supabase calls at all. Terms are accepted once and remembered on the device.
- Cloud project links still ask guests to sign in. "Sign in or create account" in the menu leaves guest mode; projects made as a guest stay on the device and can be moved to the cloud later (**Move to cloud…**).
- The read-only "public project" banner no longer links to the website; it returns to Discover inside the workspace.

## AI and MCP: any https server
- The Content-Security-Policy now allows **any https host** (plus `http://127.0.0.1` / `localhost`), in `app.html`, `_headers` and `src/AssetServer.cpp`. Plain http to other machines stays blocked.
- To keep that opt-in, a plugin must be allowed to use a server: the built-in provider list needs no approval, any other https server (custom provider, remote Ollama, any MCP server) asks the user **once** and is remembered. Settings → AI & MCP lists approved servers with **Revoke**. New plugin API: `api.network.request / isAllowed / approved / revoke` and the manifest flag `userHosts`.
- **Trade-off, in plain words:** the CSP no longer limits where a script on the page can send data. If you prefer the old behaviour, put the host list back in `connect-src` in those three files.

## Comment threads
Replies, **resolve / reopen**, edit your own comments, **@mentions** (type @ for suggestions; people are notified in the bell), emoji **reactions**, delete a thread together with its replies, filter Open / Resolved / All, and an **All comments** panel (sidebar "Comments (n)", or Ctrl+Shift+P) listing every thread on the project with a jump to the item. Resolved threads stop counting on the item badge. Old comments keep working (extra fields are optional).

## Live cursors and presence
Smooth cursors that fade when idle; a coloured outline and name tag on what other people have **selected**; **cursor chat** (press `/` on a board, others see your message for 6 seconds); **follow** a person's view (zoom and position, across pages) and stop by moving the canvas; a **people panel** (click "N people here"). Incoming cursor data is validated before use.

## Tests that were run for this release
Integration tests (real `app.html` in jsdom with a stubbed backend): sign-in/password reveal, Home header, local project create/open/delete, Discover (load/search/sort/error), owner delete wipe vs keep, guest mode with zero network calls, compression round-trip, palette/F11/focus mode, settings tabs, comment threads, live cursors. Plugin tests against mock OpenAI-style, Claude-style and MCP servers. Not tested: the Qt/QML code (could not be compiled here) and real third-party servers.

# Mosaic 1.2 (first round)

## Workspace
- **Home / Discover repaired.** Home and Discover now sit next to the logo (the header spacer was pushing them to the middle). Both are **inside the workspace**: Discover is rebuilt in the workspace UI (search, sort, refresh, skeleton + error states, "Your public projects" with Unpublish) and never opens the website pages. In the app, there is no link to the website at all; the web build keeps a "Website" item in the account menu.
- **Page delete button.** The tiny "×" is now a 32 px button (44 px on touch) with a hover/focus state. Deleting shows an **Undo** toast; pages still go to the Trash.
- **Show-password button** (eye icon) on every password field: sign in, sign up, change password, Supabase keys, webhooks, AI keys. Auto-hides again after 30 s or when you leave the field.
- **Command palette** (Ctrl+Shift+P): every action, every page, every settings tab, plus commands added by plugins.
- **F11 full screen** (browser and desktop app) and **Shift+F11 focus mode** (hides toolbars; Esc returns). Buttons in the sidebar and on Home. Desktop app: optional *Start in full screen* and *Remember window size and position*.
- Works **offline** with a cached sign-in so on-device projects still open.

## Projects and storage
- **Local-only projects** ("This device only"): never touch Supabase (no rows, no files, no sharing, not even the project name goes to your account). Create from Home, set as default in Settings → Storage, convert either way from the project card (**Move to cloud…** / **Make local-only…**).
- **Delete with an optional Supabase wipe** (owners only): *Delete everywhere* wipes rows, comments and files from Supabase; *Remove from my account only* keeps the data. Type DELETE to confirm; default is configurable. Local projects delete from the device.
- **Compression.** Project data on the device is LZ-compressed (a 63 KB test project became 5 KB; restore points too, and 12 are kept instead of 8). Text-like attachments are gzipped before storing or uploading, `.mosaic` compressed backups (restores like `.json`), ZIP exports deflate JSON/SVG. Settings → Performance shows usage per project, "Compress now" and "Delete restore points".
- Safer loading: if stored data cannot be read it is kept as `mosaic:<id>:damaged` instead of being overwritten.
- Attached files now save through the app's native Save dialog (the old known limit).

## Performance
- Cloud polling drops to about once a minute while live updates are connected and stops while the tab is hidden.
- Image import size and JPEG quality are settings.

## AI assistant & MCP (optional plugin, off by default)
Ollama, Claude, ChatGPT, Gemini, OpenRouter, Groq, Mistral, DeepSeek, xAI and any OpenAI-compatible server; MCP tool servers over Streamable HTTP; streaming chat panel; built-in project tools with an Allow/Deny card for reads (cloud) and every change. See `PLUGINS.md`.
Plugin API additions: `network` (+ manifest `hosts`), `ui.panel`, `ui.commands`, `project.pages/pageText/search/addPage/appendDoc`.

## Things you must do / know
- The Content-Security-Policy `connect-src` was widened for the AI hosts in **three** places: `app.html`, `_headers`, `src/AssetServer.cpp`. Redeploy all of them.
- `legal.html`, `about.html` and the footers said "no AI inside Mosaic". They now say AI is opt-in. **Please read the legal wording yourself.**
- The native changes (`/__window`, QML window state) could not be compiled in the environment that made this release. Build and try F11 on your Linux machine first.
- Ollama needs `OLLAMA_ORIGINS` to include the app's address (`http://127.0.0.1:38417`); MCP servers need CORS and the `Mcp-Session-Id` header exposed.
