import { FastifyError, FastifyReply, FastifyRequest, preHandlerHookHandler, preValidationHookHandler } from "fastify";
import { RouteDecorator } from "../interfaces/fastify.interface";
import { ControllerMetadata } from "../metadata/controller.metadata";
import { NotFoundHandlerMetadata } from "../metadata/not_found_handler.metadata";

export interface NotFoundHandler {
	preValidation: preValidationHookHandler,
	preHandler: preHandlerHookHandler,
	handler: string
}

type HookHandlerDoneFunction = <TError extends Error = FastifyError>(err?: TError) => void

/**
 * Define a controller method as that controller's not found handler
 *
 * @returns A not found handler decorator
 *
 * @example
 *
 * // Omit the square brackets around the @
 * [@]controller({ name: "App Controller" })
 * class AppController {
 *     // Omit the square brackets around the @
 *     [@]notFoundHandler()
 *     public async notFound(req: FastifyRequest, reply: FastifyReply) {
 *         reply.code(404).send("Page not found!");
 *     }
 * }
 */
export function notFoundHandler(options?: { preValidation?: preValidationHookHandler, preHandler?: preHandlerHookHandler }): RouteDecorator {
	return (target, key, descriptor) => {
		const controller_metadata = new ControllerMetadata(target);
		const not_found_handler_metadata = new NotFoundHandlerMetadata(target, key.toString());

		if(controller_metadata.has(controller_metadata.keys.NotFoundHandler))
			throw(new Error(`Duplicate not found handler '${key.toString()}'`));

		not_found_handler_metadata.set(not_found_handler_metadata.keys.PrettyType, "not_found_handler");

		controller_metadata.set(controller_metadata.keys.NotFoundHandler, {
			preValidation: options && options.preValidation
				? options.preValidation
				: (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
					done();
				},
			preHandler: options && options.preHandler
				? options.preHandler
				: (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
					done();
				},
			handler: descriptor.value?.name
		});
	};
}