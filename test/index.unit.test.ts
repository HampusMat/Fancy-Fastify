import "reflect-metadata";
import fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { controller, errorHandler, fancyFastify, route } from "../src";
import { MockContainer } from "./mocks/container";

describe("Index", () => {
	describe("fancyFastify", () => {
		const container = new MockContainer();

		afterAll(() => {
			container.prune();
		});

		it("Should respond with a valid Fastify plugin", async() => {
			expect.assertions(2);

			const plugin = fancyFastify(container, "src");

			expect(plugin).toBeDefined();

			const app = fastify();

			await expect(app.register(plugin)).resolves.toBeDefined();

			await app.close();
		});
	});

	describe("route", () => {
		it("Should set route metadata", () => {
			const decorator = route({ method: "GET", url: "/about" });

			const controller = {
				async aboutRoute(req: FastifyRequest, reply: FastifyReply) {
					reply.send("Hello there");
				}
			};

			decorator(controller, "aboutRoute", { value: controller.aboutRoute });

			expect(Reflect.getMetadata("pretty_type", controller, "aboutRoute")).toEqual("route");
			expect(Reflect.getMetadata("method", controller, "aboutRoute")).toEqual("GET");
			expect(Reflect.getMetadata("url", controller, "aboutRoute")).toEqual("/about");
			expect(Reflect.getMetadata("handler", controller, "aboutRoute")).toEqual("aboutRoute");

			expect(Reflect.getMetadata("routes", controller)).toHaveLength(1);
		});
	});

	describe("errorHandler", () => {
		it("Should set error handler metadata", () => {
			const decorator = errorHandler();

			const controller = {
				async handleErrors(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
					reply.code(500).send("Oh no, an error! " + err.message);
				}
			};

			decorator(controller, "handleErrors", { value: controller.handleErrors });

			expect(Reflect.getMetadata("pretty_type", controller, "handleErrors")).toEqual("error_handler");
			expect(Reflect.getMetadata("error_handler", controller)).toEqual("handleErrors");
		});
		it("Shouldn't allow multiple error handlers per controller", () => {
			const decorator = errorHandler();

			const controller = {
				async handleErrors(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
					reply.code(500).send("Oh no, an error! " + err.message);
				},
				async handleErrorsAgain(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
					reply.code(404).send("Not found! " + err);
				}
			};

			decorator(controller, "handleErrors", { value: controller.handleErrors });

			expect(Reflect.getMetadata("pretty_type", controller, "handleErrors")).toEqual("error_handler");
			expect(Reflect.getMetadata("error_handler", controller)).toEqual("handleErrors");

			expect(() => decorator(controller, "handleErrorsAgain", { value: controller.handleErrorsAgain }))
				.toThrow("Duplicate error handler 'handleErrorsAgain'");
		});
	});

	describe("controller", () => {
		it("Should set controller metadata", () => {
			const decorator = controller({
				name: "APIControllerV1",
				prefix: "/api/v1"
			});

			const controllerConstructor = () => {
				console.log("Creating api v1 controller");
			};

			decorator(controllerConstructor);

			expect(Reflect.getMetadata("pretty_type", controllerConstructor)).toEqual("controller");
			expect(Reflect.getMetadata("is_registered", controllerConstructor)).toBeFalsy();
			expect(Reflect.getMetadata("name", controllerConstructor)).toEqual("APIControllerV1");
			expect(Reflect.getMetadata("prefix", controllerConstructor)).toEqual("/api/v1");
		});
	});
});