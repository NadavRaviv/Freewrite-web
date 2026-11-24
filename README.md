# Freewrite

A quiet, full-screen page for freewriting in the browser. One column of text, a timer, and a bar of controls that gets out of the way while you type. There are no accounts. Entries stay in this browser.

Freewrite began as a Mac app by [Farza Majeed](https://github.com/farzaa/freewrite). [imsandarva](https://github.com/imsandarva/freewrite) ported it to Linux with PyQt. This web app is a new interface for the same kind of session: write without fuss, keep what you wrote, and come back to it later.

It is not the official Freewrite app.

## Licence

MIT. Copyright (c) 2025 Farza Majeed. Copyright (c) 2026 Nadav Raviv. See [LICENSE](LICENSE).

## Run locally

```bash
npm install
npm run dev
```

Vite prints a local URL, usually http://localhost:5173.

## Check and build

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run build` writes a static site to `dist/`. [Netlify](https://www.netlify.com/) builds with the same command and publishes that folder. `netlify.toml` sends every path to `index.html` so the page loads on a refresh.

## What you can do

- Write in the centred page. The placeholder is only a nudge. Text is saved on every change, in `localStorage` on this device.
- Click the timer to start or pause it. Scroll or drag it to change the length in steps of five minutes (5 to 120). Double-click, or press Home while it is focused, to put it back to 15:00. Arrow keys adjust it too.
- The bar fades after you start typing, and while a timer is running. Move the pointer, or use Show controls, to bring it back.
- Switch among Lato, Arial, the system font, a serif, and a random face. The size control cycles 16–26px. Ctrl or Command plus and minus do the same.
- Toggle light and dark, and full screen.
- Turn Backspace off when you want to keep moving forward instead of editing.
- History lists entries by day. Open one, download it, or move it to Trash. Trash can restore an entry, and the toast after a delete can undo it.
- Copy puts the entry on the clipboard. Chat copies a short prompt plus the entry, so you can paste it into any chat. Nothing is sent anywhere by this app.

## Keys

| Keys | Action |
| --- | --- |
| Ctrl/⌘ N | New entry |
| Ctrl/⌘ H | History |
| Ctrl/⌘ + or − | Font size |
| Escape | Close History, then leave full screen |
| Up/Down in History | Move between entries |

Clearing this site’s data in the browser deletes the entries. There is no server copy.
