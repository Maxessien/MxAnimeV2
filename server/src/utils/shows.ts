import { Response } from "express";
import { SERVER_ERROR } from "./httpCodes.js";
import axios from "axios";
import { console } from "node:inspector";

const JIKAN_API = "https://api.jikan.moe/v4";

const getAniZipUrl = (malId: number | string) =>
  `https://api.ani.zip/mappings?mal_id=${malId}`;

const handler = async (res: Response, cb: () => Promise<Response>) => {
  try {
    const resp = await cb();
    return resp;
  } catch (error) {
    console.log(error);
    return res
      .status(SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};

const getTorrentioApi = (id: string, type: string) =>
  `https://torrentio.strem.fun/stream/${type}/${id}.json`;

/**
 * Helper to pause execution to respect Jikan's rate limits (max 3 req/sec)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Recursively crawls the Jikan API backward through "Prequel" relations 
 * to calculate the sequential season number.
 * 
 * @param {number} malId - The MyAnimeList ID of the anime
 * @param {number} currentCount - Internal tracker for season position
 * @returns {Promise<number>} - The calculated season number
 */
async function getSeasonNumber(malId: string | number, currentCount = 1) {
  const url = `https://api.jikan.moe/v4/anime/39535/relations`;

  // console.log(url)
    
    try {
        // Enforce a 400ms delay between calls to stay safely under 3 requests/sec
        await delay(400); 
        
        const response = await axios.get(url);
        const relations = response.data.data || [];

        // Find the block corresponding to the Prequel relation
        const prequelRelation = relations.find((rel: any) => rel.relation.toLowerCase() === 'prequel');

        if (prequelRelation) {
            // Filter entries to ensure we are only tracking the "anime" lineage
            const animePrequel = prequelRelation.entry.find((item: any) => item.type === 'anime');

            if (animePrequel && animePrequel.mal_id) {
                // A prequel exists, move one step back in the timeline
                return await getSeasonNumber(animePrequel.mal_id, currentCount + 1);
            }
        }

        // Base case: No more anime prequels found. We have reached Season 1.
        return currentCount;

    } catch (error: any) {
        // Handle Jikan's 429 Rate Limit error specifically
        if (error.response && error.response.status === 429) {
            console.warn(`Rate limited at ID ${malId}. Retrying after a longer pause...`);
            await delay(2000);
            return await getSeasonNumber(malId, currentCount);
        }

        console.error(`Failed to traverse relations for ID ${malId}:`, error.message);
        throw error;
    }
}


export { handler, JIKAN_API, getAniZipUrl, getTorrentioApi, getSeasonNumber };
