

export interface Tasks {
  status: "pending" | "completed" | "error";
  progress: number;
  epInfo: {malId: number; episodeId: number, season: number, quality: string}
}
