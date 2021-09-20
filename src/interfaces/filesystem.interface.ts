import type { Stats } from "fs";

export interface IFilesystem {
	readDirectory(path: string): Promise<string[]>
	stat(path: string): Promise<Stats>
}