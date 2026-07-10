import { config } from 'dotenv';

config()

import { parse } from "anitomy";
import app from './configs/app.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const port = normalizePort(process.env.PORT || '3000');

let par = parse("[SubsPlease] Tsuihou sareta Tensei Juukishi wa Game Chishiki de Musou suru - 02 (480p) [78A9AFF6].mkv")

console.log(par)

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);