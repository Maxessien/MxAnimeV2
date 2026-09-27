import { randomInt } from 'node:crypto';
import app from './configs/app.js';
import { downloadTasks } from './configs/config.js';
import { Tasks } from './types/show.js';
import { compressTorrent } from './utils/media.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const port = normalizePort(process.env.PORT || "7860");

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);

const files: { url: string, filename: string }[] = [
  {
    url: "https://drive.google.com/file/d/10pZoRtlO_tVhk46BwS_0oWKCTQGE5XVq/view?usp=drive_link",
    filename: "Re Zero - E01"
  },
  {
    url: "https://drive.google.com/file/d/1tqMx_k1ZkEzOTnhx7vFCrNqabCPLIq2j/view?usp=drive_link",
    filename: "Re Zero - E04"
  },
  {
    url: "https://drive.google.com/file/d/1jZfV3uIRu9cJTzMHW8o6gIazCEHNMX57/view?usp=drive_link",
    filename: "Re Zero - E06"
  },
  {
    url: "https://drive.google.com/file/d/1rPLrJzVSJL_yEJwt-IbG1vLFdoVHcQ1I/view?usp=drive_link",
    filename: "Re Zero - E07"
  },
]
const placeholder: Tasks["epInfo"] = {
  episodeId: 1, malId: 11111, quality: "480p", season: 1
}

let active = true

const run = async () => {
  console.log("Active: ", active)
  
  if (!active) return
  
  for (const { filename, url } of files) {
    console.log("Running file: ", { filename, url })
    let taskId: number;
    do {
      taskId = randomInt(1_000_000);
    } while (downloadTasks.has(taskId));

    downloadTasks.set(taskId, {epInfo: placeholder, progress: 0, status: "pending", filename})

    await compressTorrent({url}, taskId, placeholder, false, filename, 0)
  }
}

run()
active = false