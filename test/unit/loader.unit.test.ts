import "reflect-metadata";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { controller, route } from "../../src";
import { ControllerMetadata } from "../../src/metadata/controller.metadata";
import { Loader } from "../../src/loader";
import { types } from "../../src/types";
import { MockContainer } from "../mocks/container";
import { IDIDecorator } from "../../src/interfaces/container.interface";
import { ControllerUtils } from "../../src/utils/controller";
import { ControllerFetcher } from "../../src/utils/controller_fetcher";
import { Filesystem } from "../../src/lib/filesystem";
import { importControllers } from "../../src/utils/importer";
import { readdir, stat } from "fs";

declare global {
	// eslint-disable-next-line no-var
	var di_decorator: IDIDecorator;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
global.di_decorator = () => () => {};

describe("Loader", () => {
	const container = new MockContainer();

	afterAll(() => {
		container.prune();
	});

	it("Should register a controller", async() => {
		expect.assertions(9);

		const loader = new Loader(
			container,
			new ControllerUtils(),
			new ControllerFetcher(
				new Filesystem(readdir, stat)
			),
			importControllers
		);

		const app = fastify();

		@controller({ name: "The first controller", prefix: "page" })
		class FirstController {
			@route({ method: "GET", url: "/api/v1" })
			public async APIRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("This is an api");
			}

			@route({ method: "GET", url: "/about" })
			public async aboutRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("About me");
			}
		}

		@controller({ name: "The second controller", prefix: "stuff", parent: "The first controller" })
		class SecondController {
			@route({ method: "GET", url: "/important" })
			public async importantRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("A bunch of important information");
			}
		}

		container.prune();
		container.bind(types.Controller).to(FirstController);
		container.bind(types.Controller).to(SecondController);

		loader.controllers_with_parents.push(new SecondController());

		await expect(loader.registerController(app, new FirstController())).resolves.not.toThrow();

		const first_controller_metadata = new ControllerMetadata(FirstController);
		expect(first_controller_metadata.get(first_controller_metadata.keys.IsRegistered)).toBeTruthy();

		const second_controller_metadata = new ControllerMetadata(SecondController);
		expect(second_controller_metadata.get(second_controller_metadata.keys.IsRegistered)).toBeTruthy();

		const res_one = await app.inject({
			method: "GET",
			url: "page/api/v1"
		});

		expect(res_one.statusCode).toEqual(200);
		expect(res_one.body).toEqual("This is an api");

		const res_two = await app.inject({
			method: "GET",
			url: "page/about"
		});

		expect(res_two.statusCode).toEqual(200);
		expect(res_two.body).toEqual("About me");

		const res_three = await app.inject({
			method: "GET",
			url: "page/stuff/important"
		});

		expect(res_three.statusCode).toEqual(200);
		expect(res_three.body).toEqual("A bunch of important information");
	});
});