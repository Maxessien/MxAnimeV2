import axios from "axios";

export const getBaseUrl = async () => {
  const selfHosted = "https://jikan-mxanime.onrender.com";
  const community = "https://api.jikan.moe/v4";

  return community;

  try {
    await axios.get(selfHosted, { timeout: 10000 });
    return selfHosted;
  } catch (err) {
    return community;
  }
};

let queue: (() => Promise<void>)[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const task = queue.shift();
    if (task) {
      await task();
      await new Promise((resolve) => setTimeout(resolve, 350)); // Jikan rate limit buffer
    }
  }

  isProcessing = false;
};

// src/lib/mal.ts
const MAL_BASE_URL = "https://api.myanimelist.net/v2";
const MAL_CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID || "";

// Shared fields we need MAL to return so our transformer has enough data
export const MAL_DEFAULT_FIELDS =
  "id,title,main_picture,alternative_titles,media_type,source,num_episodes,status,mean,num_scoring_users,rank,popularity,synopsis,start_season,studios,genres";

export const fetchMal = async <T>(
  endpoint: string,
  params?: Record<string, any>,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const url = new URL(`${MAL_BASE_URL}${endpoint}`);

        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              url.searchParams.append(key, String(value));
            }
          });
        }

        const response = await fetch(url.toString(), {
          headers: {
            "X-MAL-CLIENT-ID": MAL_CLIENT_ID,
          },
        });

        if (!response.ok) {
          throw new Error(
            `MAL API Error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    queue.push(task);
    processQueue();
  });
};

export const fetchJikan = async <T>(
  endpoint: string,
  params?: Record<string, any>,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const baseUrl = await getBaseUrl();

        console.log(baseUrl);

        const url = new URL(`${baseUrl}${endpoint}`);

        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              url.searchParams.append(key, String(value));
            }
          });
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          if (response.status === 429) {
            console.warn("Jikan API rate limit hit.");

            throw new Error(
              "Rate limited by Jikan API. Please try again in a moment.",
            );
          }

          throw new Error(`Jikan API Error: ${response.statusText}`);
        }

        const data = await response.json();

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    queue.push(task);

    processQueue();
  });
};
