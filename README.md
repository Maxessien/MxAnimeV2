# MxAnimeV2

MxAnimeV2 is a desktop and Android anime discovery, streaming, and download
application. The repository contains the Tauri client, the media API server,
and the Python PikPak sidecar.

## Repository layout

| Directory | Purpose |
| --- | --- |
| `client/` | React, TypeScript, Vite, and Tauri application |
| `server/` | Express API for torrent resolution, downloads, transcoding, and storage |
| `python/` | Flask sidecar for PikPak offline downloads |

## Requirements

- Node.js 20+
- Rust and Cargo
- Tauri CLI and platform build tools
- Python 3.10+
- MongoDB for `server/`
- PostgreSQL for the separate authentication service used by the client
- FFmpeg tooling supplied by the server dependencies

## Local development

Start each service in its own terminal:

```powershell
# PikPak sidecar
cd python
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py

# Media API
cd server
npm install
npm run dev

# Tauri client
cd client
npm install
npm run tauri dev
```

See the README in each component directory for environment variables and
component-specific commands.

## Production builds

```powershell
cd client
npm run build
npm run tauri build
```

The GitHub release workflow in `.github/workflows/release.yml` builds desktop
packages and the signed Android APK when a `v*` tag is pushed.

## Client routes

| Path | Purpose |
| --- | --- |
| `/` | Home |
| `/anime` | Shared anime browsing, filtering, and pagination |
| `/anime/:id` | Anime details and episodes |
| `/latest` | Latest episodes |
| `/schedule` | Broadcast schedule |
| `/stream` | Remote streaming |
| `/stream/local` | Local downloaded-file playback |
| `/downloads` | Download manager |
| `/downloads/:id` | Download details |
| `/auth` | Registration and login |
| `/settings` | Appearance, download limits, account status, and local data |

`/top`, `/seasons`, and `/search` redirect to `/anime`.

## External services

- Jikan and MyAnimeList for metadata
- AniList and AniZip for mappings
- SubsPlease, Torrentio, and Nyaa for torrent discovery
- PikPak for cloud downloads
- CloudConvert and FFmpeg for media processing
- Cloudflare R2 and Cloudinary for storage and media assets
