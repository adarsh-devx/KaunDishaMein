/* =========================================================
   DO MUSAFIR — script.js
   Lahar OK Please jaisa samundar radio player • vanilla JS
   Comments Hinglish mein hain, chill padho ⚓
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   1. GAANA LIST — do musafir, samundar ke gaane
   Apni files daalni ho toh assets/audio/ mein same naam se
   .mp3 daalo (README.md padho). File missing ho toh bhi
   player chalta hai — bas silent placeholder bajega.
   --------------------------------------------------------- */
const SONGS = [
  {
    title: "Kaun Disaa Mein Leke Chala Re Batohiya",
    movie: "Nadiya Ke Paar (1982)",
    file: "song-batohiya.mp3",
  },
  {
    title: "Gori Tera Gaon Bada Pyara",
    movie: "Chitchor (1976)",
    file: "song-gori-tera-gaon.mp3",
  },
  {
    title: "Chalat Musafir Moh Liyo Re",
    movie: "Teesri Kasam (1966)",
    file: "song-chalat-musafir.mp3",
  },
  {
    title: "Aaye Ho Meri Zindagi Mein",
    movie: "Raja Hindustani (1996)",
    file: "song-aaye-ho-meri-zindagi.mp3",
  },
  {
    title: "Sujalpur Ki Pori",
    movie: "Ganga Jamuna Saraswati (1988)",
    file: "song-sujalpur-ki-pori.mp3",
  },
  {
    title: "Ek Radha Ek Meera",
    movie: "Ram Teri Ganga Maili (1985)",
    file: "song-ek-radha-ek-meera.mp3",
  },
];

/* ---------------------------------------------------------
   1.1 YOUTUBE API SETUP — asli gaane chalaane ke liye
   ─────────────────────────────────────────────────────────
   ▶ Abhi bas khali rakha hai — apni key baad mein yahan daalna.

   YT_API_KEY banaane ke liye (ek baar ka kaam):
     1. Google Cloud Console mein YouTube Data API v3 enable karo
        https://console.cloud.google.com/apis/library/youtube.googleapis.com
     2. Credentials → Create Credentials → API key
     3. (Recommended) Key pe referrer restriction laga do:
        HTTP referrers → https://chalmeridhanno.xyz/*
        taaki koi aur tumhari key use na kar paye.

   YT_PLAYLIST_ID:
     Apni YouTube playlist ka ID ya poora link (list=PL... wala).

   Kaise chalta hai (priority):
     A. Key + playlist ID yahan daala → browser seedha playlist
        fetch karega (key browser mein dikhegi — isliye referrer
        restriction zaroori).
     B. Nahin toh scripts/build-tracks.mjs se tracks.json banao
        (key browser mein nahi jati).
     C. Dono na ho → local assets/audio/ ke placeholders chalenge.
   --------------------------------------------------------- */
const CONFIG = {
  YT_API_KEY: "",
  YT_PLAYLIST_ID: "",
};

/* Final playlist — initSource() ke baad decide hoti hai */
let TRACKS = [];
let mode = "local"; // 'local' | 'yt'
let yt = null;
let ytReady = false;
let ytLoadedId = null;
let ytPendingPlay = false; // YT player ready hone se pehle play dabaya tha? (onReady pe chala denge)

/* Bumper slogans — naav pe likhe line jaisi */
const BUMPERS = [
  "जो डूबे सो पार उतरे",
  "दो यार, एक नाव, समुंदर भर के गाने",
  "लहरें ओके प्लीज़ 🌊",
  "Lahar aane do, safar chalte raho",
  "नमक की हवा, दिल में गाना",
  "समुंदर की सरहद पर मुसाफ़िर ⚓",
  "लहर लहर! नाव ओके प्लीज़",
  "डूबे तो खुल गए, तैरे तो आ गए",
];

/* Player events ke chhote messages (toast + bumper flash) */
const MSGS = {
  ready: "नाव तैयार! Gaana chalao ▶",
  play: "गाना शुरू! चलो समुंदर में ▶",
  pause: "रुको! पतवार थाम लो 🌊",
  next: "अगला गाना... अगली लहर!",
  prev: "पिछली लहर का गाना याद आया?",
  shuffle: "शफ़ल! जैसे लहर का मन करे 🔀",
  unshuf: "शफ़ल बंद। अब सीधी नाव।",
  error: "गाना नहीं मिला! README देखो 🎵",
};

