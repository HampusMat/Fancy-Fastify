import type * as fs_builtin from "fs";
import { IFilesystem } from "../interfaces/filesystem.interface";

export class Filesystem implements IFilesystem {
	private _readdir: typeof fs_builtin.readdir;
	private _stat: typeof fs_builtin.stat;

	constructor(
		readdir: typeof fs_builtin.readdir,
		stat: typeof fs_builtin.stat
	) {
		this._readdir = readdir;
		this._stat = stat;
	}

	async readDirectory(path: string): Promise<string[]> {
		return new Promise((resolve: (value: string[]) => void, reject) => {
			this._readdir(path, { encoding: "utf8" }, (err, dir_content) => {
				if(err)
					reject(err);

				resolve(dir_content);
			});
		});
	}

	async stat(path: string): Promise<fs_builtin.Stats> {
		return new Promise((resolve: (value: fs_builtin.Stats) => void, reject) => {
			this._stat(path, (err, stats) => {
				if(err)
					reject(err);

				resolve(stats);
			});
		});
	}
}