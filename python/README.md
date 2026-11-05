# MxAnime PikPak sidecar

The `python` directory contains a small Flask service that starts PikPak
offline download tasks and resolves completed download URLs. The Node media
server calls this service; the client does not call it directly.

## Setup

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The default port is `5000`. Gunicorn is included for production deployments:

```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

## Environment

Create `python/.env`:

```env
PIKPAK_USERNAME=your-pikpak-username
PIKPAK_PASSWORD=your-pikpak-password
PORT=5000
```

`PIKPAK_USERNAME` and `PIKPAK_PASSWORD` may each be a single value or a JSON
array of values for credential rotation.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/task` | Start a PikPak offline download with `{ "magUri": "..." }` |
| `GET` | `/status?task_id=...` | Poll a PikPak task and return its status and file URLs |

The sidecar loads credentials at startup. Restart it after changing `.env`.