/* ---------------------------------------------------------
   2. DOM shortcuts
   --------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
const els = {
  intro: $("intro"),
  introEnter: $("introEnter"),
  introLoading: $("introLoading"),
  clock: $("clock"),
  listeners: $("listeners"),
  horn: $("horn"),
  logo: $("logo"),
  player: $("player"),
  disc: $("disc"),
  mqWrap: $("mqWrap"),
  titleText: $("titleText"),
  titleClone: $("titleClone"),
  artist: $("artist"),
  seek: $("seek"),
  seekFill: $("seekFill"),
  seekKnob: $("seekKnob"),
  tCur: $("tCur"),
  tDur: $("tDur"),
  // muteBtn: $('muteBtn'), volRail: $('volRail'), volFill: $('volFill'),  // removed from UI
  shuffle: $("shuffle"),
  prev: $("prev"),
  play: $("play"),
  next: $("next"),
  listBtn: $("listBtn"),
  list: $("list"),
  listItems: $("listItems"),
  bumperText: $("bumperText"),
  bumperNext: $("bumperNext"),
  toast: $("toast"),
};

/* ---------------------------------------------------------
   3. Player state + audio
   --------------------------------------------------------- */
const audio = new Audio();
audio.preload = "auto";

const state = {
  current: 0,
  playing: false,
  shuffled: false,
  volume: 0.7,
  muted: false,
};

/* ---------------------------------------------------------
   4. Chhote helpers
   --------------------------------------------------------- */
function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}

/* title marquee — text set + lamba hon toh scroll */
function setTitle(text) {
  els.titleText.textContent = text;
  els.titleClone.textContent = text;
  els.mqWrap.style.setProperty(
    "--mq-dur",
    Math.max(6, text.length * 0.18) + "s",
  );
  requestAnimationFrame(() => {
    const fits =
      els.titleText.scrollWidth <= els.mqWrap.parentElement.clientWidth;
    els.mqWrap.classList.toggle("static", fits);
  });
}

/* bumper flash — message dikhao, phir slogans pe wapas */
let bumperTimer = null;
function flashBumper(msg, ms = 2400) {
  els.bumperText.textContent = msg;
  clearTimeout(bumperTimer);
  bumperTimer = setTimeout(nextBumper, ms);
}
function setBumper(text) {
  els.bumperText.classList.add("is-swapping");
  setTimeout(() => {
    els.bumperText.textContent = text;
    els.bumperText.classList.remove("is-swapping");
  }, 240);
}

let bumperIdx = 0;
function nextBumper() {
  bumperIdx = (bumperIdx + 1) % BUMPERS.length;
  setBumper(BUMPERS[bumperIdx]);
}

let toastTimer = null;
function toast(msg, ms = 2200) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), ms);
}

/* ---------------------------------------------------------
   5. Clock + fake presence
   --------------------------------------------------------- */
