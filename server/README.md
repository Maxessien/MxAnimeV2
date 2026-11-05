# MxAnime media server

The `server` is an Express and TypeScript API that resolves anime episode
torrents, starts asynchronous downloads, transcodes media, uploads results,
and reports task status to the client.

## Setup

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm start
```

The default port is `7860`.

## Environment

Create `server/.env`:

```env
PORT=7860
MONGO_URI=mongodb://localhost:27017/mxanime
PYTHON_SERVER_URL=http://localhost:5000
CLOUDFARE_ACCESS_KEY=your-r2-access-key
CLOUDFARE_SECRET_KEY=your-r2-secret-key
CLOUDINARY_URL=cloudinary://api-key:api-secret@cloud-name
CL_API_KEY=your-cloudconvert-key
APIFY_API_TOKEN=your-apify-token
SEEDR_EMAIL=your-seedr-email
SEEDR_PASS=your-seedr-password
ADMIN_KEY=your-admin-key
```

`CL_API_KEY` may also be a JSON string array for key rotation. `SEEDR_PASS`
is the variable currently read by the server. Keep `subsplease-mal-map.json`
in the server working directory.

## API

The client uses the `/show` routes:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/show/ep` | Resolve episode torrent candidates |
| `GET` | `/show/download` | Start an asynchronous download task |
| `GET` | `/show/status/:id` | Poll task status and receive the completed media URL |
| `GET` | `/show/tasks` | List active tasks with the configured admin key |

The server calls the Python sidecar’s `/task` and `/status` endpoints for
PikPak operations.

## Stack

- Express and TypeScript
- MongoDB via Mongoose
- Torrent discovery through SubsPlease, Torrentio, Nyaa, and Seedr
- PikPak sidecar integration
- CloudConvert and FFmpeg processing
- Cloudflare R2 and Cloudinary storage
