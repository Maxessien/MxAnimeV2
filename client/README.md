# MxAnime client

The `client` directory contains the Tauri 2 application for browsing,
streaming, and downloading anime. The UI is built with React and TypeScript,
bundled with Vite, and packaged for desktop and Android through Tauri.

## Development

Install the JavaScript dependencies from this directory:

```bash
npm install
```

Run the web frontend only:

```bash
npm run dev
```

Run the Tauri application with the native shell:

```bash
npm run tauri dev
```

Create a production frontend build:

```bash
npm run build
```

Build/package the Tauri application:

```bash
npm run tauri build
```

The frontend expects the backend URL in `VITE_BACKEND_URL`. It is used by the
download and remote-streaming flows in `src/lib/local-store.ts` and the
streaming-related components.

## Architecture

```text
client/
├── public/                 Static frontend assets
├── src/
│   ├── App.tsx             Application providers, notifications, and routes
│   ├── components/
│   │   ├── anime-details/  Anime metadata and detail views
│   │   ├── anime-stream/   Remote and local streaming shells/players
│   │   ├── downloads/      Download history and active-download UI
│   │   ├── layout/         Shell, navigation, and shared layout
│   │   └── ui/             Reusable Radix/Tailwind UI components
│   ├── hooks/              React Query and device-specific hooks
│   ├── lib/                API adapters, local storage, queues, and helpers
│   ├── pages/              Route-level screens
│   └── types/              API and local-storage type definitions
└── src-tauri/
    ├── src/                Rust commands and Tauri application setup
    ├── capabilities/       Tauri permissions/capabilities
    └── tauri.conf.json     Tauri packaging and runtime configuration
```

### Frontend

- **Routing:** Wouter routes are registered in `src/App.tsx`.
- **Providers:** `ThemeProvider`, React Query, and the tooltip provider wrap
  the application. Toasts are rendered with `react-toastify`.
- **Remote data:** Jikan and AniLink-related adapters live in `src/lib` and
  are consumed by the page components and custom hooks.
- **Streaming:** `/stream` renders the remote iframe flow. Local downloads
  use `/stream/local` and the player under
  `src/components/anime-stream/local/`, backed by
  `@get-air/video-tauri`.
- **Downloads:** `src/lib/local-store.ts` coordinates backend download
  requests, status polling, the download queues, native file transfer, and
  notifications.
- **Local state:** `useJson` reads and writes `downloads.json` and
  `history.json` through Tauri commands. Watch progress is stored per anime
  episode and displayed in download details.
- **Styling:** Tailwind CSS and Radix UI components provide the visual
  system. The `@` alias resolves to `src`.

### Tauri/Rust backend

The Rust layer in `src-tauri/src/commands.rs` provides the native operations
used by the frontend:

- Read and write JSON data in the Tauri application data directory.
- Download media files with progress events and cancellation support.
- Save files under the application `downloads` directory.
- Delete downloaded files.

`src-tauri/src/lib.rs` registers these commands and initializes the Tauri
plugins for HTTP, notifications, OS information, opener integration, and
Android video playback. The frontend listens for the `dl_progress` event to
update active download progress and mobile notifications.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/top` | Top anime |
| `/seasons` | Seasonal anime |
| `/latest` | Latest episodes |
| `/schedule` | Release schedule |
| `/search` | Anime search |
| `/anime/:id` | Anime details |
| `/stream` | Remote streaming |
| `/stream/local` | Local downloaded-file playback |
| `/downloads` | Download list and active downloads |
| `/downloads/:id` | Episodes and progress for one download |
| `/settings` | Application settings |

Streaming routes use query parameters such as `mal_id`, `ep`, `total`, and
`title` to identify the anime and episode.

## IDE setup

For native development, use VS Code with:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

Rust and the Android toolchain are required when building the Android target.
