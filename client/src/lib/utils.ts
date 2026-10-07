import { platform } from "@tauri-apps/plugin-os";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function constructStreamUrl(
  malId: string,
  ep: string,
  category?: "sub" | "dub",
) {
  return `https://gogoanime.me.uk/newplayer.php?mal_id=${malId}&ep=${ep}&category=${category ?? "sub"}`;
}

export const isMobile = platform() === "android"
