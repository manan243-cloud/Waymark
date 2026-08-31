# Waymark — installable web app

This is your Waymark goal tracker, converted into a standalone Progressive
Web App (PWA) so it can be installed on your phone's home screen and used
offline. No build tools or servers needed to run it — it's plain HTML/CSS/JS.

## Latest update

- **Fourth step status: Failed.** Steps now cycle Not started → In progress
  → Done → Failed (tap the checkbox, or pick it explicitly from a step's
  menu). Failed steps show a red ✕.
- **Fixed the top-right menu (☰)** not opening on real phones — it was a
  genuine bug: a slight finger movement during a tap was cancelling the tap
  before it registered. Tap detection now uses the browser's native click
  event, which is far more forgiving of normal touchscreen jitter. This fix
  applies to every hold-menu in the app, not just the top menu.
  - **Removed the elevation graph** (the peaks-and-valleys chart) — agreed,
  it got cluttered. "Where your attention is going" stays.
- **Removed the Life log** entirely, on the home screen and inside each
  category.
- **Waypoints now come first on the Overview screen**, Expeditions second.
  Inside a single category, the order is unchanged: Expeditions first,
  Waypoints second.
- **The 6 stat cards are now buttons.** Tap Total tasks / Done / In progress
  / Not started / Overdue / Task failed to see exactly which steps make up
  that number, with the same checkbox and menu you'd get anywhere else in
  the app.

## What changed from the original

- **Storage**: swapped Claude's `window.storage` for the browser's built-in
  `localStorage`, so your data now lives in your phone's browser instead of
  in a Claude conversation.
- **Icons**: replaced the `lucide-react` icon imports with small inline SVGs
  (same look), since this app no longer runs inside Claude's environment.
- **Added**: `manifest.json` (app name + icon + "open full-screen" config),
  a `service-worker.js` (caches the app so it still opens with no signal),
  and app icons in `icons/`.
- **Status checkbox**: each step now has a proper checkbox-style control.
  Tap it to cycle not-started → in progress → done.
- **Hold menus**: long-press (or right-click on desktop) any category tab,
  goal, or step — or tap the small ⋮ — for rename / edit / reassign /
  delete / reorder. The little delete crosses are gone.
- **Reorder categories**: from a category's menu, "Move earlier" / "Move
  later".
- **Reassign anything**: move a goal to a different category, or a step to
  a different goal, from its menu.
- **"Restore sample data"** now lives behind the app menu (☰, top right)
  and always asks for confirmation first, so it can't be tapped by accident.
- **Attention dashboard**: a new "Where your attention is going" panel on
  the Overview screen shows progress per category and flags ones that look
  neglected (overdue steps, or a close deadline with little progress).
  Individual goals get the same "Needs attention" flag on their card.
- **Trail log → Life log**: same panel, renamed.
- Everything else — the core UI, layout, and styling — is the app you
  already had, split into a few more files under `src/` for easier future
  edits. The built `app.bundle.js` is what the browser actually runs.

## Publish it for free with GitHub Pages

1. Create a free GitHub account at github.com if you don't have one.
2. Create a new repository (e.g. `waymark`) — public, no need for a README.
3. Upload every file in *this* folder to that repository, keeping the
   `icons/` folder structure intact (GitHub's web UI lets you drag-and-drop
   files and folders in, or use "Add file → Upload files").
4. In the repository, go to **Settings → Pages**.
5. Under "Build and deployment", set **Source** to "Deploy from a branch",
   pick the `main` branch and `/ (root)` folder, then **Save**.
6. GitHub will give you a URL after a minute or two, looking like:
   `https://yourusername.github.io/waymark/`

## Install it on your phone

Open that URL on your phone, then:

- **iPhone (Safari)**: tap the Share icon → **Add to Home Screen**.
- **Android (Chrome)**: tap the ⋮ menu → **Add to Home Screen** / **Install app**.

An icon appears on your home screen and opens full-screen, like a real app.

## Notes

- Your data is stored **per browser, per device** — it won't sync between
  your phone and desktop, or between Safari and Chrome on the same phone.
  If you want sync across devices later, that needs a small backend
  (e.g. a free Supabase project) — just ask if you want that added.
- The two fonts (Fraunces, IBM Plex) load from Google Fonts over the
  network. If you open the app with zero signal *before* it's ever loaded
  with a connection once, it'll fall back to a plain system font — everything
  else (your data, buttons, charts) still works offline.
- "Restore sample data" in the app will overwrite whatever you've entered
  with the four example goals — same as it did in the original.
