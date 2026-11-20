# Mosaic plugin API

Plugins extend Mosaic on the website **and** in the desktop/mobile app with the same code. A plugin can add toolbar buttons,
side panels, command-palette commands, settings sections and export formats, react to events, and read or change the project
(when the user allows it). You can share a plugin with everybody through the **Plugin store**.

> **Plugins are trusted code.** They run inside the page with the same access as Mosaic itself. The permissions below limit the
> *plugin API* and are shown to the user, but they are not a security sandbox. Reviewers read every store plugin before it is
> listed; users should still only turn on plugins they trust.

## Quick start
A plugin is one JavaScript file plus a manifest. This one adds a toolbar button that counts the items on the page:

```js
Mosaic.plugin({
  id: 'item-counter',                      // must match the manifest
  activate(api) {
    api.toolbar.add({
      label: 'Count', title: 'Count the items on this page', where: 'any',
      run: () => api.toast(api.project.items().length + ' items on this page')
    });
  }
});
```
```json
{
  "id": "item-counter",
  "name": "Item counter",
  "version": "1.0.0",
  "apiVersion": 2,
  "author": "You",
  "description": "Adds a button that counts the items on the page.",
  "permissions": ["project.read", "ui.toolbar"]
}
```
To try it locally put both in your plugins folder (see below). To share it, use **Settings → Plugins → Submit a plugin**.

## Where plugins come from
| Source | How it gets there |
|---|---|
| **Plugin store** | Anyone with an account submits it, a reviewer approves it, anyone can install it from Settings → Plugins → Plugin store. Installed copies live on the user's device and are re-checked against the approved SHA-256 every time Mosaic starts. |
| **Bundled** (website) | A folder under `plugins/` listed in `plugins/index.json`. |
| **User folder** (desktop/mobile app) | A folder with `manifest.json` and its scripts in the app's plugins folder (shown in Settings → Plugins). Press *Reload plugin list*. |

For bundled and user-folder plugins the manifest also needs `"entry": "my-plugin/main.js"` (relative to `plugins/`, or to the plugin folder in the app).
Store plugins do not have an `entry`: the code is stored with the submission.

## Manifest
| Field | Required | Meaning |
|---|---|---|
| `id` | yes | 3 to 41 characters: `a-z`, `0-9`, `-`. Must match the id in `Mosaic.plugin({ id })`. First come, first served in the store; only the person who owns an id can publish new versions of it. |
| `name` | yes | Shown to users (up to 60 characters). |
| `version` | yes | `1.0.0` style. Raise it for every new submission. |
| `apiVersion` | no | The plugin API you built against (currently `2`). |
| `author`, `description` | no (store: description required) | Shown in the store. Description: 10 to 400 characters. |
| `permissions` | no | What the plugin asks for (list below). Users see this before installing. |
| `hosts` | with `network` | Servers it may contact: `https://api.example.com`, or `http://127.0.0.1:*` for any port on this computer. |
| `userHosts` | no | `true` lets the user approve extra **https** servers one by one (for example a custom AI provider). |

## Lifecycle
```js
Mosaic.plugin({
  id: 'my-plugin',
  activate(api) { /* called when the user turns it on */ },
  deactivate() { /* optional cleanup; everything registered through `api` is removed for you */ }
});
```
Each plugin gets its own `api` object. Everything you register through it (toolbar buttons, panels, commands, settings, hooks, event
listeners) is removed automatically when the user turns the plugin off or uninstalls it.

## Permissions
| Permission | Lets the plugin |
|---|---|
| `project.read` | read the current page, its items, the selection, the page list and page text (copies) |
| `project.write` | update or add items, add pages, append to docs |
| `ui.toolbar` | add buttons to the top toolbar |
| `ui.settings` | add a section to its card in Settings → Plugins |
| `ui.panel` | add a docked side panel |
| `ui.commands` | add commands to the command palette (Ctrl+Shift+P) |
| `export.targets` | add an export format |
| `export.hooks` | modify the export manifest |
| `storage` | keep small settings of its own (`api.storage`) |
| `network` | call servers through `api.fetch` (see Network access) |

Ask only for what you use. Reviewers reject plugins that ask for more than they need.

