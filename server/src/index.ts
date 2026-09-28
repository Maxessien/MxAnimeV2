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