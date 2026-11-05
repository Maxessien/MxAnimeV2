# MxAnime client

The `client` is a Tauri 2 application built with React, TypeScript, Vite,
Tailwind CSS, and Wouter. It runs on desktop and Android and provides anime
browsing, streaming, downloads, local playback, settings, and authentication.

## Setup

```powershell
npm install
npm run dev                 # Vite frontend
npm run tauri dev           # Tauri desktop app
```

## Build

```powershell
npm run build               # Type-check and create the frontend bundle
npm run tauri build         # Package the desktop application
npm run tauri android build -- --apk
```

Rust, the Android SDK/NDK, Java 17, and platform-specific Tauri dependencies
are required for native builds.

## Environment

Create `client/.env` for local development:

```env
VITE_BACKEND_URL=https://your-media-api.example
VITE_AUTH_SERVER_URL=https://your-auth-server.example
VITE_MAL_CLIENT_ID=your-myanimelist-client-id
VITE_TMDB_KEY=your-tmdb-key
```

The release workflow supplies these values through GitHub Actions secrets.
`VITE_AUTH_SERVER_URL` is used for credentialed registration, login, refresh,
and session requests.

## Application structure

- `src/App.tsx`: providers and Wouter routes
- `src/pages/`: route-level screens, including `Anime.tsx` and `Auth.tsx`
- `src/components/`: reusable UI, anime browsing, downloads, layout, and auth
- `src/hooks/`: React Query, settings, and authentication state
- `src/lib/`: API adapters, local persistence, queues, and download logic
- `src-tauri/src/`: native JSON, download, and file commands

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Home |
| `/anime` | Shared anime browsing and filters |
| `/anime/:id` | Anime details |
| `/latest` | Latest episodes |
| `/schedule` | Broadcast schedule |
| `/stream` | Remote streaming |
| `/stream/local` | Local playback |
| `/downloads` | Download manager |
| `/downloads/:id` | Download details |
| `/auth` | Registration and login |
| `/settings` | Appearance, download capacity, account state, and local data |

`/top`, `/seasons`, and `/search` redirect to `/anime`.

## Local data and authentication

Tauri stores download history, watch history, and settings as JSON files in
the application data directory. The client stores only a sanitized user
profile in local storage; authentication tokens are managed through
credentialed requests to the auth server.

The auth server must allow the client origin in CORS and use HTTPS in
production so secure cookies work correctly.
