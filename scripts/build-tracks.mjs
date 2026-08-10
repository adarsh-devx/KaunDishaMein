#!/usr/bin/env node
/* =========================================================
   build-tracks.mjs — YouTube playlist se tracks.json banata hai
   Key browser mein nahi jati (hornokplease wala pattern).

   Use:
     YT_API_KEY=your_key YT_PLAYLIST_ID=your_playlist node scripts/build-tracks.mjs

   YT_PLAYLIST_ID mein poora playlist link bhi chalega
   (jaise https://www.youtube.com/playlist?list=PL...)
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = process.env.YT_API_KEY;
const PLAYLIST = process.env.YT_PLAYLIST_ID;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tracks.json');

if (!KEY || !PLAYLIST) {
  console.error('Error: YT_API_KEY aur YT_PLAYLIST_ID env vars do.\n');
  console.error('  YT_API_KEY=xxxx YT_PLAYLIST_ID=yyyy node scripts/build-tracks.mjs');
  process.exit(1);
}

function extractId(input) {
  const m = String(input).match(/[&?]list=([^&]+)/);
  return m ? m[1] : String(input).trim();
}

async function fetchAll(key, playlistId) {
  const out = [];
  let pageToken = '';
  do {
    const url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId='
      + playlistId + '&key=' + key + (pageToken ? '&pageToken=' + pageToken : '');
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error('API error ' + res.status + ': ' + err.slice(0, 300));
    }
    const data = await res.json();
    for (const item of data.items || []) {
      const s = item.snippet || {};
      if (s.resourceId && s.resourceId.kind === 'youtube#video' && s.title && !/private video|deleted video/i.test(s.title)) {
        out.push({
          title: s.title.replace(/\s*[-–—|]\s*(Official\s*)?(Video|Lyrics|Audio|Full\s*Song).*$/i, '').trim() || s.title,
          artist: (s.videoOwnerChannelTitle || '').replace(/\s*-\s*Topic$/, ''),
          videoId: s.resourceId.videoId
        });
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken && out.length < 200);
  return out;
}

try {
  const tracks = await fetchAll(KEY, extractId(PLAYLIST));
  if (!tracks.length) {
    console.error('Playlist khaali hai ya saare videos private/deleted hain.');
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify(tracks, null, 2) + '\n');
  console.log('✅ tracks.json ban gaya — ' + tracks.length + ' tracks');
  console.log('Ab bas deploy karo, YouTube mode khud activate ho jayega.');
} catch (e) {
  console.error('❌ Failed:', e.message);
  process.exit(1);
}
