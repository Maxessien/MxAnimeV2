export interface DefaultTimeStamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface DbEpisode extends DefaultTimeStamp {
  eId: string;
  sId: string;
  magnetUri: string;
  isCompressed: boolean;
  quality: number;
  malId: string;
  fileUrl?: string | null | undefined;
  manageInfo?:
    | {
        key?: string | null | undefined;
        bucket?: string | null | undefined;
      }
    | null
    | undefined;
  fileSize?: number | null | undefined;
}

export interface Tasks {
  status: "pending" | "completed" | "error";
  progress: number;
  epInfo: { malId: number; episodeId: number; season: number; quality: string };
}

export interface DownloadStatus {
  episode: Episode | null;
  status: Tasks;
}
