import { FfprobeData } from "@ts-ffmpeg/fluent-ffmpeg";

interface GetShowsQuery {
    page: number
}

export interface Tasks {
  status: "pending" | "completed" | "error";
  progress: number;
  // data:
  //   | (FfprobeData["format"] & { url: string; key: string; bucket: string })
  // | null;
  epInfo: {malId: number; episodeId: number, season: number, quality: string}
}
