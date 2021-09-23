import "reflect-metadata";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { controller, errorHandler, NotFoundHandler, notFoundHandler, route } from "../src";
import { IDIDecorator } from "../src/interfaces/container.interface";

declare global {
	// eslint-disable-next-line no-var
	var di_decorator: IDIDecorator;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
global.di_decorator = () => () => {};

describe("Index", () => {
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
					reply.code(500).send("Oops! " + err);
				}
			};

			decorator(controller, "handleErrors", { value: controller.handleErrors });

			expect(Reflect.getMetadata("pretty_type", controller, "handleErrors")).toEqual("error_handler");
			expect(Reflect.getMetadata("error_handler", controller)).toEqual("handleErrors");

			expect(() => decorator(controller, "handleErrorsAgain", { value: controller.handleErrorsAgain }))
				.toThrow("Duplicate error handler 'handleErrorsAgain'");
		});
	});

	describe("NotFoundHandler", () => {
		it("Should set not found handler metadata", () => {
			const decorator = notFoundHandler();

			const controller = {
				async notFound(req: FastifyRequest, reply: FastifyReply) {
					reply.code(404).send("Page not found!");
				}
			};

			decorator(controller, "notFound", { value: controller.notFound });

			expect(Reflect.getMetadata("pretty_type", controller, "notFound")).toEqual("not_found_handler");

			const not_found_handler = Reflect.getMetadata("not_found_handler", controller) as NotFoundHandler;

			expect(not_found_handler).toBeDefined();

			expect(not_found_handler).toHaveProperty("preValidation");
			expect(typeof not_found_handler.preValidation).toEqual("function");

			expect(not_found_handler).toHaveProperty("preHandler");
			expect(typeof not_found_handler.preHandler).toEqual("function");

			expect(not_found_handler).toHaveProperty("handler");
			expect(typeof not_found_handler.handler).toEqual("string");
		});
		it("Shouldn't allow multiple not found handlers per controller", () => {
			const decorator = notFoundHandler();

			const controller = {
				async notFound(req: FastifyRequest, reply: FastifyReply) {
					reply.code(404).send("Page not found!");
				},
				async notFoundAgain(req: FastifyRequest, reply: FastifyReply) {
					reply.code(404).send("Page was not found!");
				}
			};

			decorator(controller, "notFound", { value: controller.notFound });

			const not_found_handler = Reflect.getMetadata("not_found_handler", controller) as NotFoundHandler;

			expect(not_found_handler).toBeDefined();

			expect(not_found_handler).toHaveProperty("preValidation");
			expect(typeof not_found_handler.preValidation).toEqual("function");

			expect(not_found_handler).toHaveProperty("preHandler");
			expect(typeof not_found_handler.preHandler).toEqual("function");

			expect(not_found_handler).toHaveProperty("handler");
			expect(typeof not_found_handler.handler).toEqual("string");

			expect(() => decorator(controller, "notFoundAgain", { value: controller.notFoundAgain }))
				.toThrow("Duplicate not found handler 'notFoundAgain'");
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