const $ = (id) => document.getElementById(id);
const audio = new Audio();
audio.preload = "none";

const els = {
  grid: $("grid"), empty: $("empty"), search: $("search"), chips: $("chips"),
  tabAll: $("tabAll"), tabFav: $("tabFav"), favCount: $("favCount"), total: $("stationTotal"),
  recentSection: $("recentSection"), recentRow: $("recentRow"),
  nowLogo: $("nowLogo"), nowName: $("nowName"), nowStatus: $("nowStatus"),
  playBtn: $("playBtn"), playIcon: $("playIcon"),
  volume: $("volume"), volBtn: $("volBtn"), volIcon: $("volIcon"), themeBtn: $("themeBtn"),
  sleepBtn: $("sleepBtn"), sleepLeft: $("sleepLeft"), sleepMenu: $("sleepMenu"), sleepOff: $("sleepOff"),
  installBtn: $("installBtn"),
  arrangeBtn: $("arrangeBtn"), editBar: $("editBar"), doneEdit: $("doneEdit"), resetOrder: $("resetOrder"),
};
const root = document.documentElement;

const ICON_PLAY = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
const ICON_HEART = '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
const ICON_HEART_OUTLINE = '<path fill="currentColor" d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>';
const ICON_VOL = '<path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
const ICON_MUTE = '<path fill="currentColor" d="M7 9v6h4l5 5V4l-5 5H7z"/>';

// ---- persisted state (localStorage may be blocked; fail soft) ----
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};

const MAX_RECENT = 6;
let favorites = new Set(store.get("favorites", []));
let recent = store.get("recent", []).filter((id) => STATIONS.some((s) => s.id === id)).slice(0, MAX_RECENT);
let recentShown = [...recent]; // order on screen; stays stable while you click around
let currentId = null;
let tab = "all";
let genre = null;       // null = all genres
let editing = false;     // "Arrange" mode
let order = store.get("order", []); // saved station order (ids)
let poppedId = null;    // heart that was just toggled, for a one-off pop animation

// ---- theme ----
function applyTheme(mode) {
  root.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]').content = mode === "dark" ? "#0b0f1a" : "#eef1f8";
}
applyTheme(store.get("theme", null) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
els.themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  store.set("theme", next);
});

// ---- rendering ----
function stationById(id) { return STATIONS.find((s) => s.id === id); }

function renderChips() {
  els.chips.innerHTML = "";
  const make = (id, label) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", String(genre === id));
    b.addEventListener("click", () => { genre = id; renderChips(); renderGrid(); });
    els.chips.appendChild(b);
  };
  make(null, "All genres");
  GENRES.forEach((g) => make(g.id, g.label));
}

function renderRecent() {
  const q = els.search.value.trim();
  els.recentSection.hidden = recentShown.length === 0 || q !== "";
  const scroll = els.recentRow.scrollLeft;
  els.recentRow.innerHTML = "";
  for (const id of recentShown) {
    const s = stationById(id);
    if (!s) continue;
    const item = document.createElement("div");
    item.className = "recent-item";
    item.dataset.id = id;

    const b = document.createElement("button");
    b.className = "recent-chip" + (id === currentId ? " active" : "");
    b.title = `${s.name} (${s.nameHe})`;
    b.innerHTML = '<span class="recent-badge"></span><span class="recent-name"></span>';
    const badge = b.querySelector(".recent-badge");
    badge.textContent = s.badge;
    badge.style.backgroundColor = s.color;
    badge.style.color = s.fg;
    b.querySelector(".recent-name").textContent = s.name;
    b.addEventListener("click", () => play(id));

    const x = document.createElement("button");
    x.className = "recent-x";
    x.setAttribute("aria-label", `Remove ${s.name} from recently played`);
    x.title = "Remove";
    x.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    x.addEventListener("click", (e) => { e.stopPropagation(); removeRecent(id); });

    item.append(b, x);
    els.recentRow.appendChild(item);
  }
  els.recentRow.scrollLeft = scroll;
}

function removeRecent(id) {
  recent = recent.filter((r) => r !== id);
  recentShown = recentShown.filter((r) => r !== id);
  store.set("recent", recent);
  renderRecent();
}

