import { readFileSync, writeFileSync } from 'fs';
import {readdir} from "fs/promises"

// const BASE_PATH = "C:/Users/Dell/Documents/projects/mxanimev2/server/subsplease"

// const files = await readdir(BASE_PATH)

// let map: {title: string, mal_id: string, subspleaseSlug: string}[] = []

// for (const file of files) {
//   map = [...map, ...JSON.parse(readFileSync(BASE_PATH+"/"+file).toString())]
// }

let file = JSON.parse(readFileSync("../subsplease-mal-map.json").toString())
let file2 = JSON.parse(readFileSync("tf.json").toString())

// writeFileSync("tf.json", JSON.stringify(map, undefined, 2))

console.log("written", file.length, file2.length)


// console.log(await subsplease.getShow(file[0].slug))
