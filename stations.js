// Add, remove or reorder stations here.
// `url` must be a direct audio stream (mp3/aac) served over HTTPS (GitHub Pages is HTTPS,
// so plain-http streams are blocked by the browser as mixed content).
// `badge` is the short text shown on the tile (long text wraps); `color` / `fg` are its background and text colors.
// Station logos are deliberately not included: they are the broadcasters' trademarks.
const STATIONS = [
  { id: "galgalatz",   name: "Galgalatz",            nameHe: "גלגלצ",         desc: "Hits & traffic",         badge: "גלגלצ",  color: "#4E2E5C", fg: "#FFFFFF", url: "https://glzwizzlv.bynetcdn.com/glglz_mp3" },
  { id: "galei-zahal", name: "Galei Zahal",          nameHe: "גלי צה״ל",      desc: "News & talk",            badge: "גל״צ",   color: "#1F4FA3", fg: "#FFFFFF", url: "https://glzwizzlv.bynetcdn.com/glz_mp3" },
  { id: "kan-bet",     name: "Kan Bet",              nameHe: "כאן ב׳",        desc: "Public radio",           badge: "כאן ב׳", color: "#1565C0", fg: "#FFFFFF", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_BET.mp3" },
  { id: "tlv-102",     name: "Radio Tel Aviv 102FM", nameHe: "רדיו תל אביב",  desc: "Tel Aviv",               badge: "102FM",  color: "#E53935", fg: "#FFFFFF", url: "https://102.livecdn.biz/102fm_aac" },
  { id: "kan-88",      name: "Kan 88",               nameHe: "כאן 88",        desc: "Music & culture",        badge: "88",     color: "#8430C9", fg: "#FFFFFF", url: "https://29073.live.streamtheworld.com/KAN_88.mp3" },
  { id: "kan-reka",    name: "Kan Reka",             nameHe: "כאן רקע",       desc: "Israeli music",          badge: "רקע",    color: "#455A64", fg: "#FFFFFF", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_REKA.mp3" },
  { id: "eco-99",      name: "Eco 99FM",             nameHe: "אקו 99",        desc: "Music & talk",           badge: "99FM",     color: "#0F9D8A", fg: "#FFFFFF", url: "https://eco-live.mediacast.co.il/99fm_aac" },
  { id: "103fm",       name: "103FM",                nameHe: "רדיו 103",      desc: "Talk & music",           badge: "103FM",    color: "#F57C00", fg: "#FFFFFF", url: "https://cdn.cybercdn.live/103FM/Live/icecast.audio" },
  { id: "100fm",       name: "100FM",                nameHe: "רדיוס 100",     desc: "Pop & rock",             badge: "100FM",    color: "#04B0D5", fg: "#06303A", url: "https://cdn.cybercdn.live/Radios_100FM/Audio/icecast.audio" },
  { id: "pervoe",      name: "Pervoe Radio",         nameHe: "Первое радио",  desc: "Russian-language, 89.1", badge: "Pervoe Radio", color: "#824195", fg: "#FFFFFF", url: "https://cdn.cybercdn.live/Pervoia/Audio/icecast.audio" },
  { id: "kan-gimel",   name: "Kan Gimel",            nameHe: "כאן ג׳",        desc: "Israeli music",          badge: "כאן ג׳", color: "#D81B60", fg: "#FFFFFF", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_GIMMEL.mp3" },
  { id: "darom-1015",  name: "Radio Darom 101.5FM",  nameHe: "רדיו דרום",     desc: "Southern Israel",        badge: "101.5FM",  color: "#2E7D32", fg: "#FFFFFF", url: "https://cdn.cybercdn.live/Darom_1015FM/Live/icecast.audio" },
  { id: "galei-israel",name: "Galei Israel 94FM",    nameHe: "גלי ישראל",     desc: "Hebrew music & talk",    badge: "94FM",     color: "#00838F", fg: "#FFFFFF", url: "https://cdn.cybercdn.live/Galei_Israel/Live/icecast.audio" },
  { id: "kol-chai",    name: "Kol Chai 93FM",        nameHe: "קול חי",        desc: "Hebrew music",           badge: "93FM",     color: "#6D4C41", fg: "#FFFFFF", url: "https://media2.93fm.co.il/live-new" },
  { id: "haifa-1075",  name: "Radio Haifa 107.5FM",  nameHe: "רדיו חיפה",     desc: "Haifa & the north",      badge: "107.5FM",  color: "#3949AB", fg: "#FFFFFF", url: "https://1075.livecdn.biz/radiohaifa" },
  { id: "90fm",        name: "Radio 90FM",           nameHe: "רדיו 90FM",     desc: "Easy listening",         badge: "90FM",     color: "#F9A825", fg: "#2B2100", url: "https://cdn.cybercdn.live/Emtza_Haderech/Live_Audio/icecast.audio" },
  { id: "nostalgia",   name: "Radios Nostalgia 96.3FM", nameHe: "רדיוס נוסטלגי", desc: "Oldies",              badge: "96.3FM",   color: "#9E6B3A", fg: "#FFFFFF", url: "https://cdna.streamgates.net/radios-audio/Nostalgia_963fm/icecast.audio" },
  { id: "101fm-jlm",   name: "101FM Jerusalem",      nameHe: "רדיו ירושלים",  desc: "Jerusalem",              badge: "101FM",    color: "#AD1457", fg: "#FFFFFF", url: "https://radio.streamgates.net/stream/101fm" },
];
