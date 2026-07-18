import app from './configs/app.js';
import { downloadTorrent } from './utils/media.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const port = normalizePort(process.env.PORT || "7860");

await downloadTorrent("magnet:?xt=urn:btih:574e596fcffadcf3063bb81e4fe82200f3d5dae4&tr=tracker%3Audp%3A%2F%2Fzer0day.ch%3A1337%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.publictracker.xyz%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=tracker%3Audp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=tracker%3Ahttp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=tracker%3Audp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.wildkat.net%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.qu.ax%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.opentorrent.top%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.filemail.com%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.ducks.party%3A1984%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.bittor.pw%3A1337%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.auctor.tv%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker-udp.gbitt.info%3A80%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftr4ck3r.duckdns.org%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftorrentclub.online%3A54123%2Fannounce&tr=tracker%3Audp%3A%2F%2Ft.overflow.biz%3A6969%2Fannounce&tr=tracker%3Audp%3A%2F%2Fretracker01-msk-virt.corbina.net%3A80%2Fannounce&tr=tracker%3Audp%3A%2F%2Frekcart.duckdns.org%3A15480%2Fannounce&tr=tracker%3Ahttp%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=tracker%3Ahttp%3A%2F%2Fanidex.moe%3A6969%2Fannounce&tr=tracker%3Ahttp%3A%2F%2Ftracker.anirena.com%3A80%2Fannounce&tr=tracker%3Audp%3A%2F%2Ftracker.uw0.xyz%3A6969%2Fannounce&tr=tracker%3Ahttp%3A%2F%2Fshare.camoe.cn%3A8080%2Fannounce&tr=tracker%3Ahttp%3A%2F%2Ft.nyaatracker.com%3A80%2Fannounce&tr=dht%3A574e596fcffadcf3063bb81e4fe82200f3d5dae4")

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);