function tickClock() {
  const d = new Date();
  els.clock.textContent = d
    .toLocaleTimeString("hi-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}
setInterval(tickClock, 30000);
tickClock();

(function fakePresence() {
  let n = 24 + Math.floor(Math.random() * 30);
  els.listeners.textContent = n;
  setInterval(() => {
    n = Math.max(10, Math.min(120, n + (Math.random() > 0.5 ? 1 : -1)));
    els.listeners.textContent = n;
  }, 4000);
})();

/* ---------------------------------------------------------
   6. Player controls
   --------------------------------------------------------- */
/* UI playing state — CSS icons + disc spin (is-playing class se) */
function setUIPlaying(on) {
  els.player.classList.toggle("is-playing", on);
}

function loadSong(i) {
  state.current = (i + TRACKS.length) % TRACKS.length;
  const song = TRACKS[state.current];
  els.tCur.textContent = "0:00";
  els.tDur.textContent = "0:00";
  setSeek(0, 0);
  setTitle(song.title);
  els.artist.textContent = song.artist;
  if (mode === "yt") {
    ytLoadedId = null;
    // YouTube thumbnail disc mein set karo
    const thumbUrl =
      "https://i.ytimg.com/vi/" + song.videoId + "/mqdefault.jpg";
    let img = els.disc.querySelector(".disc__thumb");
    if (!img) {
      img = document.createElement("img");
      img.className = "disc__thumb disc__art";
      img.alt = "";
      els.disc.querySelector(".disc__ring").appendChild(img);
    }
    img.src = thumbUrl;
  } else {
    audio.src = "assets/audio/" + song.file;
  }
  updateListUI();
  rotateBg(); // artwork crossfade
}

function playSong() {
  flashBumper(MSGS.play, 1800);
  if (mode === "yt") {
    // Player abhi ready nahi — yaad rakho, onReady pe khud chala denge
    if (!ytReady) {
      ytPendingPlay = true;
      toast("📻 Radio boot ho raha hai... ek second");
      return;
    }
    const id = TRACKS[state.current].videoId;
    if (ytLoadedId !== id) {
      ytLoadedId = id;
      yt.loadVideoById(id);
    } else {
      yt.playVideo();
    }
    state.playing = true;
    setUIPlaying(true);
    updateListUI();
    return;
  }
  audio
    .play()
    .then(() => {
      state.playing = true;
      setUIPlaying(true);
      updateListUI();
    })
    .catch(() => {
      state.playing = false;
      setUIPlaying(false);
      toast("Browser ne gaana rok diya — dobara play dabao 🔊");
    });
}

function pauseSong() {
  ytPendingPlay = false; // pending autoplay cancel
  if (mode === "yt") {
    if (yt) yt.pauseVideo();
  } else audio.pause();
  state.playing = false;
  setUIPlaying(false);
  flashBumper(MSGS.pause, 1800);
  updateListUI();
}

function togglePlay() {
  if (state.playing) pauseSong();
  else playSong();
}

function nextSong() {
  let i = state.current + 1;
  if (state.shuffled) {
    do {
      i = Math.floor(Math.random() * TRACKS.length);
    } while (i === state.current && TRACKS.length > 1);
  }
  loadSong(i);
  flashBumper(MSGS.next, 1600);
  if (state.playing) playSong();
}

function prevSong() {
  loadSong(state.current - 1);
  flashBumper(MSGS.prev, 1600);
  if (state.playing) playSong();
}

function toggleShuffle() {
  state.shuffled = !state.shuffled;
  els.shuffle.classList.toggle("is-on", state.shuffled);
  els.shuffle.setAttribute("aria-pressed", state.shuffled);
  flashBumper(state.shuffled ? MSGS.shuffle : MSGS.unshuf, 1800);
}

/* seek UI (scaleX fill + knob) */
function setSeek(pct, durPct) {
  els.seekFill.style.transform = "scaleX(" + pct / 100 + ")";
  els.seekKnob.style.left = durPct + "%";
  els.seek.setAttribute("aria-valuenow", Math.round(pct));
}

/* audio events */
audio.addEventListener("loadedmetadata", () => {
  els.tDur.textContent = fmtTime(audio.duration);
  const item = els.listItems.children[state.current];
  if (item) item.querySelector(".t-dur").textContent = fmtTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  setSeek(pct, pct);
  els.tCur.textContent = fmtTime(audio.currentTime);
});
audio.addEventListener("ended", () => {
  state.playing = false;
  setUIPlaying(false);
  flashBumper(MSGS.pause, 1800);
});
audio.addEventListener("error", () => {
  if (state.playing) {
    state.playing = false;
    els.player.classList.remove("is-playing");
  }
  flashBumper(MSGS.error, 3000);
  toast(
    "🎵 Gaana file nahi mili! README.md dekh ke apni naav ki playlist daalo.",
  );
});

/* buttons */
els.play.addEventListener("click", togglePlay);
els.next.addEventListener("click", nextSong);
els.prev.addEventListener("click", prevSong);
els.shuffle.addEventListener("click", toggleShuffle);

/* keyboard: space = play, arrows = next/prev, l = lahar
   Space hamesha play/pause toggle karega (chahe kisi bhi button
   pe focus ho) — pehle ye button-focused ho toh kuch nahi hota tha,
   wo bug fix kar diya.
   Zaroori: seek aur volume rail [role="slider"] ke apne keydown
   handlers hain (scrub/volume) — isliye unhe document-level se
   bahar rakhna padta hai, warna Arrow key se gaana bhi badal
   jata aur slider bhi chalta. */
document.addEventListener("keydown", (e) => {
  const t = e.target;
  if (
    t instanceof Element &&
    t.closest('input, textarea, [contenteditable="true"], [role="slider"]')
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  }
  if (e.code === "ArrowRight") nextSong();
  if (e.code === "ArrowLeft") prevSong();
  if (e.key === "l" || e.key === "L") soundGhungroo();
});

/* ---------------------------------------------------------
   7. Seek — click / drag
   --------------------------------------------------------- */
function seekFromEvent(e) {
  const r = els.seek.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
  return x / r.width;
}
function scrubTo(pct) {
  const d =
    mode === "yt"
      ? yt && yt.getDuration
        ? yt.getDuration()
        : 0
      : audio.duration;
  if (!d) return;
  const sec = (pct / 100) * d;
  if (mode === "yt") {
    try {
      yt.seekTo(sec, true);
    } catch (e) {}
  } else audio.currentTime = sec;
  setSeek(pct, pct);
}
els.seek.addEventListener("pointerdown", (e) => {
  els.seek.setPointerCapture(e.pointerId);
  scrubTo(seekFromEvent(e) * 100);
});
els.seek.addEventListener("pointermove", (e) => {
  if (!e.buttons) return;
  scrubTo(seekFromEvent(e) * 100);
});
els.seek.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight")
    scrubTo(parseFloat(els.seek.getAttribute("aria-valuenow")) + 5);
  if (e.key === "ArrowLeft")
    scrubTo(parseFloat(els.seek.getAttribute("aria-valuenow")) - 5);
});

