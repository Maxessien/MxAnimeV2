import app from './configs/app.js';
import { getCloudConvert } from './configs/config.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const cl = await getCloudConvert()

console.log(await cl?.users.me())


const port = normalizePort(process.env.PORT || "7860");

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);
