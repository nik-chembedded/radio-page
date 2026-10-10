const $ = (id) => document.getElementById(id);
const audio = new Audio();
audio.preload = "none";

const els = {
  grid: $("grid"), empty: $("empty"), search: $("search"),
  tabAll: $("tabAll"), tabFav: $("tabFav"), favCount: $("favCount"), total: $("stationTotal"),
  nowLogo: $("nowLogo"), nowName: $("nowName"), nowStatus: $("nowStatus"),
  playBtn: $("playBtn"), playIcon: $("playIcon"),
  volume: $("volume"), volBtn: $("volBtn"), volIcon: $("volIcon"), themeBtn: $("themeBtn"),
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

let favorites = new Set(store.get("favorites", []));
let currentId = null;
let tab = "all";
let poppedId = null; // heart that was just toggled, for a one-off pop animation

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

function renderGrid() {
  const q = els.search.value.trim().toLowerCase();
  const list = STATIONS.filter((s) => {
    if (tab === "fav" && !favorites.has(s.id)) return false;
    if (!q) return true;
    return [s.name, s.nameHe, s.desc].some((t) => t.toLowerCase().includes(q));
  });

  els.grid.innerHTML = "";
  list.forEach((s, i) => {
    const li = document.createElement("li");
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
    main.querySelector(".tile-name").textContent = s.name;
    main.querySelector(".tile-desc").textContent = s.desc;
    main.addEventListener("click", () => play(s.id));

    const fav = document.createElement("button");
    const isFav = favorites.has(s.id);
    fav.className = "fav" + (poppedId === s.id && isFav ? " pop" : "");
    fav.setAttribute("aria-pressed", String(isFav));
    fav.setAttribute("aria-label", isFav ? `Remove ${s.name} from favorites` : `Add ${s.name} to favorites`);
    fav.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${isFav ? ICON_HEART : ICON_HEART_OUTLINE}</svg>`;
    fav.addEventListener("click", () => toggleFavorite(s.id));

    li.append(main, fav);
    els.grid.appendChild(li);
  });

  els.empty.hidden = list.length > 0;
  if (!list.length) {
    els.empty.textContent = q ? `No stations match "${els.search.value.trim()}".`
      : "No favorites yet.\nTap the heart on a station to add it.";
  }
  els.favCount.textContent = String(favorites.size);
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
  els.volume.style.setProperty("--v", `${v * 100}%`);
}

// ---- playback ----
function setMediaSession(s) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: s.name, artist: s.desc, album: "Israel Radio" });
  navigator.mediaSession.setActionHandler("play", () => resume());
  navigator.mediaSession.setActionHandler("pause", () => pause());
}

function play(id) {
  const s = stationById(id);
  if (!s) return;
  currentId = id;
  store.set("last", id);
  audio.src = s.url;
  setMediaSession(s);
  renderPlayer("Connecting…");
  renderGrid();
  audio.play().catch((e) => {
    if (e.name !== "AbortError") renderPlayer("Can't play this station right now");
  });
}

function pause() {
  // Drop the connection so resuming returns to the live stream, not a stale buffer.
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  renderPlayer("Paused");
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
document.addEventListener("click", (e) => {
  const wrap = els.volBtn.parentElement;
  if (!wrap.contains(e.target)) { wrap.classList.remove("open"); els.volBtn.setAttribute("aria-expanded", "false"); }
});

audio.addEventListener("playing", () => renderPlayer("Live"));
audio.addEventListener("waiting", () => renderPlayer("Buffering…"));
audio.addEventListener("error", () => {
  if (audio.getAttribute("src")) renderPlayer("Stream unavailable. Try another station");
});

// ---- favorites, tabs, search ----
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  store.set("favorites", [...favorites]);
  poppedId = id;
  renderGrid();
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
els.search.addEventListener("input", renderGrid);

// ---- keyboard: space = play/pause, up/down = volume (when not typing) ----
document.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;
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

// ---- init ----
els.total.textContent = String(STATIONS.length);
els.volume.value = store.get("volume", "0.7");
audio.volume = Number(els.volume.value);
renderVolume();
// Browsers block autoplay, so restoring the last station only selects it; press play to start.
const last = store.get("last", null);
if (last && stationById(last)) currentId = last;
renderGrid();
renderPlayer(currentId ? "Ready" : undefined);
