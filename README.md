# MxAnimeV2  
  
A desktop and Android anime streaming & management application with an automated media pipeline — discover anime via MyAnimeList/Jikan, resolve torrents, download them through PikPak cloud, transcode with FFmpeg, and stream the result from Cloudflare R2 storage.  
  
## Architecture  
  
MxAnimeV2 is a three-tier system:  
  
```  
┌─────────────────────────────┐  
│  client/ — Tauri + React    │  Desktop & Android app (Vite, React 19, TypeScript)  
│  UI, routing, local state   │  
└──────────┬──────────────────┘  
           │ HTTP  
┌──────────▼──────────────────┐  
│  server/ — Express (Node)   │  Media orchestration: torrent resolution,  
│  MongoDB, R2, transcoding   │  transcoding, R2 upload, task tracking  
└──────────┬──────────────────┘  
           │ HTTP  
┌──────────▼──────────────────┐  
│  python/ — Flask sidecar    │  PikPak cloud-download API wrapper  
└─────────────────────────────┘  
```  
  
| Component | Stack | Purpose |  
|---|---|---|  
| `client/` | React 19, Vite, TypeScript, Tailwind, Tauri (Rust) | Cross-platform app UI, local JSON persistence, downloads & watch history |  
| `server/` | Node.js, Express, TypeScript, Mongoose | `/show` API: episode torrent discovery, async download+compress pipeline, status polling |  
| `python/` | Flask, PikPakAPI | `/task` and `/status` endpoints for PikPak offline torrent downloads with credential rotation |  
  
## Features  
  
- **Discovery & browsing** — Spotlight/trending home, top anime rankings, seasonal archives, weekly broadcast schedule, advanced search with genre/type filters  
- **Streaming** — `/stream` view and per-episode playback on anime detail pages  
- **Automated download pipeline** — magnet resolution via SubsPlease / Torrentio (AniZip ID mapping, Nyaa fallback) → PikPak cloud download → FFmpeg/CloudConvert transcode → Cloudflare R2 upload  
- **Async task tracking** — `GET /show/download` returns a `taskId`; clients poll `GET /show/status/:id` for progress  
- **Local library** — downloads manager, watch history, themes — persisted via Tauri IPC to local JSON files with native `dl_progress` notifications  
- **Admin tooling** — `GET /show/tasks` guarded by `ADMIN_KEY`  
  
## Prerequisites  
  
- Node.js 20+  
- Rust & Cargo + Tauri CLI  
- Python 3.10+  
- FFmpeg/FFprobe (bundled via `ffmpeg-static` / `ffprobe-static` for the server)  
- MongoDB instance  
- Accounts/keys: PikPak, Cloudflare R2, Cloudinary, CloudConvert, MyAnimeList client ID (Seedr optional/legacy)  
  
## Setup  
  
### 1. Python sidecar  
  
```bash  
cd python  
python -m venv venv  
source venv/bin/activate   # Windows: venv\Scripts\activate  
pip install -r requirements.txt  
python app.py              # default port 5000  
```  
  
`python/.env`:  
  
```env  
PIKPAK_USERNAME=...  
PIKPAK_PASSWORD=...  
PORT=5000  
```  
  
### 2. Backend server  
  
```bash  
cd server  
npm install  
npm run dev        # tsx --watch  
```  
  
`server/.env`:  
  
```env  
MONGO_URI=...  
PYTHON_SERVER_URL=http://localhost:5000  
VITE_BACKEND_URL=http://localhost:<server-port>  
CLOUDFLARE_ACCESS_KEY=...  
CLOUDFLARE_SECRET_KEY=...  
CLOUDINARY_URL=...  
CL_API_KEY=...          # CloudConvert  
SEEDR_EMAIL=...         # optional legacy  
SEEDR_PASSWORD=...  
ADMIN_KEY=...  
```  
  
### 3. Client  
  
```bash  
cd client  
npm install  
npm run tauri dev  
```  
  
`client/.env`:  
  
```env  
VITE_MAL_CLIENT_ID=...  
```  
  
## Production builds  
  
```bash  
cd server && npm run build && npm start   # tsc → dist/  
cd client && npm run tauri build          # type-check + Vite bundle + Rust compile (desktop & Android via Gradle)  
```  
  
## API reference (server)  
  
Base path: `/show`  
  
| Method | Path | Description |  
|---|---|---|  
| `POST` | `/show/ep` | Resolve torrents for an episode (`mal_id`, `eId`, `sId`, optional `quality`/`mag_uri`); caches results in MongoDB |  
| `GET` | `/show/download` | Start async download+compress pipeline (`mal_id`, `eId`, `sId`, `dl_quality`); returns `202` + `taskId` |  
| `GET` | `/show/status/:id` | Poll task progress; returns `{ status, progress }` or completed episode with R2 `fileUrl` |  
| `GET` | `/show/tasks` | Admin: list all active tasks (`?key=$ADMIN_KEY`) |  
  
## Client routes  
  
| Path | Page |  
|---|---|  
| `/` | Home — spotlight & trending |  
| `/top` | Ranked lists (airing, upcoming, popular) |  
| `/seasons` | Seasonal archives |  
| `/schedule` | Weekly broadcast calendar |  
| `/search` | Search with genre/type filters |  
| `/anime/:id` | Metadata, episodes, download |  
| `/stream` | Streaming view |  
| `/history` | Watch history |  
| `/downloads`, `/downloads/:id` | Download manager & per-series player |  
| `/settings` | Theme & local data management |  
  
## External services  
  
- **Metadata:** Jikan (unofficial MAL), MyAnimeList API v2, AniZip (ID mapping)  
- **Torrents:** SubsPlease, Torrentio, Nyaa  
- **Cloud/storage:** PikPak (offline downloads), Seedr (legacy), CloudConvert (transcoding), Cloudflare R2 (S3-compatible hosting), Cloudinary (images)  
  
## Tech notes  
  
- Server is ESM (`"type": "module"`), TS `ES2020`/`nodenext`; media utils use `fluent-ffmpeg`, `anitomy` filename parsing, `cheerio` scraping  
- Client uses `wouter` routing with URL-as-source-of-truth for filters, TanStack Query for data, `next-themes` for theming  
- Tauri emits `dl_progress` events consumed by the client for native notifications