## API reference (`api`)
**General**
- `api.version` : the Mosaic version.
- `api.on(event, fn)` : events: `page:open`, `item:put`, `export:before`, `export:done`, `comment:added`, `page:created`, `prefs:change`, `plugins:changed`.
- `api.toast(text)` : a short message at the bottom of the screen.
- `api.prefs.get(path, default)` : read Mosaic preferences (read only).
- `api.storage.get(key, default)`, `.set(key, value)`, `.remove(key)` : per-plugin storage on this device (`storage`). Values are JSON. It is never synced to the user's account, so it is the right place for API keys.

**Project** (`project.read` unless noted)
- `api.project.page()` : `{ id, name, type: 'b' | 'd' | 't', kind }` for the open page.
- `api.project.items()`, `.selection()` : copies of the items on the page / the selected items.
- `api.project.pages()` : `[{ id, name, type: 'board' | 'doc' | 'table', parent }]`.
- `api.project.pageText(pageId, maxChars)` : the text of a page as plain text.
- `api.project.search(query, max)` : matching lines across all pages.
- `api.project.updateItem(id, patch)`, `.addItem(obj)` (`project.write`). `addItem` accepts `p` to target another page.
- `api.project.addPage({ name, type: 'board' | 'doc' | 'table' })` (`project.write`) : returns the new page id.
- `api.project.appendDoc(pageId, [{ t, x }])` (`project.write`) : `t` is `p`, `h1`, `h2`, `h3`, `todo`, `q` or `code`; `x` is the text.

**User interface**
- `api.toolbar.add({ label, title, where: 'design' | 'any', run })` (`ui.toolbar`)
- `api.ui.panel({ id, title, render(element), onOpen, onClose })` (`ui.panel`) : returns `{ open, close, toggle, isOpen, el }`. Draw your UI into `element`.
- `api.commands.add({ id, title, hint, group, run })` (`ui.commands`) : appears in the command palette.
- `api.settings.add({ title, render(element) })` (`ui.settings`) : a section on your card in Settings → Plugins.

**Export**
- `api.hooks.add('export:manifest', (layout, ctx) => layout)` (`export.hooks`) : may return a modified layout.
- `api.exports.addTarget({ id, label, build(ctx) })` (`export.targets`) : `ctx = { layout, files, design, format }`. `files` is an array of
  `{ name, data }` (`data` is a Uint8Array or string). Push extra files, or return a replacement array. The result is zipped and saved.

**Network** (`network`)
- `api.fetch(url, init)` : like `fetch`, but only for allowed servers (next section).
- `api.network.isAllowed(url)`, `await api.network.request(url)`, `api.network.approved()`, `api.network.revoke(origin)`.

## Network access
`api.fetch` only allows:
1. the addresses in the manifest's `hosts`, and
2. if the manifest sets `"userHosts": true`, **https servers the user approved**. Call `await api.network.request(url)` before using a new
   server: Mosaic asks the user once, remembers the origin, and Settings lets them revoke it.

Plain `http` works only for this computer (`http://127.0.0.1:*`, `http://localhost:*`). Use `api.fetch`, never `fetch`, `XMLHttpRequest` or
`WebSocket` directly: direct calls skip the user's approval and reviewers will reject them.

The page's Content-Security-Policy (`connect-src` in `app.html`, `_headers` and `kCsp` in `src/AssetServer.cpp`) allows any https host plus
localhost, so that plugins can reach providers the user picks. That means the policy itself no longer limits where a script on the page can
send data: the manifest list and the per-server approval are the guard. Site operators who do not want this can replace `https:` in `connect-src`
with a fixed list of hosts. Store plugins are loaded from `blob:` URLs, which is why `script-src` contains `blob:`.

## Writing good plugins
- **Escape text** from projects before putting it into `innerHTML` (or use `textContent`). Project text can contain anything.
- Use Mosaic's CSS variables (`var(--bg)`, `var(--tx)`, `var(--bd)`, `var(--ac)`, `var(--hv)`, `var(--mu)`) so your UI follows light and dark themes.
- Make controls reachable with the keyboard and give buttons labels (`aria-label`).
- Ask before changing the user's project, and make changes easy to see. Never send project text anywhere unless the user asked.
- Keep secrets (API keys) in `api.storage`, never in your code.
- Do not touch other parts of the page, the login session or `localStorage` directly. Anything that needs more than the API belongs in a feature request.

