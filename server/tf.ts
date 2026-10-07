import { createSubsplease } from "@maxessien/subsplease";
import { readFileSync, writeFileSync } from 'fs';

const subsplease = createSubsplease()

// let file = JSON.parse(readFileSync("subsplease-mal-map.json").toString())

writeFileSync("tf.json", JSON.stringify(await subsplease.getSchedule()))

console.log("written")


// console.log(await subsplease.getShow(file[0].slug))
