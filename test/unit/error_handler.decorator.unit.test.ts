import "reflect-metadata";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { errorHandler } from "../../src";

describe("Error handler decorator", () => {
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