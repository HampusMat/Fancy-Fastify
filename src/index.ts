import {
	FastifyInstance,
	FastifyPluginAsync,
	HTTPMethods
} from "fastify";
import { readdir, stat } from "fs";
import { ControllerFetcher } from "./controller_fetcher";
import { FancyFastify } from "./fancy_fastify";
import { IContainer } from "./interfaces/container.interface";
import { ErrorHandlerDecorator, RouteDecorator } from "./interfaces/fastify.interface";
import { Filesystem } from "./lib/filesystem";
import { ControllerMetadata } from "./metadata/controller.metadata";
import { ErrorHandlerMetadata } from "./metadata/error_handler.metadata";
import { RouteMetadata } from "./metadata/route.metadata";
import { types } from "./types";
import { importControllers } from "./importer"

/**
 * Initialize loading Fastify controllers
 *
 * @param container - A DI container
 * @param controller_dir - A directory with controllers inside
 * @returns A Fastify plugin that will load your controllers
 *
 * @example
 *
 * import fastify from "fastify";
 * import { Container, injectable } from "inversify";
 * import { fancyFastify } from "fancy-fastify";
 *
 * const app = fastify();
 * const container = new Container();
 *
 * app.register(fancyFastify(container, join(__dirname, "controllers")));
 */
export function fancyFastify(container: IContainer, controller_dir: string): FastifyPluginAsync {
	return async(fastify: FastifyInstance) => {
		const controller_fetcher = new ControllerFetcher(new Filesystem(readdir, stat));

		const controllers = await controller_fetcher.getAll(controller_dir);

		if(controllers.length === 0)
			return;

		await importControllers(controllers, container);

		const fancy_fastify = new FancyFastify(container);
		await fancy_fastify.bootstrap(fastify);
	};
}

/**
 * Define a controller method as a route
 *
 * @param options - Route options
 * @param options.method - The HTTP method
 * @param options.url - Url relative to the controller's prefix
 * @returns A route decorator
 *
 * @example
 *
 * // Omit the square brackets around the @
 * [@]controller({ name: "API Controller", prefix: "api/v1" })
 * class APIController {
 *     // Omit the square brackets around the @
 *     [@]route({ method: "GET", url: "bananas" })
 *     public bananas(req: FastifyRequest, reply: FastifyReply) {
 *         reply.send([
 *             "one banana",
 *             "two bananas",
 *             "three bananas"
*          ]);
 *     }
 * }
 */
export function route(options: { method: HTTPMethods, url: string}): RouteDecorator {
	return (target, key, descriptor) => {
		const controller_metadata = new ControllerMetadata(target);
		const route_metadata = new RouteMetadata(target, key.toString());

		route_metadata.set(route_metadata.keys.PrettyType, "route");
		route_metadata.set(route_metadata.keys.Method, options.method);
		route_metadata.set(route_metadata.keys.Url, options.url);
		route_metadata.set(route_metadata.keys.Handler, descriptor.value?.name);

		const routes: string[] = controller_metadata.get(controller_metadata.keys.Routes) || [];

		routes.push(key.toString());

		controller_metadata.set(controller_metadata.keys.Routes, routes);
	};
}

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
 *     public handleErrors(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
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
/**
 * Define a controller
 *
 * @param options - Controller options
 * @param options.name - The controller's name
 * @param [options.prefix] - The controller's url path prefix
 * @param [options.parent] - The controller's parent controller
 * @returns A class decorator
 *
 * @example
 *
 * // Omit the square brackets around the @
 * [@]controller({ name: "App Controller" })
 * class AppController {
 *     // Routes and stuff here
 * }
 */
export function controller(options: { name: string, prefix?: string, parent?: string }): ClassDecorator {
	return target => {
		const controller_metadata = new ControllerMetadata(target);

		controller_metadata.set(controller_metadata.keys.PrettyType, "controller");
		controller_metadata.set(controller_metadata.keys.IsRegistered, false);

		controller_metadata.set(controller_metadata.keys.Name, options.name);
		controller_metadata.set(controller_metadata.keys.Prefix, options.prefix || "");
		controller_metadata.set(controller_metadata.keys.Parent, options.parent);
	};
}
