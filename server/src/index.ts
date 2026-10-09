import app from './configs/app.js';
import { getSubplTorrent } from './utils/media.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

// console.log(await getSubplTorrent(40748, "9"))

const port = normalizePort(process.env.PORT || "7860");

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);
