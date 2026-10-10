# Israel Radio

A static web page for listening to Israeli radio stations live. Plain HTML/CSS/JS, no build step.

**Features:** station grid, play/pause, volume, favorites, search, dark mode, remembers your last station and volume.

## Run locally
```
python -m http.server 8000
```
then open http://localhost:8000 (or use the VS Code *Live Server* extension).

## Edit
- `stations.js` – add/remove stations (name, description, stream URL, badge text, colors)
- `app.js` – player logic, `style.css` – look

## Notes
- Stream URLs must be HTTPS (GitHub Pages is HTTPS; plain-http streams are blocked as mixed content).
- Streams are third-party and can change; if one stops working, update its `url` in `stations.js`.
- No station logos are included on purpose (they are the broadcasters' trademarks); tiles use colored text badges.