/* ---------------------------------------------------------
   8. Volume — internal only (no UI controls)
   --------------------------------------------------------- */
function setVolume(v) {
  state.volume = Math.min(1, Math.max(0, v));
  if (mode === "yt" && yt && ytReady) {
    try {
      yt.setVolume(Math.round(state.volume * 100));
      if (state.muted) yt.mute();
      else yt.unMute();
    } catch (e) {}
  } else {
    audio.volume = state.muted ? 0 : state.volume;
  }
}
function toggleMute() {
  state.muted = !state.muted;
  if (mode === "yt" && yt && ytReady) {
    try {
      if (state.muted) yt.mute();
      else yt.unMute();
    } catch (e) {}
  } else {
    audio.volume = state.muted ? 0 : state.volume;
  }
  toast(state.muted ? "🔇 Aawaz band" : "🔊 Aawaz wapas");
}
// Volume UI controls removed — keeping internal volume state only
setVolume(0.7);

/* ---------------------------------------------------------
   9. Horn rail — "लहर लहर ओके प्लीज़"
   --------------------------------------------------------- */
function blare(btn) {
  btn.classList.remove("is-blaring");
  void btn.offsetWidth; // animation restart
  btn.classList.add("is-blaring");
}
els.horn.addEventListener("click", () => {
  soundGhungroo();
  blare(els.horn);
  els.logo.classList.remove("is-shaking");
  void els.logo.offsetWidth;
  els.logo.classList.add("is-shaking");
});

/* ---------------------------------------------------------
   10. SOUNDBOARD — Web Audio API se synthesize
   --------------------------------------------------------- */
let audioCtx = null;
let master = null;

function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 8;
    master.connect(comp);
    comp.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function noiseBuffer(ctx, seconds = 1) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/* --- GHUNGROO / bail ki ghanti → LAHREN / samundar ki lehrain --- */
function soundGhungroo() {
  const ctx = getCtx();
  const t0 = ctx.currentTime + 0.02;
  const bells = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < bells; i++) {
    const t = t0 + i * (0.05 + Math.random() * 0.06);
    const f = 3000 + Math.random() * 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18 - Math.random() * 0.08, t + 0.006);
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 0.25 + Math.random() * 0.18,
    );
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f;
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.5);
    /* overtone — asli ghanti ki khanak */
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.05, t + 0.006);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = f * 2.03;
    osc2.connect(g2);
    g2.connect(master);
    osc2.start(t);
    osc2.stop(t + 0.3);
  }
}

/* --- "LAHAR! LAHAR!" — naav ki ghanti --- */
function soundHut() {
  const ctx = getCtx();
  const toot = (t, dur, base) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(base * 1.2, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.85, t + dur);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 850;
    filt.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.035);
    g.gain.setValueAtTime(0.5, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filt);
    filt.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };
  toot(ctx.currentTime + 0.03, 0.32, 175);
  toot(ctx.currentTime + 0.48, 0.32, 215);
}

