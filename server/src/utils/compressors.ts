import { createReadStream } from "node:fs";
import {
  cloudConvert,
  CLOUDFARE_APP_BUCKET,
  CLOUDFARE_URL,
  cloudflareAccessKey,
  cloudflareClient,
  cloudflareSecretKey,
  ffmpeg,
} from "../configs/config.js";
import { Upload } from "@aws-sdk/lib-storage";


const compressWithCl = async (
  s3Key: string,
  input: string,
  prog: (val: number) => void,
  inputType: "local" | "url",
  scalewidth: number,
) => {
  prog(20);
  const job = await cloudConvert.jobs.create({
    tasks: {
      import:
        inputType === "url"
          ? {
              operation: "import/url",
              url: input,
            }
          : { operation: "import/upload" },
      "convert-op": {
        operation: "convert",
        input: "import",
        output_format: "mkv",
        input_format: "mkv",
        engine: "ffmpeg",
        video_codec: "x265",
        crf: 33,
        preset: "medium",
        audio_codec: "opus",
        audio_bitrate: 96,
        subtitles_mode: "copy",
        width: scalewidth,
      },
      export: {
        operation: "export/s3",
        access_key_id: cloudflareAccessKey,
        bucket: CLOUDFARE_APP_BUCKET,
        secret_access_key: cloudflareSecretKey,
        input: "convert-op",
        region: "auto",
        key: s3Key,
        endpoint: CLOUDFARE_URL,
      },
    },
  });

  const uploadTask = job.tasks.find((task) => task.name === "import");

  if (!uploadTask) {
    throw new Error("Task not found");
  }

  if (inputType === "local") {
    const inputFile = createReadStream(input);
    await cloudConvert.tasks.upload(uploadTask, inputFile);
  }
  prog(45);
  const waitedJob = await cloudConvert.jobs.wait(job.id);

  if (waitedJob.status === "error") throw new Error("Job Failed");

  prog(90);
  const exportUrl = cloudConvert.jobs.getExportUrls(waitedJob)[0];

  prog(100);
  return exportUrl;
};

const compressWithFfmpeg = async (
  input: string,
  output: string,
  key: string,
  onError: () => void,
  prog: (val: number) => void,
  scalewidth: number,
) => {
  // 1. Run Ffmpeg and output to local temp file
  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg(input)
      .videoCodec("libx265") // Switched to high-efficiency HEVC
      .audioCodec("aac")
      .outputOptions("-crf 33")
      .outputOptions("-preset medium")
      .audioChannels(2)
      .audioBitrate("96k")
      .outputOptions("-pix_fmt yuv420p") // Forces standard 8-bit web color format
      .outputOptions("-tag:v hvc1") // Tells Apple/Chrome devices exactly how to decode the stream
      .outputOptions("-movflags +faststart")
      .format("matroska")
      .size(`${scalewidth}x`)
      .on("start", (command) => console.log("ffmpeg start", command))
      .on("error", (err) => {
        console.error("ffmpeg error", err);
        onError();
        reject(err);
      })
      .on("progress", ({ percent }) => {
        if (percent && percent >= 10) prog(percent - 10);
      })
      .on("end", () => {
        console.log("ffmpeg processing done");
        prog(90);
        resolve();
      });
    command.save(output); // Saves directly to local storage safely
  });

  // 2. Upload the finished file to Cloudflare R2 using AWS Lib-Storage Upload
  console.log("Uploading file to Cloudflare R2...");
  const fileStream = createReadStream(output);

  const parallelUploads3 = new Upload({
    client: cloudflareClient,
    params: {
      Bucket: CLOUDFARE_APP_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: "video/x-matroska",
    },
    // Optional configurations for tuning performance
    queueSize: 4,
    partSize: 1024 * 1024 * 5, // 5MB chunks
    leavePartsOnError: false,
  });

  await parallelUploads3.done();
};

export {compressWithCl, compressWithFfmpeg}
