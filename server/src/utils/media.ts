import { UploadApiResponse } from "cloudinary";
import { SeedrVideo } from "seedr";
import { ffmpeg, seedr, uploader } from "../configs/config.js";

const downloadTorrent = async (magnetUri: string) => {
  const res = await seedr.addMagnet(magnetUri);
  const vids = await seedr.getVideos();

  return (
    vids
      .flat()
      .find(
        ({ name }) =>
          res.title.trim().toLowerCase() === name.trim().toLowerCase(),
      ) ?? null
  );
};

const compressTorrent = async (
  vid: SeedrVideo,
): Promise<UploadApiResponse | undefined> => {
  const file = await seedr.getFile(vid.id);

  return new Promise((resolve, reject) => {
    const uploadStream = uploader.upload_chunked_stream(
      { resource_type: "video", folder: "MxAnime", chunk_size: 6000000 },
      async (error, result) => {
        if (error) return reject(error);
        await clnUpTorrent(vid.id);
        resolve(result);
      },
    );

    ffmpeg(file.url)
      .videoCodec("libx264")
      .audioCodec("aac").format('flv')
      .on("error", reject).on("progress", ({percent})=> console.log(`${percent}% loading...`))
      .pipe(uploadStream, { end: true });
  });
};

const clnUpTorrent = async (id: string | number, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const contents = await seedr.deleteFile(id);

    if (contents.result && contents.success) return contents;
  }
};

export {
    clnUpTorrent,
    compressTorrent,
    downloadTorrent
};