/* --- KARR-KARR → HAWA / samundar ki hawa --- */
function soundKarr() {
  const ctx = getCtx();
  const creak = (t, fromHz, toHz, dur) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur + 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 16;
    bp.frequency.setValueAtTime(fromHz, t);
    bp.frequency.exponentialRampToValueAtTime(toHz, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.1);
    /* hawa ki saanse */
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(g2);
    g2.connect(master);
    osc.start(t);
    osc.stop(t + 0.2);
  };
  creak(ctx.currentTime + 0.05, 620, 150, 0.35);
  creak(ctx.currentTime + 0.5, 540, 130, 0.45);
}

/* soundboard removed — sound functions kept for horn button */

/* ---------------------------------------------------------
   11. Playlist
   --------------------------------------------------------- */
function buildList() {
  TRACKS.forEach((song, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";

    const t = document.createElement("span");
    t.className = "t-title";
    t.textContent = song.title;

    const a = document.createElement("span");
    a.className = "t-artist";
    a.textContent = song.artist;

    const d = document.createElement("span");
    d.className = "t-dur"; // styling CSS mein hai (.t-dur)
    d.textContent = "—";

    btn.append(t, a, d);
    li.appendChild(btn);
    li.dataset.index = i;
    btn.addEventListener("click", () => {
      if (i === state.current) {
        togglePlay();
      } else {
        loadSong(i);
        playSong();
      }
      els.list.classList.remove("is-open");
      els.listBtn.setAttribute("aria-expanded", "false");
    });
    els.listItems.appendChild(li);
  });
}

function updateListUI() {
  const items = els.listItems.children;
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("is-current", i === state.current);
  }
}

/* playlist toggle */
els.listBtn.addEventListener("click", () => {
  const open = els.list.classList.toggle("is-open");
  els.listBtn.setAttribute("aria-expanded", open);
});
/* playlist ke bahar click karo toh band */
document.addEventListener("pointerdown", (e) => {
  if (
    !els.list.contains(e.target) &&
    e.target !== els.listBtn &&
    !els.listBtn.contains(e.target)
  ) {
    els.list.classList.remove("is-open");
    els.listBtn.setAttribute("aria-expanded", "false");
  }
});

/* ---------------------------------------------------------
   12. Background — artwork crossfade (gaana badle pe)
   --------------------------------------------------------- */
const bgLayers = document.querySelectorAll(".bg__layer");
let bgIdx = 0;
let bgInit = true;
function rotateBg() {
  if (bgInit) {
    bgInit = false;
    return;
  } // pehli baar (load pe) crossfade mat karo
  bgIdx = (bgIdx + 1) % bgLayers.length;
  bgLayers.forEach((l, i) => l.classList.toggle("is-active", i === bgIdx));
}

/* ---------------------------------------------------------
   13. Intro / loading screen
   --------------------------------------------------------- */
function hideIntro() {
  els.intro.classList.add("hide");
  els.intro.setAttribute("aria-hidden", "true");
  els.intro.inert = true;
  els.play.focus({ preventScroll: true });
}
function enterSite() {
  hideIntro();
  /* Playlist fetch abhi chalu ho toh TRACKS khali ho sakta hai —
     undefined.title pe crash se bachne ke liye guard. loadSong(0)
     ne waise bhi title/artist set kar diya hoga init mein. */
  if (TRACKS.length) {
    setTitle(TRACKS[state.current].title);
    els.artist.textContent = TRACKS[state.current].artist;
  }
}
els.introEnter.addEventListener("click", enterSite);

const bootMsgs = [
  "Naav khul rahi hai...",
  "पतवार संभाल रहे हैं...",
  "समुंदर में उतरने वाले हैं...",
];
let bootIdx = 0;
const bootTimer = setInterval(() => {
  bootIdx = (bootIdx + 1) % bootMsgs.length;
  els.introLoading.textContent = bootMsgs[bootIdx];
}, 900);

setTimeout(() => {
  clearInterval(bootTimer);
  if (!els.intro.classList.contains("hide")) enterSite();
}, 500);

/* ---------------------------------------------------------
   14. Bumper rotation + init
   --------------------------------------------------------- */
els.bumperNext.addEventListener("click", () => {
  nextBumper();
});
setInterval(nextBumper, 7000);

/* ---------------------------------------------------------
   15. YouTube source — playlist fetch + IFrame player
   --------------------------------------------------------- */
function extractPlaylistId(input) {
  const m = String(input).match(/[&?]list=([^&]+)/);
  return m ? m[1] : String(input).trim();
}

