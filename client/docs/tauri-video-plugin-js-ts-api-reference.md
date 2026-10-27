# `@get-air/video-tauri` JavaScript / TypeScript API Reference

**Scope:** Public JavaScript/TypeScript API for the Tauri 2 adapter, together with the shared `@get-air/video` contracts required to use it. This reference is based on the repository's `main` branch and package metadata inspected on 2026-10-26 (adapter package version `0.4.0`). Native Rust/Kotlin command APIs and internal implementation helpers are not public JS APIs and are not documented as such here.

> The Tauri package is an adapter, not a standalone player. It adds a native `tauri` backend to the shared Air Video client. Import the adapter from `@get-air/video-tauri`; import shared React/TV integrations and their controls from `@get-air/video/*`.

## Contents

1. [Installation and runtime setup](#installation-and-runtime-setup)
2. [Package entry points and exports](#package-entry-points-and-exports)
3. [Quick start](#quick-start)
4. [Public API reference](#public-api-reference)
   - [TauriVideoClientOptions](#taurivideoclientoptions)
   - [Playback configuration types](#playback-configuration-types)
   - [tauriVideoBackend](#taurivideobackend)
   - [createTauriVideoClient](#createtaurivideoclient)
   - [attachVideo](#attachvideo)
   - [attachTauriVideo](#attachtaurivideo)
   - [attachTauriBackend](#attachtauribackend)
   - [Protocol diagnostics](#protocol-diagnostics)
   - [Controls registration](#controls-registration)
   - [Effect integration](#effect-integration)
5. [Shared controller and source APIs](#shared-controller-and-source-apis)
6. [Events](#events)
7. [Subtitles](#subtitles)
8. [Capabilities and platform behavior](#capabilities-and-platform-behavior)
9. [Errors and compatibility](#errors-and-compatibility)
10. [Practical recipes](#practical-recipes)
11. [API surface boundaries](#api-surface-boundaries)

---

## Installation and runtime setup

Install both the shared controller package and the Tauri adapter:

```sh
npm install @get-air/video @get-air/video-tauri
```

Add the native Rust plugin to the Tauri application, register it, and grant the window capability required by the plugin:

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-video = "0.4"
```

```rust
// src-tauri/src/lib.rs
 tauri::Builder::default()
    .plugin(tauri_plugin_video::init())
    .run(tauri::generate_context!())?;
```

Add `video:default` to the capability used by the Tauri window. If permissions are enumerated individually, the diagnostics call also requires `video:allow-native-diagnostics`.

The API requires a supported Tauri runtime and platform. The repository documents Linux, Windows, and Android/Android TV support; macOS and iOS are not supported by this adapter. Available engines depend on platform and native build features. Keep the npm adapter and Rust crate on a compatible release line.

## Package entry points and exports

### `@get-air/video-tauri`

The root entry exports the Tauri client helpers, native playback option types, Tauri diagnostics, controls registration, and the shared `@get-air/video` exports. In practice, the most commonly used values are:

```ts
import {
  attachTauriVideo,
  attachVideo,
  createTauriVideoClient,
  getTauriVideoDiagnostics,
  tauriVideoBackend,
  verifyTauriVideoProtocol,
  type NativeVideoBackend,
  type TauriPlaybackOptions,
} from '@get-air/video-tauri'
```

The shared core types are re-exported as types, including `AttachVideoOptions`, `VideoClient`, `VideoController`, `VideoSource`, and `HttpTransport`.

### `@get-air/video-tauri/effect`

This entry exports the shared `@get-air/video/effect` API, `VideoNativeProtocolMismatchError`, `layerTauriVideoBackend`, and the default `TauriVideoBackendLive` layer.

### Shared package subpaths

Import integrations and shared APIs from the shared package, for example:

```ts
import { VideoPlayer } from '@get-air/video/react'
import { registerVideoControls } from '@get-air/video/controls'
```

The Tauri adapter's own control registration is also re-exported from the root entry.

---

## Quick start

```ts
import { createTauriVideoClient } from '@get-air/video-tauri'

const video = document.querySelector<HTMLVideoElement>('#movie')!
const client = createTauriVideoClient()

const player = await client.attach(video, {
  source: 'https://media.example.com/movie.mp4',
  backend: 'tauri',
})

await player.play()
```

To choose an engine and provide platform-specific tuning:

```ts
const client = createTauriVideoClient({
  playback: {
    engine: 'gstreamer',
    linux: { buffer: { maxSeconds: 15 } },
  },
})

const player = await client.attach(video, {
  source: {
    uri: 'https://media.example.com/movie.mkv',
    headers: { Authorization: 'Bearer …' },
  },
  backend: 'tauri',
})
```

Use a placeholder for credentials in examples and load real credentials through your application's secure configuration. Do not hard-code secrets in client code.

---

# Public API reference

## `TauriVideoClientOptions`

```ts
interface TauriVideoClientOptions extends VideoClientOptions {
  readonly playback?: TauriPlaybackOptions
}
```

Options passed to `createTauriVideoClient`.

| Property | Type | Optional | Meaning |
|---|---|---:|---|
| `playback` | `TauriPlaybackOptions` | Yes | Default native engine and platform settings for Tauri attachments made by the client. |
| `adapters` | `readonly VideoBackendAdapter[]` | Yes, inherited | Additional backend adapters to register after the Tauri adapter. |
| `http` | `HttpTransport` | Yes, inherited | Default Request-based transport for shared-core backends that use it. |

The adapter places its own Tauri backend first in the adapter registry, followed by the `adapters` supplied by the caller. Per-attachment `backendOptions.tauri` settings override client defaults, including nested platform and buffer options.

## Playback configuration types

### `NativeVideoBackend`

```ts
type NativeVideoBackend = 'media3' | 'libvlc' | 'gstreamer' | 'mpv'
```

Selects a native playback engine. Availability is platform/build dependent. The adapter may leave engine selection to the platform by omitting `engine`.

### `TauriPlaybackOptions`

```ts
interface TauriPlaybackOptions {
  engine?: NativeVideoBackend
  android?: AndroidPlaybackOptions
  androidTv?: AndroidPlaybackOptions
  linux?: LinuxPlaybackOptions
  windows?: WindowsPlaybackOptions
}
```

| Property | Type | Meaning |
|---|---|---|
| `engine` | `NativeVideoBackend` | Explicit native engine selection. Omit to use the platform default. |
| `android` | `AndroidPlaybackOptions` | Settings applied on Android. |
| `androidTv` | `AndroidPlaybackOptions` | Android TV overrides, merged over `android` when the attachment is identified as TV. |
| `linux` | `LinuxPlaybackOptions` | Linux-specific buffering configuration. |
| `windows` | `WindowsPlaybackOptions` | Windows-specific buffering configuration. |

### `NativeBufferOptions`

```ts
interface NativeBufferOptions {
  minSeconds?: number
  maxSeconds?: number
  playSeconds?: number
  rebufferSeconds?: number
  maxBytes?: number
}
```

| Property | Type | Meaning |
|---|---:|---|
| `minSeconds` | `number` | Minimum buffer target, in seconds. |
| `maxSeconds` | `number` | Maximum buffer target, in seconds. |
| `playSeconds` | `number` | Buffer threshold/target used to start or resume playback. |
| `rebufferSeconds` | `number` | Buffer threshold/target used after rebuffering. |
| `maxBytes` | `number` | Encoded-data buffer target in bytes. This is not a process-memory cap: decoded frames, decoder surfaces, GPU textures, and WebView memory are outside it. |

Omitting buffer overrides leaves cache policy to the selected native engine. Supplied time values are converted from seconds to rounded milliseconds in the adapter. Values are native-engine tuning requests, not guaranteed memory limits.

### `AndroidPlaybackOptions`

```ts
interface AndroidPlaybackOptions {
  buffer?: NativeBufferOptions
  decoderFallback?: boolean
  dolbyVision?: 'hevc-base-layer' | 'platform'
  tunneling?: boolean
}
```

| Property | Type | Meaning |
|---|---|---|
| `buffer` | `NativeBufferOptions` | Android buffer tuning. |
| `decoderFallback` | `boolean` | Allows Media3 to try another installed MediaCodec decoder when needed; does not switch to another playback engine. |
| `dolbyVision` | `'hevc-base-layer' | 'platform'` | Dolby Vision handling mode where supported. `hevc-base-layer` requests the HEVC base-layer behavior; `platform` leaves behavior to the platform. |
| `tunneling` | `boolean` | Requests tunneled playback where supported by the selected Android engine and device. |

### `LinuxPlaybackOptions` and `WindowsPlaybackOptions`

```ts
interface LinuxPlaybackOptions { buffer?: NativeBufferOptions }
interface WindowsPlaybackOptions { buffer?: NativeBufferOptions }
```

Each type has one optional `buffer` property. The selected native engine remains responsible for actual buffering and playback capabilities.

## `tauriVideoBackend`

```ts
function tauriVideoBackend(
  defaults: TauriPlaybackOptions = {},
): VideoBackendAdapter
```

Creates the adapter object used by the shared backend registry.

### Parameter

- `defaults`: Native playback defaults to use when the adapter opens a Tauri attachment. Defaults to `{}`.

### Return value

A `VideoBackendAdapter` with:

- `id: 'tauri'`
- `isAvailable(context)`: returns whether a Tauri runtime is present and the user agent matches Android, Linux, or Windows.
- `open(context)`: opens a native Tauri backend for the supplied HTML video element and attachment options.

This is mainly useful for custom client or Effect registry construction. Most applications should use `createTauriVideoClient` or `layerTauriVideoBackend` instead.

## `createTauriVideoClient`

```ts
function createTauriVideoClient(
  options: TauriVideoClientOptions = {},
): VideoClient
```

Creates an isolated shared `VideoClient` with the Tauri adapter installed.

### Parameter

- `options`: `TauriVideoClientOptions`. Optional defaults to `{}`.

### Return value

A normal `VideoClient`. Its `attach(element, options)` method returns `Promise<VideoController>`. Client instances do not mutate shared global client state; reuse the same client for components that should share its configuration.

### Default/override behavior

- Tauri adapter defaults come from `options.playback`.
- Additional adapters in `options.adapters` are registered after the Tauri adapter.
- Attachment-level `backendOptions.tauri` overrides client-level `playback` settings.
- Nested platform options and buffer properties are merged, not replaced wholesale.

## `attachVideo`

```ts
function attachVideo(
  element: HTMLVideoElement,
  options: AttachVideoOptions,
): Promise<VideoController>
```

Attaches an element using the module's default Tauri-enabled client, while retaining the common core behavior: the default backend is still `html` unless you explicitly request a backend. This function does **not** force Tauri.

### Parameters

- `element`: The real `<video>` element to use as the player's DOM anchor.
- `options`: Shared attachment options, including `source`, optional backend chain, fallback backends, platform options, subtitles, autoplay, signal, and control regions.

### Return value

A promise that resolves to a stable `VideoController` once an eligible backend successfully opens. The controller can survive source replacement through `load()`.

Use this when you want the common client selection/fallback behavior or built-in HTML playback by default.

## `attachTauriVideo`

```ts
function attachTauriVideo(
  element: HTMLVideoElement,
  options: AttachVideoOptions,
): Promise<VideoController>
```

Attaches through the module's default client while forcing `backend: 'tauri'`.

### Parameters

- `element`: HTML video anchor.
- `options`: Shared attachment options. The function overrides `options.backend` to `'tauri'` while preserving the other options.

### Return value

`Promise<VideoController>` resolving after native attachment. The controller API is the common shared API, not a separate Tauri-specific controller type.

## `attachTauriBackend`

```ts
function attachTauriBackend(
  element: HTMLVideoElement,
  options: AttachVideoOptions,
  defaults: TauriPlaybackOptions = {},
): Promise<BackendVideoController>
```

Opens the raw native Tauri backend without wrapping it in the shared stable switching controller. Intended for advanced adapter-registry or Effect integrations.

### Parameters

- `element`: HTML video anchor.
- `options`: Shared attachment configuration. The Tauri playback configuration is read from `options.backendOptions?.tauri`.
- `defaults`: Optional Tauri playback defaults, merged with the attachment settings.

### Return value

`Promise<BackendVideoController>`, the internal backend-level controller contract. Prefer `VideoController` from `createTauriVideoClient` for ordinary application code because it includes stable source switching and common lifecycle semantics.

## Protocol diagnostics

### Constants

```ts
const TAURI_VIDEO_PROTOCOL_VERSION: 1
const TAURI_VIDEO_PACKAGE_NAME: '@get-air/video-tauri'
const TAURI_VIDEO_PACKAGE_VERSION: '0.4.0' // as published in the inspected source
```

These identify the npm-to-native command protocol and adapter package. Protocol compatibility is separate from package versioning; use a compatible adapter/crate pair.

### `NativeVideoPluginDiagnostics`

```ts
interface NativeVideoPluginDiagnostics {
  readonly protocolVersion: number
  readonly crateName: string
  readonly crateVersion: string
}
```

Native Rust plugin identity and protocol fields returned by diagnostics.

### `TauriVideoDiagnostics`

```ts
interface TauriVideoDiagnostics extends NativeVideoPluginDiagnostics {
  readonly packageName: typeof TAURI_VIDEO_PACKAGE_NAME
  readonly packageVersion: string
}
```

Combined JS adapter and native crate identity.

### `getTauriVideoDiagnostics`

```ts
function getTauriVideoDiagnostics(): Promise<TauriVideoDiagnostics>
```

Invokes the native `native_diagnostics` command and returns protocol version plus package/crate identity. This call reads diagnostics; it does not open a player or modify playback state. It requires the Tauri runtime and corresponding permission.

### `verifyTauriVideoProtocol`

```ts
function verifyTauriVideoProtocol(): Promise<TauriVideoDiagnostics>
```

Checks that the installed JavaScript adapter and native plugin speak the expected protocol before stateful native commands are issued. Successful verification is cached per JS module. A failed check is not permanently cached, so transient startup or invoke failures can be retried. A mismatch rejects with `VideoNativeProtocolMismatchError` (or its tagged equivalent through the configured error factory).

## Controls registration

### `VideoControlsTarget`

A shared controls target accepted by the core control system: one DOM `Element` or an iterable of DOM `Element`s.

### `VIDEO_CONTROLS_ATTRIBUTE`

A shared marker attribute for declaratively identifying intended video controls. Use the exported constant rather than hard-coding the attribute name.

### `registerVideoControls`

```ts
function registerVideoControls(target: VideoControlsTarget): () => void
```

Registers arbitrary DOM elements as intentional video UI. The elements can be anywhere in the document; they do not have to be children of the video or overlap it.

- **Parameter:** `target`, one Element or iterable of Elements.
- **Return:** An idempotent cleanup function. Call it when the controls are removed or no longer belong to the player.

The registration allows the native surface compositor to account for intentional UI/occlusion around the native video surface.

### `VideoController.registerControls`

The same capability is available on a controller:

```ts
player.registerControls(target): () => void
```

The returned cleanup unregisters only that registration. Calling it more than once is safe.

## Effect integration

Import from `@get-air/video-tauri/effect`:

```ts
import {
  layerTauriVideoBackend,
  TauriVideoBackendLive,
  VideoPlayerService,
  attachVideoEffect,
} from '@get-air/video-tauri/effect'
```

### `layerTauriVideoBackend`

```ts
function layerTauriVideoBackend(
  defaults: TauriPlaybackOptions = {},
): ReturnType<typeof layerVideoBackends>
```

Creates a shared video backend-registry layer with the Tauri adapter installed. The optional `defaults` parameter has the same meaning as in `tauriVideoBackend`.

### `TauriVideoBackendLive`

A prebuilt default Tauri backend registry layer equivalent to `layerTauriVideoBackend()`.

### Shared Effect APIs

The Effect entry re-exports the core Effect API, including `VideoPlayerService`, `VideoBackendRegistryService`, `layerVideoBackends`, `attachVideoEffect`, and `EffectVideoController`. Consult the shared `@get-air/video/effect` API for the full Effect signatures and error channel. The controller methods have the same conceptual inputs as the Promise controller, but return `Effect.Effect<Success, VideoPlayerError>` values instead of Promises/void.

---

# Shared controller and source APIs

These are core `@get-air/video` contracts used by the adapter, not Tauri-specific functions.

## `VideoSource`

```ts
interface VideoSource {
  uri: string
  headers?: Record<string, string>
  cookies?: string
  userAgent?: string
  referrer?: string
  tlsCaFile?: string
  startPositionSeconds?: number
}
```

- `uri`: Media URI.
- `headers`: Arbitrary request headers where supported.
- `cookies`, `userAgent`, `referrer`: Source metadata passed to a backend that supports them.
- `tlsCaFile`: Native trust configuration path where supported.
- `startPositionSeconds`: Initial playback position in seconds.

A source can also be supplied as a plain string URI. Support for source properties varies by backend; check `player.capabilities` and platform notes.

## `AttachVideoOptions`

```ts
interface AttachVideoOptions {
  source: string | VideoSource
  backend?: VideoBackend | readonly VideoBackend[]
  fallbackBackends?: readonly VideoBackend[]
  backendOptions?: VideoBackendOptions
  routing?: VideoRoutingOptions
  http?: HttpTransport
  suspendWhenHidden?: boolean
  autoplay?: boolean
  deviceProfile?: 'auto' | 'mobile' | 'tv' | 'desktop'
  controlRegions?: Element | Iterable<Element>
  subtitles?: readonly ExternalSubtitleTrack[]
  signal?: AbortSignal
}
```

| Property | Meaning |
|---|---|
| `source` | Required media URI or structured source. |
| `backend` | One backend ID or ordered backend chain. The common default is `html`; use `'tauri'` to require the native adapter. |
| `fallbackBackends` | Ordered fallbacks appended after the requested backend chain and de-duplicated. |
| `backendOptions` | Backend-specific options. For this adapter, use `backendOptions: { tauri: { ... } }`. |
| `routing` | Optional diagnostic callback for backend probing and selection. |
| `http` | Per-attachment Request-based transport override for core backends using it. |
| `suspendWhenHidden` | Whether the controller should suspend native playback when hidden. Defaults to true in the Tauri controller. |
| `autoplay` | Whether playback should start automatically. Defaults to false in the Tauri controller. |
| `deviceProfile` | Device hint. `'tv'` enables Android TV option merging. `'auto'` can infer TV from user-agent identifiers. |
| `controlRegions` | Element or iterable registered as intentional video controls at attach time. |
| `subtitles` | External WebVTT/SRT subtitle track descriptors for shared-core subtitle UI/cue handling. |
| `signal` | AbortSignal for cancelling attachment/lifecycle work. |

`VideoLoadOptions` is `Partial<AttachVideoOptions>` without `source` and is accepted by `player.load(source, options?)`.

## `VideoController`

The shared controller exposes a stable interface; the Tauri backend supplies the native playback implementation.

| Member | Signature | Behavior |
|---|---|---|
| `element` | `readonly HTMLVideoElement` | DOM anchor for the player and controls. |
| `sessionId` | `readonly string` | Unique identifier for the active controller session. |
| `capabilities` | `readonly PlayerCapabilities` | Active backend feature/capability report. |
| `media` | `readonly MediaInfo` | Current metadata, seek window, tracks, and chapters. |
| `tracks` | `readonly MediaTrack[]` | Convenience view of `media.tracks`. |
| `load` | `(source, options?) => Promise<void>` | Replaces the source/backend session while retaining the stable controller and subscriptions. |
| `play` | `() => Promise<void>` | Starts/resumes playback. |
| `pause` | `() => void` | Requests pause; the shared Promise controller exposes this as a synchronous call. |
| `seek` | `(positionSeconds: number) => Promise<void>` | Seeks to an absolute position in seconds. Live DVR seeks are clamped to the current seek window by the Tauri controller. |
| `selectTrack` | `(kind: TrackKind, trackId?: string) => Promise<void>` | Selects a media track; omitting the subtitle `trackId` disables the selected subtitle when supported. |
| `setVolume` | `(volume: number) => Promise<void>` | Sets volume; Tauri clamps to the interval 0 through 1. |
| `setPlaybackRate` | `(rate: number) => Promise<void>` | Unsupported by current Tauri native engines; expect a typed feature-unavailable failure. |
| `setVideoFit` | `(mode: VideoFitMode) => Promise<void>` | Requests `fit`, `cover`, or `stretch`; availability depends on engine. |
| `setVideoZoom` | `(scale: number) => Promise<void>` | Requests zoom. Tauri clamps supported zoom to 1 through 2; availability depends on engine. |
| `stats` | `() => Promise<SessionStats>` | Reads current telemetry. |
| `bufferedAhead` | `() => number` | Returns buffered seconds ahead of current playback position. |
| `playbackQuality` | `() => PlaybackQuality` | Returns frame counters and measured playback rate. |
| `refreshLayout` | `() => void` | Requests native surface layout recalculation. |
| `registerControls` | `(target) => () => void` | Registers controls/occluders, returning cleanup. |
| `destroy` | `() => Promise<void>` | Closes native playback, removes listeners/observers, and releases surface resources. Safe to call repeatedly. |
| `on` | `(type, listener, options?) => () => void` | Adds a typed event listener and returns unsubscribe cleanup. |

### `TrackKind`

```ts
type TrackKind = 'video' | 'audio' | 'subtitle'
```

### `VideoFitMode`

```ts
type VideoFitMode = 'fit' | 'cover' | 'stretch'
```

### `MediaInfo`

```ts
interface MediaInfo {
  durationSeconds?: number
  seekable: boolean
  seekableStartSeconds?: number
  seekableEndSeconds?: number
  live: boolean
  container?: string
  tracks: MediaTrack[]
  chapters: Chapter[]
}
```

For live non-VOD media, `durationSeconds` can be undefined. `seekableStartSeconds` and `seekableEndSeconds` describe the current absolute DVR window when exposed; the window can move over time. `seekable: false` means seeking is not available.

### `MediaTrack`

```ts
interface MediaTrack {
  id: string
  kind: TrackKind
  streamIndex: number
  codec: string
  caps: string
  label?: string
  language?: string
  selected: boolean
  default: boolean
  forced: boolean
  width?: number
  height?: number
  frameRate?: number
  channels?: number
  sampleRate?: number
}
```

Tauri native snapshots include track ID, index, kind, language, label, codec, and selected state. Additional shared-core fields can be absent/defaulted depending on native engine metadata.

### `PlayerCapabilities`

```ts
interface PlayerCapabilities {
  readonly backend: VideoBackendId
  readonly containers: 'platform' | readonly string[]
  readonly codecs: 'platform' | readonly string[]
  readonly drm: boolean | 'platform'
  readonly hdr: boolean | 'platform'
  readonly playbackRate: boolean
  readonly volume: boolean
  readonly videoFit: boolean
  readonly videoZoom: boolean
  readonly audioTrackSelection: boolean
  readonly subtitleTrackSelection: boolean
  readonly customHeaders: boolean
  readonly frameAccurateSeeking: boolean
}
```

`'platform'` means the chosen engine/runtime decides. Tauri reports native platform-dependent container/codec/DRM/HDR behavior. Current native engines do not support portable playback-rate changes or frame-accurate seeking.

### `SessionStats`

Includes `sessionId`, `encodedBytesBuffered`, `bufferedAheadSeconds`, optional video/audio codec and hardware backend, `decodedFrameCopies`, `droppedFrames`, optional average frame processing time and switching/seek/AV-drift measurements, plus `visible` and `playing` status.

### `PlaybackQuality`

Includes `presentedFrames`, optional `mediaTimeSeconds`, `measuredFps`, `totalVideoFrames`, `droppedVideoFrames`, and `droppedFramePercent`.

---

# Events

`player.on(type, listener, options?)` registers a listener and returns an unsubscribe function. Standard EventTarget APIs such as `addEventListener`/`removeEventListener` are also available.

| Event | Detail | When to use |
|---|---|---|
| `timeupdate` | `{ currentTime: number }` | Current playback position changed. |
| `bufferprogress` | `{ bufferedAhead: number }` | Buffered-ahead duration changed. |
| `trackchange` | `{ kind: TrackKind; trackId?: string }` | A selected audio/video/subtitle track changed. |
| `backendchange` | `{ previousBackend: VideoBackendId; backend: VideoBackendId }` | Shared stable controller switched the active backend. |
| `subtitlecuechange` | `{ trackId?: string; cues: readonly SubtitleCue[] }` | External subtitle cue set for the current time changed. |
| `error` | `VideoPluginError` with `code` and `message` | Player-level error event. |

Example:

```ts
const stopListening = player.on('trackchange', (event) => {
  console.log(event.detail.kind, event.detail.trackId)
})

// When no longer needed:
stopListening()
```

---

# Subtitles

There are two related subtitle paths. **Native embedded subtitle streams** are discovered and selected by the Tauri engine. **External subtitle sidecars** are represented by the shared-core subtitle API and rendered through the application's subtitle UI/cue integration. The low-level Tauri adapter does not turn a native `<track>` element into a native subtitle stream automatically.

## Embedded/native tracks

```ts
const subtitleTracks = player.tracks.filter((track) => track.kind === 'subtitle')

if (subtitleTracks.length) {
  await player.selectTrack('subtitle', subtitleTracks[0].id)
}

// Disable the active subtitle track, when the backend supports it:
await player.selectTrack('subtitle')
```

Track IDs are backend-provided identifiers. Use the ID from the current `player.tracks` list. A stale or unknown ID can reject. Availability and subtitle formats vary by source and native engine.

## External subtitle track descriptor

```ts
interface ExternalSubtitleTrack {
  id: string
  src?: string
  content?: string
  label?: string
  language?: string
  kind?: 'subtitles' | 'captions'
  default?: boolean
  format?: 'vtt' | 'srt'
  headers?: Record<string, string>
}
```

Supply descriptors through `AttachVideoOptions.subtitles`. A track can use a URL in `src` or inline `content`. `format` declares WebVTT or SRT when it cannot be inferred. `headers` can be supplied for loading a sidecar when the consuming core integration supports them. The core package owns parsing and cue events; check its integration/API documentation for UI-specific rendering behavior.

```ts
const player = await client.attach(video, {
  source: movieUrl,
  backend: 'tauri',
  subtitles: [
    {
      id: 'en',
      src: 'https://media.example.com/movie.en.vtt',
      label: 'English',
      language: 'en',
      kind: 'subtitles',
      default: true,
      format: 'vtt',
    },
  ],
})

player.on('subtitlecuechange', (event) => {
  renderSubtitleCues(event.detail.cues)
})
```

`SubtitleCue` has `id`, `startSeconds`, `endSeconds`, and `text` fields.

---

# Capabilities and platform behavior

The adapter installs backend ID `'tauri'`. The adapter's availability probe requires Tauri runtime globals and a user agent matching Android, Linux, or Windows. Runtime availability does not guarantee that every source codec/container or optional backend is installed.

| Platform | Default engine described by repository | Alternative / notes |
|---|---|---|
| Android / Android TV | Media3 | LibVLC is explicit; Android API 24+ documented. `androidTv` options merge over `android` for TV profile. |
| Linux | GStreamer | mpv is an explicit option when built with the relevant runtime feature. |
| Windows | GStreamer | Uses WebView2 TextureStream/native path as documented by repository. |
| macOS / iOS | Not supported | No Tauri native backend in the documented support matrix. |

Important capability notes:

- `playbackRate` is not supported by the current Tauri native engines.
- `frameAccurateSeeking` is not supported.
- Fit/zoom vary by engine. Linux GStreamer supports fit/stretch but not portable crop-to-cover or zoom; Linux mpv and Android/Windows document broader fit/zoom support.
- Custom source headers are supported by the adapter path, but other source-specific behavior remains engine-dependent.
- Subtitle/audio/video track discovery and selection are exposed through the shared controller; exact stream availability and behavior depend on demuxer, engine, and source.
- Live HLS/DASH support depends on engine runtime components and platform packaging.

Read `player.capabilities` at runtime rather than assuming all engine modes behave identically.

---

# Errors and compatibility

## `VideoNativeProtocolMismatchError`

The native Rust plugin and JS adapter do not speak the same command protocol, or the native diagnostic command is absent/invalid. This is a package compatibility/setup problem; install a compatible npm package and Rust crate pair. The error fields include:

- `expectedProtocolVersion: number`
- `actualProtocolVersion?: number`
- `packageName: string`
- `packageVersion: string`
- `crateName?: string`
- `crateVersion?: string`
- `message: string`
- `cause?: string`

The type is exported from the root and Effect entrypoints. In the root entry, the adapter configures the shared error factory so protocol mismatch remains a typed player error.

## `VideoFeatureUnavailableError`

Raised when a common operation is not supported by the active backend, such as playback-rate changes or a fit/zoom mode the engine cannot perform. It contains backend and feature information through the shared tagged error contract.

## Other common errors

The shared core also exposes `VideoBackendUnavailableError`, `VideoControllerStateError`, and `VideoLoadError`. Backend resolution may skip unavailable candidates or continue through the configured fallback chain; a required Tauri-only attachment can fail if the native adapter is unavailable or cannot open the source.

## Protocol verification

Before stateful native playback, the adapter calls native diagnostics and validates the protocol. The first successful verification is cached within the JS module. Failed checks remain retryable. Native `native_open` also checks protocol/package metadata before opening the native player.

---

# Practical recipes

## Use Tauri only, with an explicit backend

```ts
const player = await client.attach(video, {
  source: movieUrl,
  backend: 'tauri',
  backendOptions: { tauri: { engine: 'gstreamer' } },
})
```

## Let the shared client fall back

```ts
const player = await client.attach(video, {
  source: movieUrl,
  backend: ['tauri', 'html'],
})
```

Backend ordering/fallback is owned by the shared client. Check the selected backend using `player.capabilities.backend` and listen for `backendchange` if the stable controller can switch later.

## Use controller defaults and per-source override

```ts
const client = createTauriVideoClient({
  playback: {
    android: { decoderFallback: true },
    linux: { buffer: { maxSeconds: 15 } },
  },
})

const player = await client.attach(video, {
  source: movieUrl,
  backend: 'tauri',
  backendOptions: {
    tauri: { android: { buffer: { playSeconds: 2 } } },
  },
})
```

The per-attachment nested `playSeconds` value is merged with the client defaults; unspecified settings remain inherited.

## React integration

```tsx
import { VideoPlayer } from '@get-air/video/react'
import { createTauriVideoClient } from '@get-air/video-tauri'

const client = createTauriVideoClient()

export function Player({ source }: { source: string }) {
  return (
    <VideoPlayer
      client={client}
      source={source}
      options={{ backend: 'tauri' }}
    />
  )
}
```

The React integration is from `@get-air/video`; the adapter client is passed in. Keep cleanup/lifecycle ownership with the integration or call `player.destroy()` for imperative use.

## Abort attachment and clean up

```ts
const abort = new AbortController()

const player = await client.attach(video, {
  source: movieUrl,
  backend: 'tauri',
  signal: abort.signal,
  suspendWhenHidden: true,
})

// Later:
await player.destroy()
```

An already-aborted signal prevents opening. Aborting/tearing down should be coordinated with the owner of the player element. Always destroy an imperative controller when its owning view is disposed.

## Inspect active tracks and telemetry

```ts
console.table(player.tracks.map(({ id, kind, language, label, codec, selected }) => ({
  id, kind, language, label, codec, selected,
})))

const stats = await player.stats()
const quality = player.playbackQuality()
console.log({ bufferedAhead: player.bufferedAhead(), stats, quality })
```

---

# API surface boundaries

This document covers the **public package surface** and the shared contracts needed to use it. The repository also contains implementation details and internal symbols such as the raw native controller class, native layout/geometry helpers, WebView2 texture-stream plumbing, native command payloads, and protocol test utilities. Those are not stable application-facing APIs and are intentionally not presented as supported public functions.

For exact version-specific behavior, consult the package source and the platform-specific project documentation alongside this reference. Engine/runtime support can change independently of the TypeScript method signatures.
