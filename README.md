# ⚓ Do Musafir — Lahar OK Please (samundar radio)

**Do yaar, ek naav, aur samundar bhar ke gaane. 90s nostalgia and deep ocean vibes.**

Lahar OK Please wala desi radio player — truck/bailgaadi ki jagah **kasti**. Ghoomta compass/naav ka chakra visualizer, "लहर ओके प्लीज़" ghanti rail, 90s ke gehre aur shant gaane, aur namak ki hawa. Pure vanilla HTML + CSS + JS, koi framework nahi.

> "डूबोगे नहीं तो पाओगे कैसे?" 🌊

## Pehle ek nazar

```text
kaundishamein/
├── index.html            ← pura player (ghanti rail + dock + playlist)
├── style.css             ← glass design system (Baloo 2 + Yatra One)
├── script.js             ← player logic + live sound synthesis + YouTube mode
├── tracks.json           ← YouTube playlist data (build script se banta hai)
├── scripts/
│   └── build-tracks.mjs  ← playlist fetch karke tracks.json banata hai
├── README.md
└── assets/
    ├── audio/            ← 6 placeholder .mp3 (local mode ke liye)
    └── images/
        └── bg-1.webp     ← background 1 (sunset + kasti/ocean)
```

## ▶️ YouTube playlist se gaane (recommended — no mp3 chahiye)

Player **dono mode** support karta hai — YouTube ya local mp3. YouTube mode ke liye:

**Option A — tracks.json (best, key browser mein nahi jati):**

1. Google Cloud Console mein [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) enable karo → API key banao.
2. Apni playlist ka ID ya link lo.
3. Run karo:

*Windows (PowerShell) par:*
```powershell
$env:YT_API_KEY="your_key"; $env:YT_PLAYLIST_ID="your_playlist"; node scripts/build-tracks.mjs
```

*Linux/macOS/Git Bash par:*
```bash
YT_API_KEY=your_key YT_PLAYLIST_ID=your_playlist node scripts/build-tracks.mjs
```

Ye `tracks.json` bana dega (title/artist/videoId). Deploy karo — done. No key exposed.

**Option B — browser se seedha fetch:**

`script.js` ke `CONFIG` mein `YT_API_KEY` aur `YT_PLAYLIST_ID` daalo — browser khud playlist fetch karega (key client-side dikhegi; Google Cloud mein referrer restriction laga dena).

**Dono na karo toh** local `assets/audio/` ke placeholders chalenge (neeche dekho).

## 📼 Local mode — apne .mp3 kaise daalo

`assets/audio/` mein abhi **silent placeholder** files hain (2 sec chuppi — taaki player turant chale). Apni asli gaane daalne ke liye:

1. Apni **.mp3** files download karo.
2. `assets/audio/` mein daalo, **file ka naam bilkul yehi** rakho:

| Song | File name (assets/audio/) |
|------|---------------------------|
| Kaun Disaa Mein Leke Chala Re Batohiya (Nadiya Ke Paar) | `song-batohiya.mp3` |
| Gori Tera Gaon Bada Pyara (Chitchor) | `song-gori-tera-gaon.mp3` |
| Chalat Musafir Moh Liyo Re (Teesri Kasam) | `song-chalat-musafir.mp3` |
| Aaye Ho Meri Zindagi Mein (Raja Hindustani) | `song-aaye-ho-meri-zindagi.mp3` |
| Sujalpur Ki Pori (Ganga Jamuna Saraswati) | `song-sujalpur-ki-pori.mp3` |
| Ek Radha Ek Meera (Ram Teri Ganga Maili) | `song-ek-radha-ek-meera.mp3` |

3. **Naam badalna ho** toh `script.js` ke `SONGS` array mein `file:` field update kar do.

## 🔊 Soundboard / Ghanti

Ghungroo aur bells sound **Web Audio API se live synthesize** hote hain — koi audio file nahi lagti. "लहर ओके प्लीज़" ghanti ko click karne par ye play hota hai.

## 💻 Local preview

```bash
python3 -m http.server 8000
# ya
npx serve .
```

Browser mein kholo: `http://localhost:8000`

## 🚀 Deploy

Sirf static files hain — koi build step nahi:

- **Netlify / Vercel / Cloudflare Pages:** GitHub repository se connect karke drag-and-drop ya direct deploy kar sakte hain.
- **GitHub Pages:** repo mein push karo → Settings → Pages → `main` branch select karo.

## 🎨 Customize

- **Songs / slogans / messages:** `script.js` ke `SONGS`, `BUMPERS`, `MSGS`.
- **Logo text:** `index.html` ke `.logo` mein ("दो मुसाफ़िर").
- **Horn/Ghanti rail text:** `.horn__deva` / `.horn__en` ("लहर ओके प्लीज़").
- **Colors:** `style.css` ke `:root` mein (`--glass`, scrim, etc.).

## 🧰 Features

- ✅ Lahar OK Please jaisa glass design — layered artwork background
- ✅ "लहर ओके प्लीज़" ghanti rail — dabao, logo shake + dynamic bells play honge
- ✅ Ghoomta compass visualizer (gaane pe ghoomega, pause pe rukega)
- ✅ Play / pause / next / prev / shuffle + seek bar + time
- ✅ Playlist popup (dock ke upar slide hota hai)
- ✅ Bumper slogans (Yatra One) — har 7 sec pe nayi line, click pe agla
- ✅ Loading screen — "डूबोगे नहीं तो पाओge kaise?"
- ✅ Mobile responsive + touch friendly
- ✅ YouTube playlist mode (Data API + IFrame player) + local mp3 fallback
- ✅ OG meta tags (WhatsApp / Instagram preview)

Made with ❤️ for the two travelers — lahar aane do ⚓ , kashti chalao ⛵
