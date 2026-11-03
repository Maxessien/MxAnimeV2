import axios from "axios";
import {
  anitomyParser,
  APIFY_ACTOR_ID,
  apifyClient,
  downloadTasks,
  malIdSubplMap,
  pttParser,
  seedrCl,
  subsplease,
} from "../configs/config.js";
import { Tasks } from "../types/show.js";
import {
  ParsedTorrentioStream,
  PikPakResponse,
  PikPakTaskResponse,
} from "../types/torrentio.js";
import { TorrentResultItems } from "../types/apify.js";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL;

const convertRes = (qualityString: string | null) => {
  if (!qualityString) return 0;

  // Convert to lowercase to handle P, K, etc.
  const cleanStr: string = qualityString.toLowerCase().trim();

  // 1. Handle explicit "K" shorthand resolutions first
  if (cleanStr.includes("4k")) return 3840;
  if (cleanStr.includes("8k")) return 7680;
  if (cleanStr.includes("2k")) return 2560;

  // 2. Extract the digits from formats like "1080p", "p720", "1440", etc.
  const match: RegExpMatchArray | null = cleanStr.match(/\d+/);
  if (!match) return 0;

  const width: number = parseInt(match[0], 10);
  return width;
};

const pollForProg = async (
  fileId: string,
  taskId: string,
  pollUpdate: (prog: number) => void,
) => {
  let transfer: PikPakResponse | undefined;

  let prog = 0;
  let progInc = 21;

  while (!transfer || transfer.status !== "done") {
    const { data } = await axios.get<PikPakResponse>(
      `${PYTHON_SERVER_URL}/status`,
      {
        params: { file_id: fileId, task_id: taskId },
      },
    );
    pollUpdate(prog);
    transfer = data;

    if (prog + progInc < 99) prog += progInc;

    if (progInc > 1) progInc -= 5;
  }

  pollUpdate(100);

  return transfer;
};

const downloadTorrent = async (
  magnetUri: string,
  epInfo: Tasks["epInfo"],
  taskId: number,
  baseProg: number = 0,
  maxProg: number = 25,
) => {
  const { data } = await axios.post<PikPakTaskResponse>(
    `${PYTHON_SERVER_URL}/task`,
    { magUri: magnetUri },
  );

  let tr = await pollForProg(data.file_id, data.id, (prog) => {
    downloadTasks.set(taskId, {
      epInfo,
      progress: prog * ((maxProg - baseProg) / 100) + baseProg,
      status: "pending",
    });
  });

  return tr.info;
};

const downloadTorrentSeedr = async (
  magnetUri: string,
  epInfo: Tasks["epInfo"],
  taskId: number,
  baseProg: number = 0,
  maxProg: number = 25,
) => {
  const { user_torrent_id } = await seedrCl.tasks.addMagnet(magnetUri);
  const folder = await seedrCl.tasks.waitForTask(user_torrent_id!, {
    onProgress: (s) => {
      downloadTasks.set(taskId, {
        epInfo,
        progress: s.progress * ((maxProg - baseProg) / 100) + baseProg,
        status: "pending",
      });
    },
  });

  const contents = await seedrCl.folders.list(folder!.id);
  const link = await seedrCl.files.getDownloadUrl(
    contents.files[0]!.folder_file_id,
  );
  return {
    url: link.url,
    delFn: async () => {
      await seedrCl.files.delete(contents.files[0]!.folder_file_id);
    },
  };
};

const downloadTorrentToApify = async (magUri: string, ep: number) => {
  const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.actor(APIFY_ACTOR_ID).call(
    {
      magnetUri: magUri,
    },
    { timeout: 3600, memory: 1024 },
  );

  const { items } = await apifyClient
    .dataset<TorrentResultItems>(defaultDatasetId)
    .listItems();

  const chosen = items.find((v) => {
    const anitomyParsed = anitomyParser(v.name);
    const pttParsed = pttParser(v.name);

    console.log(pttParsed, anitomyParsed)
    console.log("parsed")

    return (
      v.name &&
      (
        anitomyParsed?.episode.number === ep ||
        pttParsed.episode === ep
      )
    );
  });

  if (!chosen) throw new Error("Torrent not found");

  const url = `https://api.apify.com/v2/key-value-stores/${defaultKeyValueStoreId}/records/${chosen.downloadKey}`

  return { chosen: {...chosen, downloadUrl: url}, defaultKeyValueStoreId, defaultDatasetId };
};

const getSubplTorrent = async (
  malId: string | number,
  eid: string | number,
): Promise<null | ParsedTorrentioStream[]> => {
  try {
    const mapping = malIdSubplMap.get(malId);

    if (!mapping) return null;

    const show = await subsplease.getShow(mapping.slug);
    let torr: ParsedTorrentioStream[] | null = null;

    for (const ep of show.episodes) {
      if (Number(ep.episode) === Number(eid)) {
        torr = ep.downloads.map(({ res, magnet }) => ({
          resolution: res,
          magUri: magnet,
        }));
      }
    }

    return torr;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export {
  getSubplTorrent,
  downloadTorrent,
  downloadTorrentToApify,
  downloadTorrentSeedr,
  convertRes
};
