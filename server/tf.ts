// import { readFileSync, writeFileSync } from "fs";

// let f = JSON.parse(readFileSync("./mappings.json").toString());

// let n: { [key: string]: string | number } = {};

// for (let field in f) {
//   let mal;
//   let season: string | number | undefined;
//   for (let inn in f[field]) {
//     if (mal && season) break;
//     if (inn.startsWith("mal:")) mal = inn;
//     if (inn.startsWith("tmdb_show:") || inn.startsWith("tvdb_show:")) {
//       let map = inn.split(":")[inn.split(":").length - 1];
//       if (map.toLowerCase().startsWith("s"))
//         season = map.toLowerCase().replace("s", "");
//     }
//   }
//   if (mal && Number(season) > 0) n[mal] = Number(season);
// }

// writeFileSync("./mappings1.json", JSON.stringify(n, null, 2));


import { parse } from "anitomy";
import {getSeasonNumber} from "./src/utils/shows"

const par = parse(
  "[Judas] Nogizaka Haruka no Himitsu (Haruka Nogizaka's Secret) (Seasons 1-2 + OVAs) [BD 1080p][HEVC x265 10bit][Eng-Subs] (Batch)\n[Judas] Nogizaka Haruka no Himitsu S2 - Purezza/[Judas] Nogizaka Haruka no Himitsu - S02E01.mkv\n👤 1 💾 493.4 MB ⚙️ NyaaSi"
)

console.log(par, await getSeasonNumber(39535))