function renderGrid(animate = true) {
  const q = els.search.value.trim().toLowerCase();
  const list = orderedStations().filter((s) => {
    if (tab === "fav" && !favorites.has(s.id)) return false;
    if (genre && !(s.tags || []).includes(genre)) return false;
    if (!q) return true;
    return [s.name, s.nameHe, s.desc].some((t) => t.toLowerCase().includes(q));
  });

  els.grid.classList.toggle("no-anim", !animate);
  els.grid.innerHTML = "";
  list.forEach((s, i) => {
    const li = document.createElement("li");
    li.dataset.id = s.id;
    li.className = "tile" + (s.id === currentId ? " active" : "");
    li.style.setProperty("--i", i);

    const main = document.createElement("button");
    main.className = "tile-main";
    main.title = `${s.name} (${s.nameHe})`;
    main.innerHTML =
      '<span class="tile-logo"><span class="badge"></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>' +
      '<span class="tile-name"></span><span class="tile-desc"></span>';
    const logo = main.querySelector(".tile-logo");
    logo.style.backgroundColor = s.color;
    logo.style.color = s.fg;
    main.querySelector(".badge").textContent = s.badge;
    if (s.badge.length > 8) logo.classList.add("long"); // two-line badges need a smaller font
    main.querySelector(".tile-name").textContent = s.name;
    main.querySelector(".tile-desc").textContent = s.desc;
    main.addEventListener("click", () => { if (!editing) play(s.id); });

    const fav = document.createElement("button");
    const isFav = favorites.has(s.id);
    fav.className = "fav" + (poppedId === s.id && isFav ? " pop" : "");
    fav.setAttribute("aria-pressed", String(isFav));
    fav.setAttribute("aria-label", isFav ? `Remove ${s.name} from favorites` : `Add ${s.name} to favorites`);
    fav.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${isFav ? ICON_HEART : ICON_HEART_OUTLINE}</svg>`;
    fav.addEventListener("click", () => toggleFavorite(s.id));

    const grip = document.createElement("button");
    grip.className = "grip";
    grip.setAttribute("aria-label", `Move ${s.name}. Drag, or use the arrow keys.`);
    grip.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M9 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>';
    grip.addEventListener("pointerdown", (e) => startDrag(e, li));
    grip.addEventListener("keydown", (e) => keyMove(e, li, grip));

    li.append(main, fav, grip);
    els.grid.appendChild(li);
  });

  els.empty.hidden = list.length > 0;
  if (!list.length) {
    if (q) els.empty.textContent = `No stations match "${els.search.value.trim()}".`;
    else if (tab === "fav" && !favorites.size) els.empty.textContent = "No favorites yet.\nTap the heart on a station to add it.";
    else els.empty.textContent = "No stations in this selection.";
  }
  els.favCount.textContent = String(favorites.size);
  renderRecent();
}

// Clicking a station only moves the highlight; nothing else is rebuilt or re-animated.
function updateActive() {
  els.grid.querySelectorAll(".tile").forEach((t) => t.classList.toggle("active", t.dataset.id === currentId));
  els.recentRow.querySelectorAll(".recent-item").forEach((it) =>
    it.querySelector(".recent-chip").classList.toggle("active", it.dataset.id === currentId));
}

function isPlaying() { return !audio.paused && !!audio.getAttribute("src"); }

function renderPlayer(status) {
  const s = stationById(currentId);
  const playing = isPlaying();

  els.nowName.textContent = s ? s.name : "Pick a station";
  els.nowLogo.textContent = s ? s.badge : "📻";
  els.nowLogo.style.backgroundColor = s ? s.color : "";
  els.nowLogo.style.color = s ? s.fg : "";
  els.nowStatus.textContent = status ?? (s ? "Ready" : "Tap a tile to start listening");
  els.nowStatus.dataset.live = String(status === "Live");

  els.playBtn.disabled = !s;
  els.playIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  els.playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");

  // Background glow follows the station; equalizer shows only while audio is playing.
  root.style.setProperty("--station", s ? s.color : "#5b8cff");
  root.classList.toggle("is-playing", playing && status === "Live");
  document.title = s && playing ? `${s.name} · Israel Radio` : "Israel Radio";
}

function renderVolume() {
  const v = Number(els.volume.value);
  els.volIcon.innerHTML = v === 0 ? ICON_MUTE : ICON_VOL;
}

// ---- playback ----
function setMediaSession(s) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: s.name, artist: s.desc, album: "Israel Radio",
    artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }],
  });
  navigator.mediaSession.setActionHandler("play", () => resume());
  navigator.mediaSession.setActionHandler("pause", () => pause());
}

function rememberRecent(id) {
  recent = [id, ...recent.filter((r) => r !== id)].slice(0, MAX_RECENT);
  store.set("recent", recent);
  if (!recentShown.includes(id)) {
    recentShown = [id, ...recentShown].slice(0, MAX_RECENT);
    els.recentRow.scrollLeft = 0;
    renderRecent();
  }
}

// ---- auto-reconnect ----
// `wantPlaying` is the user's intent: true after choosing a station, false after pressing pause.
// While it is true, a dropped or stalled stream is retried with a growing delay.
const BACKOFF = [1000, 2000, 4000, 8000, 12000, 15000]; // ms before retry 1..6
const STALL_LIMIT = 12000;                              // give up on a silent connection after this long
let wantPlaying = false;
let attempts = 0;
let retryTimer = null;
let stallTimer = null;
let healthyTimer = null;

function clearRetryTimers() {
  clearTimeout(retryTimer); retryTimer = null;
  clearTimeout(stallTimer); stallTimer = null;
  clearTimeout(healthyTimer); healthyTimer = null;
}

function connect() {
  const s = stationById(currentId);
  if (!s) return;
  clearTimeout(stallTimer);
  audio.src = s.url;                    // setting src again restarts the stream from the live edge
  audio.play().catch((e) => {
    if (e.name !== "AbortError") scheduleReconnect();
  });
  // If nothing starts playing soon, treat the connection as dead and retry.
  stallTimer = setTimeout(() => { if (wantPlaying && !retryTimer) scheduleReconnect(); }, STALL_LIMIT);
}

function scheduleReconnect() {
  if (!wantPlaying || !currentId || retryTimer) return;
  clearTimeout(stallTimer); stallTimer = null;
  clearTimeout(healthyTimer); healthyTimer = null;

  if (!navigator.onLine) {              // no point retrying; the "online" event resumes it
    renderPlayer("Offline. Waiting for connection…");
    return;
  }
  if (attempts >= BACKOFF.length) {     // give up, leave a clear "tap play" state
    wantPlaying = false;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    renderPlayer("Stream unavailable. Tap play to retry");
    return;
  }
  const delay = BACKOFF[attempts];
  attempts += 1;
  renderPlayer(`Reconnecting… (${attempts}/${BACKOFF.length})`);
  retryTimer = setTimeout(() => { retryTimer = null; connect(); }, delay);
}

function play(id) {
  const s = stationById(id);
  if (!s) return;
  clearRetryTimers();
  attempts = 0;
  wantPlaying = true;
  currentId = id;
  store.set("last", id);
  rememberRecent(id);
  setMediaSession(s);
  renderPlayer("Connecting…");
  updateActive();
  connect();
}

function pause(status = "Paused") {
  wantPlaying = false;                  // the user (or the sleep timer) stopped it: never reconnect
  clearRetryTimers();
  attempts = 0;
  // Drop the connection so resuming returns to the live stream, not a stale buffer.
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  renderPlayer(status);
}

function resume() { if (currentId) play(currentId); }

els.playBtn.addEventListener("click", () => (isPlaying() ? pause() : resume()));

els.volume.addEventListener("input", () => {
  audio.volume = Number(els.volume.value);
  store.set("volume", els.volume.value);
  renderVolume();
});
// Phones: the speaker button opens a small volume popover.
els.volBtn.addEventListener("click", () => {
  const wrap = els.volBtn.parentElement;
  const open = wrap.classList.toggle("open");
  els.volBtn.setAttribute("aria-expanded", String(open));
});

audio.addEventListener("playing", () => {
  clearTimeout(stallTimer); stallTimer = null;
  renderPlayer("Live");
  // Count the connection as healthy only after it has stayed up a few seconds,
  // so a stream that connects and drops straight away can't retry forever.
  clearTimeout(healthyTimer);
  healthyTimer = setTimeout(() => { attempts = 0; }, 5000);
});
audio.addEventListener("waiting", () => {
  if (!wantPlaying) return;
  renderPlayer(attempts ? `Reconnecting… (${attempts}/${BACKOFF.length})` : "Buffering…");
  // Brief buffering is normal; a long freeze means the connection is dead.
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => { if (wantPlaying && !retryTimer) scheduleReconnect(); }, STALL_LIMIT);
});
audio.addEventListener("error", () => {
  if (audio.getAttribute("src")) scheduleReconnect();
});
audio.addEventListener("ended", () => scheduleReconnect()); // a live stream should never end

// Network changes: stop hammering while offline, reconnect as soon as we're back.
window.addEventListener("offline", () => {
  if (!wantPlaying) return;
  clearRetryTimers();
  renderPlayer("Offline. Waiting for connection…");
});
window.addEventListener("online", () => {
  if (!wantPlaying) return;
  clearRetryTimers();
  attempts = 0;
  renderPlayer("Back online. Reconnecting…");
  connect();
});

// ---- sleep timer ----
let sleepEnd = 0;
let sleepTick = null;

function formatLeft(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function renderSleep() {
  const active = sleepEnd > 0;
  els.sleepBtn.classList.toggle("active", active);
  els.sleepLeft.hidden = !active;
  els.sleepOff.hidden = !active;
  if (active) els.sleepLeft.textContent = formatLeft(sleepEnd - Date.now());
}

function setSleep(minutes) {
  clearInterval(sleepTick);
  sleepTick = null;
  sleepEnd = minutes > 0 ? Date.now() + minutes * 60000 : 0;
  if (sleepEnd) {
    sleepTick = setInterval(() => {
      if (Date.now() >= sleepEnd) {
        setSleep(0);
        if (isPlaying()) pause("Sleep timer ended");
        return;
      }
      renderSleep();
    }, 1000);
  }
  renderSleep();
}

els.sleepBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = els.sleepMenu.hidden;
  els.sleepMenu.hidden = !open;
  els.sleepBtn.setAttribute("aria-expanded", String(open));
});
els.sleepMenu.addEventListener("click", (e) => {
  const item = e.target.closest("[data-min]");
  if (!item) return;
  setSleep(Number(item.dataset.min));
  els.sleepMenu.hidden = true;
  els.sleepBtn.setAttribute("aria-expanded", "false");
});

// close popovers when clicking elsewhere
document.addEventListener("click", (e) => {
  const volWrap = els.volBtn.parentElement;
  if (!volWrap.contains(e.target)) { volWrap.classList.remove("open"); els.volBtn.setAttribute("aria-expanded", "false"); }
  if (!els.sleepMenu.contains(e.target)) { els.sleepMenu.hidden = true; els.sleepBtn.setAttribute("aria-expanded", "false"); }
});

// ---- favorites, tabs, search ----
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  store.set("favorites", [...favorites]);
  poppedId = id;
  renderGrid(false);
  poppedId = null;
}

function setTab(next) {
  tab = next;
  els.tabAll.classList.toggle("active", tab === "all");
  els.tabFav.classList.toggle("active", tab === "fav");
  els.tabAll.setAttribute("aria-selected", String(tab === "all"));
  els.tabFav.setAttribute("aria-selected", String(tab === "fav"));
  renderGrid();
}
els.tabAll.addEventListener("click", () => setTab("all"));
els.tabFav.addEventListener("click", () => setTab("fav"));
els.search.addEventListener("input", () => renderGrid(false));

// ---- keyboard: space = play/pause, up/down = volume (when not typing) ----
document.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  if (e.code === "Escape") { els.sleepMenu.hidden = true; if (editing) setEditing(false); return; }
  if (e.code === "Space" && tag !== "button") {
    e.preventDefault();
    if (currentId) (isPlaying() ? pause() : resume());
  } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
    e.preventDefault();
    const step = e.code === "ArrowUp" ? 0.05 : -0.05;
    els.volume.value = String(Math.min(1, Math.max(0, Number(els.volume.value) + step)));
    els.volume.dispatchEvent(new Event("input"));
  }
});

// ---- install as an app (PWA) ----
let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  els.installBtn.hidden = false;
});
els.installBtn.addEventListener("click", async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  els.installBtn.hidden = true;
});
window.addEventListener("appinstalled", () => { els.installBtn.hidden = true; });

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ---- arrange mode: reorder tiles by dragging the handle (or arrow keys on it) ----
function orderedStations() {
  const byId = new Map(STATIONS.map((s) => [s.id, s]));
  const out = [];
  for (const id of order) if (byId.has(id)) { out.push(byId.get(id)); byId.delete(id); }
  for (const s of byId.values()) out.push(s); // stations that were never arranged keep their default place
  return out;
}

function saveOrderFromDom() {
  order = [...els.grid.children].map((li) => li.dataset.id);
  store.set("order", order);
}

function setEditing(on) {
  editing = on;
  document.body.classList.toggle("editing", on);
  els.editBar.hidden = !on;
  els.arrangeBtn.classList.toggle("active", on);
  els.arrangeBtn.setAttribute("aria-pressed", String(on));
  if (on) {
    // Reordering only makes sense on the full list, so clear any filter first.
    genre = null; els.search.value = "";
    renderChips();
    setTab("all");
  }
  renderGrid(false);
}
els.arrangeBtn.addEventListener("click", () => setEditing(!editing));
els.doneEdit.addEventListener("click", () => setEditing(false));
els.resetOrder.addEventListener("click", () => {
  order = [];
  store.set("order", order);
  renderGrid(false);
});

// FLIP: measure, change the DOM, then animate each moved tile from its old spot to its new one.
function flip(mutate, skip) {
  const tiles = [...els.grid.children];
  const first = new Map(tiles.map((t) => [t, t.getBoundingClientRect()]));
  mutate();
  for (const t of tiles) {
    if (t === skip) continue;
    const r = t.getBoundingClientRect(), f = first.get(t);
    const dx = f.left - r.left, dy = f.top - r.top;
    if (!dx && !dy) continue;
    t.style.transition = "none";
    t.style.transform = `translate(${dx}px, ${dy}px)`;
    void t.offsetWidth;                       // commit the "from" position
    t.style.transition = "transform .2s ease";
    t.style.transform = "";
  }
}

function keyMove(e, li, grip) {
  const prev = { ArrowLeft: 1, ArrowUp: 1 }[e.key], next = { ArrowRight: 1, ArrowDown: 1 }[e.key];
  if (!prev && !next) return;
  e.preventDefault();
  const sib = prev ? li.previousElementSibling : li.nextElementSibling;
  if (!sib) return;
  flip(() => (prev ? sib.before(li) : sib.after(li)), null);
  saveOrderFromDom();
  grip.focus();
}

let drag = null;

function startDrag(e, li) {
  if (!editing || e.button > 0) return;
  e.preventDefault();
  const grip = e.currentTarget;
  try { grip.setPointerCapture(e.pointerId); } catch {}
  const r = li.getBoundingClientRect();
  drag = { li, grip, offX: e.clientX - r.left, offY: e.clientY - r.top, x: e.clientX, y: e.clientY, swapAt: 0, raf: 0 };
  li.classList.add("dragging");
  grip.addEventListener("pointermove", onDragMove);
  grip.addEventListener("pointerup", endDrag);
  grip.addEventListener("pointercancel", endDrag);
  drag.raf = requestAnimationFrame(dragFrame);
}

function onDragMove(e) { if (drag) { drag.x = e.clientX; drag.y = e.clientY; updateDrag(); } }

// Follow the pointer and swap with whichever tile is underneath.
function updateDrag() {
  if (!drag) return;
  const { li } = drag;

  li.style.transform = "none";                    // measure the tile's natural slot
  const nat = li.getBoundingClientRect();
  li.style.transform = `translate(${drag.x - drag.offX - nat.left}px, ${drag.y - drag.offY - nat.top}px)`;

  const now = performance.now();
  if (now < drag.swapAt) return;                  // let the previous move animation finish
  const target = [...els.grid.children].find((t) => {
    if (t === li) return false;
    const r = t.getBoundingClientRect();
    return drag.x >= r.left && drag.x <= r.right && drag.y >= r.top && drag.y <= r.bottom;
  });
  if (!target) return;
  const kids = [...els.grid.children];
  const after = kids.indexOf(target) > kids.indexOf(li);
  flip(() => (after ? target.after(li) : target.before(li)), li);
  drag.swapAt = now + 220;
  updateDrag();                                   // re-anchor the dragged tile after the swap
}

// While dragging near the top/bottom edge, keep scrolling the page.
function dragFrame() {
  if (!drag) return;
  if (drag.y < 90) window.scrollBy(0, -14);
  else if (drag.y > innerHeight - 130) window.scrollBy(0, 14);
  updateDrag();
  drag.raf = requestAnimationFrame(dragFrame);
}

function endDrag() {
  if (!drag) return;
  const { li, grip } = drag;
  cancelAnimationFrame(drag.raf);
  grip.removeEventListener("pointermove", onDragMove);
  grip.removeEventListener("pointerup", endDrag);
  grip.removeEventListener("pointercancel", endDrag);
  drag = null;
  li.style.transition = "transform .18s ease";    // settle into the slot
  li.style.transform = "";
  setTimeout(() => { li.style.transition = ""; li.classList.remove("dragging"); }, 190);
  saveOrderFromDom();
}

// ---- init ----
els.total.textContent = String(STATIONS.length);
els.volume.value = store.get("volume", "0.7");
audio.volume = Number(els.volume.value);
renderVolume();
renderChips();
// Browsers block autoplay, so restoring the last station only selects it; press play to start.
const last = store.get("last", null);
if (last && stationById(last)) currentId = last;
renderGrid();
renderPlayer(currentId ? "Ready" : undefined);
