# 🐂 Dhaanno Wala — Horn OK Please (bailgaadi radio)

**The original Indian off-roader. 1 horsepower, pure 90s nostalgia.**

Horn OK Please wala desi radio player — truck ki jagah **bailgaadi**. Ghoomta
lakdi ka pahiya, "हट हट ओके प्लीज़" horn rail, 90s ke village gaane, ghungroo,
aur karr-karr. Pure vanilla HTML + CSS + JS, koi framework nahi.

> "बुरी नज़र वाले तेरा मुँह काला!" 🧿

## 🚀 Pehle ek nazar

```text
chalmeridhanno/
├── index.html            ← pura player (horn rail + dock + playlist)
├── style.css             ← glass design system (Baloo 2 + Yatra One)
├── script.js             ← player logic + soundboard + YouTube mode
├── tracks.json           ← YouTube playlist data (build script se banta hai)
├── scripts/
│   └── build-tracks.mjs  ← playlist fetch karke tracks.json banata hai
├── README.md
└── assets/
    ├── audio/            ← 6 placeholder .mp3 (local mode ke liye)
    └── images/
        ├── bg-1.svg      ← background 1 (sunset + hero bailgaadi)
        ├── bg-2.svg      ← background 2 (dusk + aaram karti bailgaadi)
        └── og-cover.png  ← WhatsApp/Instagram share preview
```

Background ke 2 layers hain jo gaana badalte waqt crossfade hote hain
(`bg-1.svg` ↔ `bg-2.svg`). Apna art daalna ho toh in files ko replace karo
(PNG/JPG bhi chalega — `style.css` mein `url()` change karna).

## ▶️ YouTube playlist se gaane (recommended — no mp3 chahiye)

Player **dono mode** support karta hai — YouTube ya local mp3. YouTube mode ke liye:

**Option A — tracks.json (best, key browser mein nahi jati):**

1. Google Cloud Console mein [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) enable karo → API key banao.
2. Apni playlist ka ID ya link lo.
3. Run karo:

```bash
YT_API_KEY=your_key YT_PLAYLIST_ID=your_playlist node scripts/build-tracks.mjs
```

Ye `tracks.json` bana dega (title/artist/videoId). Deploy karo — done. No key exposed.

**Option B — browser se seedha fetch:**

`script.js` ke `CONFIG` mein `YT_API_KEY` aur `YT_PLAYLIST_ID` daalo — browser khud playlist
fetch karega (key client-side dikhegi; Google Cloud mein referrer restriction laga dena).

**Dono na karo toh** local `assets/audio/` ke placeholders chalenge (neeche dekho).

## 📼 Local mode — apne .mp3 kaise daalo

`assets/audio/` mein abhi **silent placeholder** files hain (2 sec chuppi —
taaki player turant chale). Apni asli gaane daalne ke liye:

1. Apni **.mp3** files download karo (128kbps ya usse upar best hai).
2. `assets/audio/` mein daalo, **file ka naam bilkul yehi** rakho:

| Song | File name (assets/audio/) |
|------|---------------------------|
| Kaun Disaa Mein Leke Chala Re Batohiya (Nadiya Ke Paar) | `song-batohiya.mp3` |
| Gori Tera Gaon Bada Pyara (Chitchor) | `song-gori-tera-gaon.mp3` |
| Chalat Musafir Moh Liyo Re (Teesri Kasam) | `song-chalat-musafir.mp3` |
| Aaye Ho Meri Zindagi Mein (Raja Hindustani) | `song-aaye-ho-meri-zindagi.mp3` |
| Sujalpur Ki Pori (Ganga Jamuna Saraswati) | `song-sujalpur-ki-pori.mp3` |
| Ek Radha Ek Meera (Ram Teri Ganga Maili) | `song-ek-radha-ek-meera.mp3` |

3. **Naam badalna ho** toh `script.js` ke `SONGS` array mein `file:` field update
   kar do (title/movie bhi wahi badalte hain).

> ⚠️ Copyright note: ye songs copyrighted hain. Private/personal use ke liye rakhna,
> publicly host karte waqt apne region ke copyright rules zaroor check karna.

## 🔊 Soundboard — koi file nahi chahiye

Ghungroo, "Hut! Hut!" aur karr-karr **Web Audio API se live synthesize** hote hain
— koi audio file nahi lagti. Agar apni asli recordings daalni ho, toh `script.js`
mein `soundGhungroo()`, `soundHut()`, `soundKarr()` functions ko
`new Audio('...')` se replace kar dena.

## 💻 Local preview

```bash
python3 -m http.server 8000
# ya
npx serve .
```

Browser mein kholo: `http://localhost:8000`

## 🚀 Deploy (chalmeridhanno.xyz)

Sirf static files hain — koi build step nahi:

- **Netlify Drop:** [app.netlify.com/drop](https://app.netlify.com/drop) pe folder
  drag & drop karo. Phir domain settings mein `chalmeridhanno.xyz` attach karo.
- **GitHub Pages:** repo mein push karo → Settings → Pages → `main` branch.
- **Vercel / Cloudflare Pages:** bhi seedha kaam karega.

Deploy ke baad `index.html` ke OG meta tags mein URLs already
`https://chalmeridhanno.xyz/...` set hain — WhatsApp/Instagram pe share karne se
sunset + wheel wala preview aayega.

## 🎨 Customize

- **Songs / slogans / messages:** `script.js` ke `SONGS`, `BUMPERS`, `MSGS`.
- **Logo text:** `index.html` ke `.logo` mein ("ढानो वाला").
- **Horn rail text:** `.horn__deva` / `.horn__en` ("हट हट ओके प्लीज़").
- **Background art:** `assets/images/bg-1.svg` + `bg-2.svg`.
- **Colors:** `style.css` ke `:root` mein (`--glass`, scrim, etc.).
- **OG image:** `assets/images/og-cover.png` (1200×630).

## 🧰 Features

- ✅ Horn OK Please jaisa glass design — layered artwork background + crossfade
- ✅ "हट हट ओके प्लीज़" horn rail — dabao, logo shake + "Hut! Hut!" bajega
- ✅ Ghoomta lakdi ka pahiya visualizer (gaane pe ghoomega, pause pe rukega)
- ✅ Play / pause / next / prev / shuffle + seek bar + time
- ✅ Playlist popup (6 gaane) — dock ke upar slide hota hai
- ✅ Bumper slogans (Yatra One) — har 7 sec pe nayi line, click pe agla
- ✅ Tagline — "1 horsepower, pure 90s nostalgia" logo ke neeche
- ✅ Footer — "Made with ❤️ for the villages"
- ✅ Soundboard: 🔔 घुँघरू • 🐂 हट-हट • 🛞 कड़कड़ (Web Audio)
- ✅ Volume slider + mute, keyboard shortcuts (space/arrows/H)
- ✅ Loading screen — "बुरी नज़र वाले तेरा मुँह काला!"
- ✅ Mobile responsive + touch friendly
- ✅ YouTube playlist mode (Data API + IFrame player) + local mp3 fallback
- ✅ OG meta tags (WhatsApp / Instagram preview)

Made with ❤️ for the villages — gaana daalo, dhaanno chalao 🐂
