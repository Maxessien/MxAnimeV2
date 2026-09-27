import { randomInt } from 'node:crypto';
import app from './configs/app.js';
import { downloadTasks } from './configs/config.js';
import { Tasks } from './types/show.js';
import { compressTorrent } from './utils/media.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';
import axios from 'axios';

const port = normalizePort(process.env.PORT || "7860");

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);

const files: { id: string, filename: string }[] = [
  {
    id: "10pZoRtlO_tVhk46BwS_0oWKCTQGE5XVq",
    filename: "Re Zero - E01"
  },
  {
    id: "1tqMx_k1ZkEzOTnhx7vFCrNqabCPLIq2j",
    filename: "Re Zero - E04"
  },
  {
    id: "1jZfV3uIRu9cJTzMHW8o6gIazCEHNMX57",
    filename: "Re Zero - E06"
  },
  {
    id: "1rPLrJzVSJL_yEJwt-IbG1vLFdoVHcQ1I",
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
  
  for (const { filename, id } of files) {
    console.log("Running file: ", { filename, id })
    let taskId: number;
    do {
      taskId = randomInt(1_000_000);
    } while (downloadTasks.has(taskId));

    downloadTasks.set(taskId, { epInfo: placeholder, progress: 0, status: "pending", filename })

    const baseUrl = 'https://drive.google.com/uc?export=download';
      
    // 1. First request to grab the confirmation token from Google's warning page
    const response = await axios.get(`${baseUrl}&id=${id}`);
    let downloadUrl = `${baseUrl}&id=${id}`;
    
    // If the page contains a confirmation token, extract it
    if (typeof response.data === 'string' && response.data.includes('confirm=')) {
      const confirmMatch = response.data.match(/name="confirm"\s+value="([^"]+)"/);
      const uuidMatch = response.data.match(/name="uuid"\s+value="([^"]+)"/);
      if (confirmMatch && uuidMatch) {
            const confirmToken = confirmMatch[1];
            const uuidToken = uuidMatch[1];
            
            // Update target to Google's form submission endpoint with the tokens attached
            downloadUrl = `${baseUrl}/${id}&export=download&confirm=${confirmToken}&uuid=${uuidToken}`;
          }
    }

    await compressTorrent({url: downloadUrl}, taskId, placeholder, false, filename, 0)
  }
}

run()
active = false