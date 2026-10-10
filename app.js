const $ = (id) => document.getElementById(id);
const audio = new Audio();
audio.preload = "none";

const els = {
  grid: $("grid"), empty: $("empty"), search: $("search"),
  tabAll: $("tabAll"), tabFav: $("tabFav"), favCount: $("favCount"),
  nowLogo: $("nowLogo"), nowName: $("nowName"), nowStatus: $("nowStatus"),
  playBtn: $("playBtn"), playIcon: $("playIcon"), volume: $("volume"), themeBtn: $("themeBtn"),
};

const ICON_PLAY = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
const ICON_HEART = '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
const ICON_HEART_OUTLINE = '<path fill="currentColor" d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>';

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

// ---- theme ----
function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]').content = mode === "dark" ? "#10151d" : "#1f5fd1";
}
const savedTheme = store.get("theme", null);
applyTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
els.themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
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
  for (const s of list) {
    const li = document.createElement("li");
    li.className = "tile" + (s.id === currentId ? " active" : "");

    const main = document.createElement("button");
    main.className = "tile-main";
    main.title = `${s.name} (${s.nameHe})`;
    main.innerHTML = '<span class="tile-logo"></span><span class="tile-name"></span>';
    const logo = main.querySelector(".tile-logo");
    logo.textContent = s.badge;
    logo.style.backgroundColor = s.color;
    logo.style.color = s.fg;
    main.querySelector(".tile-name").textContent = s.name;
    main.addEventListener("click", () => play(s.id));

    const fav = document.createElement("button");
    fav.className = "fav";
    const isFav = favorites.has(s.id);
    fav.setAttribute("aria-pressed", String(isFav));
    fav.setAttribute("aria-label", isFav ? `Remove ${s.name} from favorites` : `Add ${s.name} to favorites`);
    fav.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${isFav ? ICON_HEART : ICON_HEART_OUTLINE}</svg>`;
    fav.addEventListener("click", () => toggleFavorite(s.id));

    li.append(main, fav);
    els.grid.appendChild(li);
  }

  els.empty.hidden = list.length > 0;
  if (!list.length) {
    els.empty.textContent = q ? `No stations match "${els.search.value.trim()}".`
      : "No favorites yet.\nTap the heart on a station to add it.";
  }
  els.favCount.textContent = String(favorites.size);
}

function renderPlayer(status) {
  const s = stationById(currentId);
  els.nowName.textContent = s ? s.name : "Pick a station";
  els.nowLogo.textContent = s ? s.badge : "📻";
  els.nowLogo.style.backgroundColor = s ? s.color : "";
  els.nowLogo.style.color = s ? s.fg : "";
  els.nowStatus.textContent = status ?? " ";
  els.playBtn.disabled = !s;
  const playing = !audio.paused && !!audio.getAttribute("src");
  els.playIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  els.playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
}

// ---- playback ----
function setMediaSession(s) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: s.name, artist: s.desc, album: "Israel Radio",
  });
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

els.playBtn.addEventListener("click", () => {
  const playing = !audio.paused && !!audio.getAttribute("src");
  if (playing) pause(); else resume();
});

els.volume.addEventListener("input", () => {
  audio.volume = Number(els.volume.value);
  store.set("volume", els.volume.value);
});

audio.addEventListener("playing", () => renderPlayer("Live"));
audio.addEventListener("waiting", () => renderPlayer("Buffering…"));
audio.addEventListener("error", () => {
  if (audio.getAttribute("src")) renderPlayer("Stream unavailable — try another station");
});

// ---- favorites, tabs, search ----
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  store.set("favorites", [...favorites]);
  renderGrid();
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

// ---- init ----
els.volume.value = store.get("volume", "0.7");
audio.volume = Number(els.volume.value);
// Browsers block autoplay, so restoring the last station only selects it; press play to start.
const last = store.get("last", null);
if (last && stationById(last)) currentId = last;
renderGrid();
renderPlayer(currentId ? "Ready" : undefined);
