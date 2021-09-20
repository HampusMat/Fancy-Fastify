import "reflect-metadata";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { controller, route } from "../src";
import { ControllerMetadata } from "../src/metadata/controller.metadata";
import { FancyFastify } from "../src/fancy_fastify";
import { types } from "../src/types";
import { MockContainer } from "./mocks/container";

describe("FancyFastify", () => {
	const container = new MockContainer();

	afterAll(() => {
		container.prune();
	});

	it("Should verify a controller", () => {
		const fancy_fastify = new FancyFastify(container);

		@controller({ name: "The first controller", prefix: "/" })
		class FirstController {
			@route({ method: "GET", url: "/api/v1" })
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async APIRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("This is an api");
			}
		}

		container.bind(types.Controller).to(FirstController);

		const first_controller_metadata = new ControllerMetadata(container.get(types.Controller));

		expect(fancy_fastify.verifyController(first_controller_metadata)).toBeTruthy();

		@controller({ name: "The second controller", prefix: "stuff/" })
		class SecondController {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async AboutRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("About me");
			}
		}

		container.prune();
		container.bind(types.Controller).to(SecondController);

		const second_controller_metadata = new ControllerMetadata(container.get(types.Controller));

		expect(() => fancy_fastify.verifyController(second_controller_metadata)).toThrow("Controller The second controller doesn't have any routes");
	});

	it("Should skip a controller if need be", () => {
		const fancy_fastify = new FancyFastify(container);

		@controller({ name: "The first controller", prefix: "/" })
		class FirstController {
			@route({ method: "GET", url: "/api/v1" })
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async APIRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("This is an api");
			}
		}

		container.bind(types.Controller).to(FirstController);

		const first_controller_metadata = new ControllerMetadata(container.get(types.Controller));

		const should_skip_first = fancy_fastify.shouldSkipController(first_controller_metadata, false);

		expect(should_skip_first).toBeDefined();
		expect(should_skip_first.status).toBeFalsy();
		expect(should_skip_first.reason).toBeUndefined();

		@controller({ name: "The second controller", prefix: "morestuff", parent: "the first controller" })
		class SecondController {
			@route({ method: "GET", url: "/api/v1" })
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async APIRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("This is an api");
			}
		}

		container.prune();
		container.bind(types.Controller).to(SecondController);

		const second_controller_metadata = new ControllerMetadata(container.get(types.Controller));

		const should_skip_second = fancy_fastify.shouldSkipController(second_controller_metadata, false);

		expect(should_skip_second).toBeDefined();
		expect(should_skip_second.status).toBeTruthy();
		expect(should_skip_second.reason).toEqual("it has a parent");

		@controller({ name: "The third controller", prefix: "evenmorestuff" })
		class ThirdController {
			@route({ method: "GET", url: "/api/v1" })
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async APIRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("This is an api");
			}
		}

		container.prune();
		container.bind(types.Controller).to(ThirdController);

		const third_controller_metadata = new ControllerMetadata(container.get(types.Controller));

		third_controller_metadata.set(third_controller_metadata.keys.IsRegistered, true);

		const should_skip_third = fancy_fastify.shouldSkipController(third_controller_metadata, false);

		expect(should_skip_third).toBeDefined();
		expect(should_skip_third.status).toBeTruthy();
		expect(should_skip_third.reason).toEqual("it has already been registered");
	});

	it("Should register a controller", async() => {
		expect.assertions(9);

		const fancy_fastify = new FancyFastify(container);
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

		await expect(fancy_fastify.registerController(app, new FirstController())).resolves.not.toThrow();

		const first_controller_metadata = new ControllerMetadata(FirstController);

		expect(first_controller_metadata.get(first_controller_metadata.keys.IsRegistered)).toBeTruthy();

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

		const second_controller_metadata = new ControllerMetadata(SecondController);

		expect(second_controller_metadata.get(second_controller_metadata.keys.IsRegistered)).toBeTruthy();

		const res_three = await app.inject({
			method: "GET",
			url: "page/stuff/important"
		});

		expect(res_three.statusCode).toEqual(200);
		expect(res_three.body).toEqual("A bunch of important information");
	});
});