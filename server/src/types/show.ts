
type Services = "Seedr" | "Pikpak" | "Apify" | "Cloudconvert" | "Server" | "Ffmpeg"
type Stages = "Compression" | "Torrenting" | "Starting" | "Finishing"

export interface Tasks {
  status: "pending" | "completed" | "error";
  progress: number;
  epInfo: { malId: number; episodeId: number, season: number, quality: string },
  filename?: string
  stage: {
    name: Stages,
    service: Services
  } | null
}

export interface TaskCanceller {
  globalController: AbortController,
  stageControllers: {
    seedr: AbortController,
    pikpak: AbortController,
    apify: AbortController,
    cloudConvert: AbortController,
    ffmpeg: AbortController
  }
}

export interface AddQueryQualities {
  quality: string, magnetUri: string
}
