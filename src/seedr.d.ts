declare module "seedr" {
	export interface SeedrVideo {
		fid: number;
		id: number;
		name: string;
	}

  export interface SeedrAddMagnetResponse {
    user_torrent_id: number;
    title: string;
    success: boolean;
    torrent_hash: string;
    result: boolean;
  }

  export interface SeedrGetFileResponse {
    url: string;
    name: string;
    success: boolean;
    result: boolean;
  }

  export interface SeedrDeleteResponse {
    success: boolean;
    result: boolean;
  }	
  export default class Seedr {
		username?: string;
		password?: string;
		token?: string;
		rft?: string;
		devc?: string;
		usc?: string;

		constructor();

		login(username: string | undefined, password: string | undefined): Promise<string>;
		getDeviceCode(): Promise<string>;
		getToken(devc: string | undefined): Promise<string>;
		addToken(token: string): Promise<void>;
		addMagnet(magnet: string): Promise<SeedrAddMagnetResponse>;
		getVideos(): Promise<SeedrVideo[][]>;
		getFile(id: string | number): Promise<SeedrGetFileResponse>;
		deleteFolder(id: string | number): Promise<SeedrDeleteResponse>;
		deleteFile(id: string | number): Promise<SeedrDeleteResponse>;
	}
}