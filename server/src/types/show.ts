

export interface Tasks {
  status: "pending" | "completed" | "error";
  progress: number;
  epInfo: { malId: number; episodeId: number, season: number, quality: string },
  filename?: string
}

export interface AddQueryQualities {
  quality: string, magnetUri: string
}
