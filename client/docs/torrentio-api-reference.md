# Torrentio API: Deep Technical Reference & Comprehensive Documentation

Torrentio is the premier torrent and debrid stream aggregator built on the [Stremio Addon Protocol](https://github.com/Stremio/stremio-addon-sdk). While primarily designed as a Stremio plugin, Torrentio exposes a deterministic, stateless REST API that indexes, scrapes, deduplicates, filters, ranks, and resolves torrents and debrid links across dozens of public indexers.

This document details the complete API architecture, path schema, configuration parameters, filtering rules, response models, debrid integrations, and client implementation guidelines.

---

## Table of Contents

1. [Architecture & Protocol Overview](#1-architecture--protocol-overview)
2. [Base URL & Endpoint Schema](#2-base-url--endpoint-schema)
3. [Configuration Parameter Syntax](#3-configuration-parameter-syntax)
4. [Comprehensive Parameter Reference](#4-comprehensive-parameter-reference)
   - [Sorting (`sort`)](#sorting-sort)
   - [Trackers & Scrapers (`providers`)](#trackers--scrapers-providers)
   - [Quality Exclusion Filters (`qualityfilter`)](#quality-exclusion-filters-qualityfilter)
   - [Size Caps (`sizefilter`)](#size-caps-sizefilter)
   - [Result Limits (`limit`)](#result-limits-limit)
   - [Language Prioritization (`language`)](#language-prioritization-language)
   - [Debrid Services & API Keys](#debrid-services--api-keys)
   - [Debrid Behavior Flags (`debridoptions`)](#debrid-behavior-flags-debridoptions)
   - [Pre-configured Presets](#pre-configured-presets)
5. [Stream Query Endpoints & ID Formats](#5-stream-query-endpoints--id-formats)
   - [Movies (IMDb)](#movies-imdb)
   - [Series & Episodes (IMDb)](#series--episodes-imdb)
   - [Anime (Kitsu)](#anime-kitsu)
6. [Catalog & Metadata Endpoints (Debrid)](#6-catalog--metadata-endpoints-debrid)
7. [API Response Schemas & Field Extraction](#7-api-response-schemas--field-extraction)
   - [P2P Torrent Response Model](#p2p-torrent-response-model)
   - [Debrid Cached Stream Response Model](#debrid-cached-stream-response-model)
   - [Parsing Metadata from Stream Titles](#parsing-metadata-from-stream-titles)
8. [Practical Usage Examples & Recipes](#8-practical-usage-examples--recipes)
9. [Error Handling, Rate Limiting & Operational Notes](#9-error-handling-rate-limiting--operational-notes)

---

## 1. Architecture & Protocol Overview

Torrentio functions as an HTTP-based microservice adhering to the Stremio Addon v2 specification:
* **Stateless Configuration**: Client configuration (API tokens, sorting preferences, active providers) is not stored in a server-side session. Instead, it is serialized directly into the URL path prefix.
* **Aggregated Scraped Cache**: The backend scraper periodically crawls public trackers and stores torrent metadata in a persistent store. When a stream request arrives, it evaluates and filters matches dynamically.
* **Real-time Debrid Resolution**: When configured with a supported debrid key (e.g., Real-Debrid, TorBox, AllDebrid), Torrentio checks cached availability in real time and either serves cached direct-playback HTTP/HTTPS URLs or provides debrid download dispatch links.

---

## 2. Base URL & Endpoint Schema

### Base URLs
* **Official Public Instance**: `https://torrentio.strem.fun`
* **Custom / Self-Hosted**: `http://<your-host>:<port>`

### Standard Routes

| Endpoint Pattern | Method | Description |
| :--- | :--- | :--- |
| `/:config/manifest.json` | `GET` | Returns addon metadata and declared capabilities tailored to the configuration. |
| `/:config/stream/:type/:id.json` | `GET` | Main streaming route. Resolves torrents or debrid stream URLs. |
| `/:config/catalog/:type/:id.json` | `GET` | Returns personal debrid cloud catalogs (when debrid is configured and enabled). |
| `/:config/meta/:type/:id.json` | `GET` | Retrieves metadata details for items inside the debrid catalog. |
| `/:config/configure` | `GET` | Renders the HTML configuration dashboard pre-populated with `:config`. |
| `/configure` | `GET` | Renders the default unconfigured setup interface. |

> **Note**: `:config` is optional. Omitting it (e.g., `https://torrentio.strem.fun/stream/movie/tt0137523.json`) invokes Torrentio with default settings: all standard scrapers enabled, sorted by quality then seeders, filtering CAM and SCR releases.

---

## 3. Configuration Parameter Syntax

The `:config` segment is serialized as pipe-delimited (`|`) key-value pairs. Multiple values for a single key are separated by commas (`,`):

```text
key1=val1,val2|key2=val3|key3=val4
```

### URL Encoding Guidelines
* The pipe symbol (`|`) can be passed raw in modern HTTP clients or percent-encoded as `%7C`.
* Commas (`,`) can be passed raw or percent-encoded as `%2C`.
* Equality signs (`=`) designate key-value division.

### Example Construction
To query with:
1. Providers: 1337x, RARBG, TorrentGalaxy
2. Sort: Quality then Size
3. Exclude qualities: CAM, Screener, 480p
4. Real-Debrid key: `YOUR_RD_TOKEN`

The configuration string is:
```text
providers=1337x,rarbg,torrentgalaxy|sort=qualitysize|qualityfilter=cam,scr,480p|realdebrid=YOUR_RD_TOKEN
```

And the full request URL becomes:
```http
GET https://torrentio.strem.fun/providers=1337x,rarbg,torrentgalaxy|sort=qualitysize|qualityfilter=cam,scr,480p|realdebrid=YOUR_RD_TOKEN/stream/movie/tt0137523.json
```

---

## 4. Comprehensive Parameter Reference

### Sorting (`sort`)

The `sort` parameter governs the internal ranking algorithm applied to stream results.

| Value | Internal Mode | Description |
| :--- | :--- | :--- |
| `quality` | `qualitySeeders` *(Default)* | Groups streams by resolution (4K > 1080p > 720p > 480p > Other), then sorts by **seeder count descending**. |
| `qualitysize` | `qualitySize` | Groups streams by resolution, then sorts by **file size descending** within each resolution group. |
| `seeders` | `seeders` | Disregards resolution groupings; sorts all streams strictly by **seeder count descending**. |
| `size` | `size` | Disregards resolution groupings; sorts all streams strictly by **file size descending**. |

---

### Trackers & Scrapers (`providers`)

Defines which indexers are queried. Pass a comma-separated list of keys. If omitted, all standard providers are enabled by default.

| Provider Key | Tracker Name | Content Specialization | Category / Language Tag |
| :--- | :--- | :--- | :--- |
| `yts` | YTS / YIFY | Movies (Compact 720p/1080p/4K) | General / English |
| `eztv` | EZTV | TV Shows & Series | General / English |
| `rarbg` | RARBG Dump / Mirrors | Movies, TV, High Bitrate | General / English |
| `1337x` | 1337x | General Movies & TV | General / English |
| `ext` | EXT | General Torrents | General / English |
| `thepiratebay` | The Pirate Bay | General Public Tracker | General / English |
| `kickasstorrents` | KickassTorrents | General Public Tracker | General / English |
| `torrentgalaxy` | TorrentGalaxy | Fast Scene & P2P Releases | General / English |
| `magnetdl` | MagnetDL | Web-scraped Magnet Links | General / English |
| `nyaasi` | Nyaa.si | Anime & Asian Media | Anime (`anime: true`) |
| `tokyotosho` | TokyoTosho | Anime Media | Anime (`anime: true`) |
| `anidex` | AniDex | Anime Media | Anime (`anime: true`) |
| `horriblesubs` | HorribleSubs | Anime Archives | Anime (`anime: true`) |
| `nekobt` | nekoBT | Anime Torrents | Anime (`anime: true`) |
| `rutor` | Rutor | Russian Tracker | Foreign: 🇷🇺 |
| `rutracker` | RuTracker | High-fidelity Russian Tracker | Foreign: 🇷🇺 |
| `comando` | Comando | Portuguese / Brazilian | Foreign: 🇵🇹 |
| `bludv` | BluDV | Portuguese / Brazilian Releases | Foreign: 🇵🇹 |
| `micoleaodublado` | Mico Leão Dublado | Portuguese Dubbed Releases | Foreign: 🇵🇹 |
| `torrent9` | Torrent9 | French Tracker | Foreign: 🇫🇷 |
| `ilcorsaronero` | ilCorSaRoNeRo | Italian Tracker | Foreign: 🇮🇹 |
| `mejortorrent` | MejorTorrent | Spanish Tracker | Foreign: 🇪🇸 |
| `wolfmax4k` | Wolfmax4k | Spanish 4K Tracker | Foreign: 🇪🇸 |
| `cinecalidad` | Cinecalidad | Latin American / Spanish | Foreign: 🇲🇽 |
| `besttorrents` | BestTorrents | Polish Tracker | Foreign: 🇵🇱 |

---

### Quality Exclusion Filters (`qualityfilter`)

Filters out releases matching specific quality attributes, codecs, or resolution tags. Pass comma-separated values:

| Key | Label | Matching Behavior |
| :--- | :--- | :--- |
| `brremux` | BluRay REMUX | Matches releases tagged with `BluRay REMUX` in the binge group. |
| `hdrall` | HDR / HDR10+ / Dolby Vision | Matches any release carrying `HDR`, `HDR10+`, or `DV` flags. |
| `dolbyvision` | Dolby Vision | Matches releases having pure `DV` color profiles without HDR fallback. |
| `dolbyvisionwithhdr` | Dolby Vision + HDR | Matches releases containing both `DV` and `HDR` profiles. |
| `threed` | 3D | Matches stereoscopic 3D video content. |
| `nonthreed` | Non 3D | Inverts 3D check; drops all non-3D standard content. |
| `4k` | 4K | Matches 2160p / 4K releases. |
| `1080p` | 1080p | Matches Full HD (1080p) releases. |
| `720p` | 720p | Matches HD (720p) releases. |
| `480p` | 480p | Matches SD (480p) releases. |
| `other` | Other Formats | Matches non-standard resolutions (DVDRip, BDRip, WEBRip, HDTV, DivX, XviD). |
| `scr` | Screener | Matches `SCR` / Screener copies. |
| `cam` | Cam / TeleSync | Matches `CAM`, `TeleSync`, `TeleCine`. |
| `unknown` | Unknown Quality | Matches streams with undetermined resolution/quality. |

---

### Size Caps (`sizefilter`)

Filters out releases exceeding defined file sizes.
Values are case-insensitive and support standard units: `TB`, `GB`, `MB`, `kB` (e.g., `15GB`, `500MB`).

* **Single threshold**: `sizefilter=10GB` applies to both movies and series.
* **Dual threshold**: `sizefilter=20GB,3GB` applies the first value (`20GB`) to movies, and the second (`3GB`) to television episodes.

---

### Result Limits (`limit`)

Controls the maximum number of streams returned:
* **Syntax**: `limit=<integer>` (e.g., `limit=4`)
* **Behavior with quality-based sorting (`quality`, `qualitysize`)**: Sets the maximum streams returned **per resolution tier** (e.g., 4 streams for 4K, 4 streams for 1080p, etc.).
* **Behavior with flat sorting (`seeders`, `size`)**: Sets the **total** stream count returned.

---

### Language Prioritization (`language`)

Prioritizes audio tracks or dubbed releases containing the specified language. Matching streams are hoisted to the top of the stream list.

* **Syntax**: `language=<code1>,<code2>`
* **Supported language codes**:
  `english`, `japanese`, `russian`, `italian`, `portuguese`, `spanish`, `latino`, `korean`, `chinese`, `taiwanese`, `french`, `german`, `dutch`, `hindi`, `telugu`, `tamil`, `polish`, `lithuanian`, `latvian`, `estonian`, `czech`, `slovakian`, `slovenian`, `hungarian`, `romanian`, `bulgarian`, `serbian`, `croatian`, `ukrainian`, `greek`, `danish`, `finnish`, `swedish`, `norwegian`, `turkish`, `arabic`, `persian`, `hebrew`, `vietnamese`, `indonesian`, `malay`, `thai`, `dubbed`, `multi audio`, `multi subs`, `dual audio`.

---

### Debrid Services & API Keys

Torrentio integrates with debrid cloud seedboxes to inspect cache availability and generate secure, high-speed direct download/playback URLs.

| Service | Configuration Parameter Key | Credential Format | Cache Tag in Output |
| :--- | :--- | :--- | :--- |
| **Real-Debrid** | `realdebrid` | API Token (e.g., `realdebrid=ABC123XYZ...`) | `[RD+]` / `[RD download]` |
| **AllDebrid** | `alldebrid` | API Key (e.g., `alldebrid=APIKEY...`) | `[AD+]` / `[AD download]` |
| **Premiumize** | `premiumize` | API Key (e.g., `premiumize=APIKEY...`) | `[PM+]` / `[PM download]` |
| **TorBox** | `torbox` | API Key (e.g., `torbox=APIKEY...`) | `[TB+]` / `[TB download]` |
| **Debrid-Link** | `debridlink` | API Key (e.g., `debridlink=APIKEY...`) | `[DL+]` / `[DL download]` |
| **EasyDebrid** | `easydebrid` | API Key (e.g., `easydebrid=APIKEY...`) | `[ED+]` *(cached only)* |
| **Offcloud** | `offcloud` | API Key / Token | `[OC+]` / `[OC download]` |
| **Put.io** | `putio` | `clientId@oauthToken` (e.g., `putio=123@TOKEN`) | `[Putio+]` / `[Putio download]` |
| **HighWay** | `highway` | API Key | `[HW+]` / `[HW download]` |

> 🔒 **Security Notice**: Credentials passed in Torrentio URLs are transmitted over HTTPS to the hosting instance. Self-hosted instances or private proxies should be used if public URL sharing is a concern.

---

### Debrid Behavior Flags (`debridoptions`)

Governs how debrid streams and catalogs are presented. Pass comma-separated values:

| Option Key | Effect |
| :--- | :--- |
| `nodownloadlinks` | Hides uncached debrid download triggers (`[RD download]`), showing only instantly streamable cached torrents (`[RD+]`). |
| `nocatalog` | Suppresses personal cloud storage catalog feeds in Stremio. |

Example:
```text
debridoptions=nodownloadlinks,nocatalog
```

---

### Pre-configured Presets

Torrentio includes hardcoded pre-configurations accessible via keyword aliases:

* `lite`: Limits providers to primary English indexers, drops cam/scr, sets `limit=1`.
* `brazuca`: Restricts providers to Brazilian/Portuguese sources and prioritizes Portuguese audio.

Usage:
```http
GET https://torrentio.strem.fun/lite/stream/movie/tt0137523.json
```

---

## 5. Stream Query Endpoints & ID Formats

The stream resolution endpoint follows the Stremio Addon standard:
```text
GET /:config/stream/:type/:id.json
```

### Movies (IMDb)
* **`:type`**: `movie`
* **`:id`**: Canonical IMDb identifier (`tt` followed by digits).

```http
GET https://torrentio.strem.fun/sort=qualitysize/stream/movie/tt0137523.json
```

---

### Series & Episodes (IMDb)
* **`:type`**: `series`
* **`:id`**: `<imdb_id>:<season_number>:<episode_number>`

```http
GET https://torrentio.strem.fun/sort=qualitysize/stream/series/tt0903747:1:1.json
```
*(Queries Breaking Bad Season 1, Episode 1)*

---

### Anime (Kitsu)
* **`:type`**: `anime` (or `series` depending on client catalog)
* **`:id`**: `kitsu:<kitsu_id>` (for films) or `kitsu:<kitsu_id>:<episode_number>`

```http
GET https://torrentio.strem.fun/sort=qualitysize/stream/anime/kitsu:12:1.json
```

---

## 6. Catalog & Metadata Endpoints (Debrid)

When a debrid service is authenticated and `nocatalog` is not present, Torrentio exposes catalogs reflecting the user’s personal debrid torrent cloud:

```http
GET https://torrentio.strem.fun/:config/catalog/other/realdebrid.json
GET https://torrentio.strem.fun/:config/meta/other/realdebrid:ITEM_ID.json
```

---

## 7. API Response Schemas & Field Extraction

Torrentio returns a standard JSON object containing an array of `streams`.

### P2P Torrent Response Model

When no debrid service is configured, Torrentio outputs raw torrent streaming specifications:

```json
{
  "streams": [
    {
      "name": "Torrentio
1080p",
      "title": "Fight.Club.1999.1080p.BluRay.x264-SPARKS
👤 142 💾 8.74 GB ⚙️ RARBG
🇬🇧 English",
      "infoHash": "9b9542a138db996b797e84ca3b8f654b79be7234",
      "fileIdx": 0,
      "sources": [
        "tracker:udp://tracker.opentrackr.org:1337/announce",
        "tracker:udp://open.demonii.com:1337/announce"
      ],
      "behaviorHints": {
        "bingeGroup": "torrentio|1080p|rarbg",
        "filename": "fight.club.1999.1080p.bluray.x264-sparks.mkv"
      }
    }
  ]
}
```

#### Field Glossary:
* `name`: Multiline header string:
  * Line 1: Addon Name (`Torrentio`)
  * Line 2: Resolution & HDR indicators (`1080p`, `4k HDR | DV`)
* `title`: Multiline descriptive metadata string:
  * Line 1: Torrent release title.
  * Line 2: Extracted metrics containing Seeders (`👤 <count>`), File Size (`💾 <size> <unit>`), and Indexer Source (`⚙️ <provider>`).
  * Line 3+: Audio language flags / tags.
* `infoHash`: 40-character hexadecimal BitTorrent infohash.
* `fileIdx`: 0-indexed file position within multi-file torrent archives.
* `sources`: Public BitTorrent tracker announce URLs.
* `behaviorHints.bingeGroup`: Cluster identifier used by media players for episode auto-play.

---

### Debrid Cached Stream Response Model

When a debrid provider is configured and the torrent is cached:

```json
{
  "streams": [
    {
      "name": "[RD+] Torrentio
4k | HDR",
      "title": "Fight.Club.1999.2160p.UHD.BluRay.x265-TERMiNAL
💾 24.3 GB ⚙️ 1337x
🇬🇧 English / Multi Audio",
      "url": "https://torrentio.strem.fun/realdebrid=KEY.../resolve/stream?infoHash=...&fileIdx=0",
      "behaviorHints": {
        "bingeGroup": "torrentio|2160p|1337x",
        "filename": "Fight.Club.1999.2160p.UHD.BluRay.x265-TERMiNAL.mkv"
      }
    }
  ]
}
```

* `name`: Prefix `[<DEBRID_SHORT>+]` indicates the file is cached and streamable immediately without P2P seeding.
* `url`: HTTP/HTTPS link that resolves via an HTTP `302 Found` redirect directly into the high-speed debrid CDN file URL.

---

### Parsing Metadata from Stream Titles

Because Torrentio packages file size, seeder count, and provider inside the `title` string, clients can parse them using regex:

```javascript
// Extract Seeders
const seedersMatch = stream.title.match(/👤\s*(\d+)/);
const seeders = seedersMatch ? parseInt(seedersMatch[1], 10) : 0;

// Extract File Size
const sizeMatch = stream.title.match(/💾\s*([\d.]+\s*[TGMk]?B)/i);
const size = sizeMatch ? sizeMatch[1] : null;

// Extract Provider
const providerMatch = stream.title.match(/⚙️?\s*([^\n]+)/);
const provider = providerMatch ? providerMatch[1].trim() : null;
```

---

## 8. Practical Usage Examples & Recipes

### 1. High-Performance Debrid Setup (4K/1080p Only, No CAMs, No Uncached)
```text
https://torrentio.strem.fun/realdebrid=YOUR_KEY|sort=qualitysize|qualityfilter=cam,scr,480p,720p,other|debridoptions=nodownloadlinks/stream/movie/tt0137523.json
```

### 2. Bandwidth-Constrained / Mobile Setup
Filters out files exceeding 3GB, removes 4K and REMUX releases, sorts by size:
```text
https://torrentio.strem.fun/sort=size|qualityfilter=4k,brremux,cam,scr|sizefilter=3GB|limit=5/stream/movie/tt0137523.json
```

### 3. Pure P2P Seeder Priority (Zero Debrid)
Queries public trackers, removes low-quality copies, ranks purely by most active seeders:
```text
https://torrentio.strem.fun/providers=1337x,torrentgalaxy,thepiratebay,rarbg|sort=seeders|qualityfilter=cam,scr/stream/movie/tt0137523.json
```

### 4. Dedicated Anime Configuration
Enables dedicated anime trackers and prioritizes Japanese audio:
```text
https://torrentio.strem.fun/providers=nyaasi,tokyotosho,anidex,nekobt|language=japanese|sort=qualitysize/stream/series/kitsu:12:1.json
```

---

## 9. Error Handling, Rate Limiting & Operational Notes

1. **HTTP 403 Forbidden / Cloudflare Protection**:
   The public instance (`torrentio.strem.fun`) is fronted by Cloudflare. Automated scripts and raw curl requests lacking typical browser headers (`User-Agent`, standard accept headers) or making high-frequency bursts may trigger Cloudflare managed challenges or rate limits.
2. **Rate Limiting**:
   Torrentio enforces an internal Express/Redis rate limiter keyed by client IP (default window: 24 hours, ~5,000 requests per IP on public nodes).
3. **Empty Stream Results (`{ "streams": [] }`)**:
   Returned if the media ID does not exist in indexed databases, if strict `qualityfilter` or `sizefilter` rules exclude all candidate releases, or if an invalid IMDb/Kitsu ID format is requested.
4. **Debrid Service Outages & Circuit Breaker**:
   Torrentio uses internal circuit breakers for debrid API calls. If a debrid provider experiences excessive timeouts, Torrentio temporarily pauses queries to that provider to avoid blocking stream responses.
