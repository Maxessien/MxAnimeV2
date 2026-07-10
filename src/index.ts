import app from './configs/app.js';
import { seedr } from './configs/config.js';
import { normalizePort, onError, onListening } from './utils/serverInit.js';

const port = normalizePort(process.env.PORT || '3000');

// let contents = await seedr.addMagnet("magnet:?xt=urn:btih:52ISKMLB4VRFU5L7UR5ZI4KCOHTPBGI3&dn=%5BSubsPlease%5D%20Tsuihou%20sareta%20Tensei%20Juukishi%20wa%20Game%20Chishiki%20de%20Musou%20suru%20-%2002%20%28480p%29%20%5B78A9AFF6%5D.mkv&xl=384428536&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=http%3A%2F%2Ftracker.mywaifu.best%3A6969%2Fannounce&tr=https%3A%2F%2Ftracker.zhuqiy.com%3A443%2Fannounce&tr=udp%3A%2F%2Ftracker.tryhackx.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fretracker.hotplug.ru%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.com%3A6969%2Fannounce&tr=http%3A%2F%2Ftracker.beeimg.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ft.overflow.biz%3A6969%2Fannounce&tr=wss%3A%2F%2Ftracker.openwebtorrent.com");
let contents = await seedr.getVideos();
let tz = '[SubsPlease] Tsuihou sareta Tensei Juukishi wa Game Chishiki de Musou suru - 02 (480p) [78A9AFF6].mkv'
let f = contents[0].find(({name})=> name.trim().toLowerCase() === tz.trim().toLowerCase())
let fil = f ? await seedr.getFile(f.id) : {}

console.log(contents[0][0].id, fil, f)

const server = app.listen(Number(port), "0.0.0.0", ()=> onListening(server));

app.addListener('error', onError);