# Israel Radio

A static web page for listening to Israeli radio stations live. Plain HTML/CSS/JS, no build step.

**Features**
- 18 stations in a glass-style grid, sticky mini-player with LIVE indicator and volume
- Genre chips, search, favorites, "recently played" row (with ✕ to remove)
- Arrange mode: reorder tiles by dragging the handle (or arrow keys), order saved on the device
- Sleep timer (15 min – 1.5 h)
- Dark / light theme, remembers last station, volume and favorites
- Installable as an app on phones (PWA) with its own icon
- Keyboard: Space = play/pause, Up/Down = volume

## Run locally
```
python -m http.server 8000
```
then open http://localhost:8000 (or use the VS Code *Live Server* extension).
Note: some Windows setups serve `.js` as `text/plain`, which stops the service worker from registering locally; GitHub Pages serves the right type.

## Edit
- `stations.js` – stations (name, description, stream URL, badge text, colors, genre `tags`) and the genre chip list
- `style.css` – look, `app.js` – behavior, `index.html` – structure
- `manifest.webmanifest`, `sw.js`, `icons/` – app install support. When you change shell files, bump `CACHE` in `sw.js`.

## Notes
- Stream URLs must be HTTPS (GitHub Pages is HTTPS; plain-http streams are blocked as mixed content).
- Streams are third-party and can change; if one stops working, update its `url` in `stations.js`.
- No station logos are included on purpose (they are the broadcasters' trademarks); tiles use colored text badges.
