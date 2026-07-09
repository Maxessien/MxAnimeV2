import app from './configs/app.js';
import { seedr } from './configs/config.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const port = normalizePort(process.env.PORT || '3000');

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);