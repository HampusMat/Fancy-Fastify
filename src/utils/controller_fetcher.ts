import { join } from "path";
import { IControllerFetcher } from "../interfaces/controller_fetcher.interface";
import { IFilesystem } from "../interfaces/filesystem.interface";

enum PathType {
	File,
	Directory
}

export class ControllerFetcher implements IControllerFetcher {
	private _filesystem: IFilesystem;

	constructor(
		filesystem: IFilesystem
	) {
		this._filesystem = filesystem;
	}

	public async getAll(controller_dir: string): Promise<string[]> {
		return this._walkDirectory(controller_dir);
	}

	private async _walkDirectory(path: string): Promise<string[]> {
		const dir_content = await this._filesystem.readDirectory(path);

		return dir_content.reduce(async(controllers: Promise<string[]>, entry) => {
			const controllers_arr = await controllers;

			const full_entry_path = join(path, entry);

			switch (await this._getPathType(full_entry_path)) {
			case PathType.File:
				if(!entry.endsWith(".controller.ts")) break;

				controllers_arr.push(full_entry_path);
				break;
			case PathType.Directory:
				controllers_arr.push(...await this._walkDirectory(full_entry_path));
				break;
			}

			return controllers_arr;
		}, Promise.resolve([]));
	}

	private async _getPathType(path: string) {
		return (await this._filesystem.stat(path)).isDirectory()
			? PathType.Directory
			: PathType.File;
	}
}