## Publishing to the Plugin store
1. Open **Settings → Plugins → Submit a plugin** (you need an account; guests can browse and install but not submit).
2. Fill in the form or load your `manifest.json` and `main.js`. Press **Check**: it validates the manifest, matches the id in your code,
   and shows the automatic scan a reviewer will see.
3. **Submit for review.** Your plugin is *pending* and visible only to you and to reviewers. Follow it under **My submissions**.
4. A reviewer (the owner or anyone with Dev tools) reads the code and approves or rejects it with a note. Approved plugins appear in the store for everyone.
5. To change anything, submit a **new version** (raise `version`). Submitted code can never be edited, so what was reviewed is exactly what people install.

Limits: code up to 300,000 characters, one JavaScript file, at most 5 submissions waiting at once, description 10 to 400 characters.
Pending and rejected submissions can be deleted by you at any time. Approved plugins can be removed by reviewers (for example if a problem
turns up); people who installed it see "no longer in the store" next time they open the store.

### What reviewers check
- It does what the description says and nothing else.
- Permissions and hosts are the minimum needed; `userHosts` only when users really choose their own servers.
- All network access goes through `api.fetch`; nothing reads the login session, cookies or other storage; no `eval` or `new Function`;
  no loading of other scripts; no navigation or pop-ups.
- Text from projects is escaped; changes to projects are announced or confirmed.
- No hidden behaviour, no tracking, no obfuscated or minified-beyond-reading code.

The review screen runs an automatic scan (network calls outside `api.fetch`, account access, `eval`, direct storage, HTML injection…) and
highlights the lines. The scan helps; it does not replace reading the code.

## Reference plugins
- `plugins/example-asset-report` : a bundled example that adds an export format.
- `store-plugins/ai-assistant` : the AI assistant & MCP plugin (Ollama, Claude, ChatGPT and more; MCP tool servers). It uses panels, commands,
  settings, `network` with `userHosts`, and shows how to ask before changing a project.

## Item data exported for engines
Engine integrations (Unity, Godot, Unreal) are meant to be built as plugins using this API. The data they need is already exported:
`layout.json` (schema `mosaic.ui-layout/1`) with positions, sizes, pivots, 9-slice borders, and an optional sprite atlas (`atlas.json`).
Each asset has `name`, `x`, `y`, `w`, `h` (px, origin top-left, y down), `pad`, `pivot {x,y}` (0-1), optional `nineSlice {l,t,r,b}`, and `files` per scale.
Items carry these extra properties for plugins: `xn` (export name), `nx` (skip export), `sl` (9-slice `[l,t,r,b]`), `pv` (pivot name).

## Setting up the store (site operators)
Run `setup/plugin-store.sql` once in the **central** Supabase (after `central-setup.sql`). It creates the `mosaic_plugins` table, row-level
security (anyone reads approved plugins; signed-in users submit; only developers review) and freezes submitted code. Optionally run
`setup/seed-ai-assistant.sql` to publish the AI assistant plugin as an approved plugin.


## Added in API version 2

- `api.ui.confirm(text, {title, ok, cancel})` → `Promise<boolean>`; `api.ui.prompt(label, default, {title, ok, multiline})` → `Promise<string|null>`; `api.ui.modal({title, render(el, close), buttons})` (`ui.panel`) → `{close, closed}`. Dialogs animate and become bottom sheets on phones.
- `api.env`: `isTouch`, `isPhone`, `isApp`, `readOnly`, `theme`.
- `api.clipboard.writeText(text)`; `api.download(name, data, mime)` (`export.targets`).
- `api.toolbar.add({icon})`: the name of a built-in icon.
- `api.project`: `openPage`, `select`, `table`, `addTableRows`, `renamePage`, `deleteItem`, `snapshot` (write methods need `project.write`).

Build for phones: use the dialogs above instead of `alert`/`confirm`/`prompt`, make tap targets at least 44 px, and use Mosaic's colour variables (`--tx --mu --bd --hv --pn --ac`).