/* Browser se seedha playlist fetch (CONFIG.YT_API_KEY set ho toh) */
async function fetchPlaylistFromAPI() {
  const key = CONFIG.YT_API_KEY.trim();
  const pl = extractPlaylistId(CONFIG.YT_PLAYLIST_ID);
  if (!key || !pl) return null;
  const out = [];
  let pageToken = "";
  try {
    do {
      const url =
        "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" +
        pl +
        "&key=" +
        key +
        (pageToken ? "&pageToken=" + pageToken : "");
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      for (const item of data.items || []) {
        const s = item.snippet || {};
        if (
          s.resourceId &&
          s.resourceId.kind === "youtube#video" &&
          s.title &&
          !/private video|deleted video/i.test(s.title)
        ) {
          out.push({
            title:
              s.title
                .replace(
                  /\s*[-–—|]\s*(Official\s*)?(Video|Lyrics|Audio|Full\s*Song).*$/i,
                  "",
                )
                .trim() || s.title,
            artist: (s.videoOwnerChannelTitle || "").replace(
              /\s*-\s*Topic$/,
              "",
            ),
            videoId: s.resourceId.videoId,
          });
        }
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken && out.length < 200);
  } catch (e) {
    return null;
  }
  return out.length ? out : null;
}

/* kaunsa source — API key > tracks.json > local SONGS */
async function initSource() {
  const fromAPI = await fetchPlaylistFromAPI();
  if (fromAPI) {
    TRACKS = fromAPI;
    mode = "yt";
    loadYTAPI();
    return;
  }
  try {
    const res = await fetch("tracks.json");
    const t = await res.json();
    if (Array.isArray(t) && t.length && t[0].videoId) {
      TRACKS = t;
      mode = "yt";
      loadYTAPI();
      return;
    }
  } catch (e) {
    /* tracks.json nahi hai — koi baat */
  }
  TRACKS = SONGS.map((s) => ({
    title: s.title,
    artist: s.movie,
    file: s.file,
  }));
  mode = "local";
}

/* YouTube IFrame API load */
function loadYTAPI() {
  if (window.YT && window.YT.Player) {
    window.onYouTubeIframeAPIReady();
    return;
  }
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.async = true;
  document.head.append(s);
}

window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player("yt-player", {
    height: "1",
    width: "1",
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: () => {
        ytReady = true;
        /* 2 chhote fixes:
           1. User ka volume/mute YT player pe bhi laga do (pehle
              sirf audio element pe lagta tha — YT pe nahi).
           2. Agar ready hone se pehle play dabaya tha toh ab chala do. */
        setVolume(state.volume);
        if (ytPendingPlay) {
          ytPendingPlay = false;
          playSong();
        }
      },
      onStateChange: (e) => {
        const S = YT.PlayerState;
        if (e.data === S.ENDED) {
          state.playing = false;
          setUIPlaying(false);
          flashBumper(MSGS.pause, 1800);
        } else if (e.data === S.PLAYING) {
          state.playing = true;
          setUIPlaying(true);
          updateListUI();
        }
      },
      onError: () => {
        toast("🎥 Video available nahi — agla chalao ▶");
        if (state.playing) nextSong();
      },
    },
  });
  /* YouTube API currentTime baar-baar nahi batata — khud poll karo.
     Tab hidden ho toh skip (battery bachti hai) aur jab tak nayi
     video load na ho tab tak purani video ka time mat dikhao. */
  setInterval(() => {
    if (
      document.hidden ||
      mode !== "yt" ||
      !ytReady ||
      !state.playing ||
      !yt ||
      !ytLoadedId
    )
      return;
    try {
      const d = yt.getDuration ? yt.getDuration() : 0;
      const c = yt.getCurrentTime ? yt.getCurrentTime() : 0;
      if (d) {
        const pct = (c / d) * 100;
        setSeek(pct, pct);
        els.tCur.textContent = fmtTime(c);
        els.tDur.textContent = fmtTime(d);
        const item = els.listItems.children[state.current];
        if (item) item.querySelector(".t-dur").textContent = fmtTime(d);
      }
    } catch (err) {
      /* player abhi ready nahi */
    }
  }, 250);
};

/* init — pehle source decide (YouTube ya local), phir player ready */
(async function init() {
  await initSource();
  buildList();
  // Har refresh pe random song se start karo
  const randomStart = Math.floor(Math.random() * TRACKS.length);
  setTitle("Baitho, naav load ho rahi hai…");
  loadSong(randomStart);
  updateListUI();
})();
