import axios from "axios";

export const getBaseUrl = async ()=>{

  const selfHosted = 'https://jikan-mxanime.onrender.com'
  const community = 'https://api.jikan.moe/v4'

  return community

  try {
    await axios.get(selfHosted, {timeout: 10000})
    return selfHosted
  } catch (err) {
    return community
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
      await new Promise(resolve => setTimeout(resolve, 350)); // Jikan rate limit buffer
    }
  }
  
  isProcessing = false;
};

export const fetchJikan = async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const baseUrl = await getBaseUrl()
        console.log(baseUrl)
        const url = new URL(`${baseUrl}${endpoint}`);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              url.searchParams.append(key, String(value));
            }
          });
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          if (response.status === 429) {
            console.warn('Jikan API rate limit hit.');
            throw new Error('Rate limited by Jikan API. Please try again in a moment.');
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
