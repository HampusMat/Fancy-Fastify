import { ErrorHandlerDecorator } from "../interfaces/fastify.interface";
import { ControllerMetadata } from "../metadata/controller.metadata";
import { ErrorHandlerMetadata } from "../metadata/error_handler.metadata";

/**
 * Define a controller method as that controller's error handler
 *
 * @returns A error handler decorator
 *
 * @example
 *
 * // Omit the square brackets around the @
 * [@]controller({ name: "App Controller" })
 * class AppController {
 *     // Omit the square brackets around the @
 *     [@]errorHandler()
 *     public async handleErrors(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
 *         console.log(err);
 *         reply.code(500).send("Internal server error!");
 *     }
 * }
 */
export function errorHandler(): ErrorHandlerDecorator {
	return (target, key, descriptor) => {
		const controller_metadata = new ControllerMetadata(target);
		const error_handler_metadata = new ErrorHandlerMetadata(target, key.toString());

		if(controller_metadata.has(controller_metadata.keys.ErrorHandler))
			throw(new Error(`Duplicate error handler '${key.toString()}'`));

		error_handler_metadata.set(error_handler_metadata.keys.PrettyType, "error_handler");

		controller_metadata.set(controller_metadata.keys.ErrorHandler, descriptor.value?.name);
	};
}