import "reflect-metadata";
import { FastifyReply, FastifyRequest } from "fastify";
import { NotFoundHandler, notFoundHandler } from "../../src";

describe("Not found handler decorator", () => {
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