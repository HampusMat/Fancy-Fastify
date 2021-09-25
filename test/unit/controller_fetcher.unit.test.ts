import { ControllerFetcher } from "../../src/utils/controller_fetcher";
import { Volume, createFsFromVolume, DirectoryJSON } from "memfs";
import { readdir, stat, PathLike } from "fs";
import { Filesystem } from "../../src/lib/filesystem";

const volume = new Volume();

function addToVolumeFromJSON(dir_json: DirectoryJSON) {
	volume.reset();
	volume.fromJSON(dir_json);
}

const volume_fs = createFsFromVolume(volume);

jest.mock("fs", () => ({
	readdir: jest.fn().mockImplementation((path: PathLike, options, callback) => {
		return volume_fs.readdir(path, callback);
	}),
	stat: jest.fn().mockImplementation((path, callback) => {
		return volume_fs.stat(path, callback);
	})
}));

describe("Controller fetcher", () => {
	it("Should get all of the controllers in a directory", async() => {
		expect.assertions(5);

		addToVolumeFromJSON({
			"./controllers/app.controller.ts": "// Cool controller!",
			"./controllers/api/v4.controller.ts": "// Awesome API",
			"./controllers/other.controller.ts": "// There is another",
			"./controllers/bob/bobs_stuff.controller.ts": "// Bob's lame stuff",
			"./controllers/utils.ts": "// A bunch of util functions",
			"./controllers/bob/misc_stuff.ts": "// TODO: Remove this file"
		});

		const controller_fetcher = new ControllerFetcher(new Filesystem(readdir, stat));

		const controllers = await controller_fetcher.getAll("./controllers");

		expect(readdir).toHaveBeenCalledTimes(3);
		expect(stat).toHaveBeenCalledTimes(8);

		expect(controllers).toBeDefined();

		expect(controllers).toEqual(expect.arrayContaining([
			"controllers/api/v4.controller.ts",
			"controllers/app.controller.ts",
			"controllers/other.controller.ts",
			"controllers/bob/bobs_stuff.controller.ts"
		]));

		expect(controllers).toEqual(expect.not.arrayContaining([
			"controllers/utils.ts",
			"controllers/bob/misc_stuff"
		]));
	});
});