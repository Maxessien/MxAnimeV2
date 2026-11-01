import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import showRoutes from '../routes/showsRoute.js';
import { join } from 'path';
import { downloadTorrentToApify } from '../utils/torrentsFetchers.js';
import { writeFileSync } from 'fs';

const LATEST_UPDATE_URL = "https://github.com/Maxessien/MxAnimeV2/releases/latest"

const {chosen, defaultDatasetId} = await downloadTorrentToApify(
  "magnet:?xt=urn:btih:LZQGIFM534H2X532FWESBMCDVVWPMFGE&dn=%5BSubsPlease%5D%20FX%20Senshi%20Kurumi-chan%20-%2005%20%28480p%29%20%5B0470BE4F%5D.mkv&xl=388673530&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=http%3A%2F%2Ftracker.mywaifu.best%3A6969%2Fannounce&tr=https%3A%2F%2Ftracker.zhuqiy.com%3A443%2Fannounce&tr=udp%3A%2F%2Ftracker.tryhackx.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fretracker.hotplug.ru%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.com%3A6969%2Fannounce&tr=http%3A%2F%2Ftracker.beeimg.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ft.overflow.biz%3A6969%2Fannounce&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
  5
)

writeFileSync(join(process.cwd(), "tff.json"), JSON.stringify({chosen, defaultDatasetId}))

const app = express();

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/assets", express.static(join(process.cwd(), "src/assets")))
app.get("/", (_: Request, res: Response)=> res.sendFile(join(process.cwd(), "src/assets/index.html")))
app.get("/update", (_: Request, res: Response) => res.redirect(LATEST_UPDATE_URL))
app.use("/show", showRoutes)


export default app;
