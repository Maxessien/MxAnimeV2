import app from './configs/app.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const port = normalizePort(process.env.PORT || "7860");

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);
