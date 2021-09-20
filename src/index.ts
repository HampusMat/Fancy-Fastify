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

/**
 * Initialize loading Fastify controllers
 *
 * @param container - A Inversify container
 * @param controller_dir - A directory with controllers inside
 * @returns A Fastify plugin that will load your controllers
 */
export function fancyFastify(container: IContainer, controller_dir: string): FastifyPluginAsync {
	return async(fastify: FastifyInstance) => {
		const controller_fetcher = new ControllerFetcher(new Filesystem(readdir, stat));

		const controllers = await controller_fetcher.getAll(controller_dir);

		if(controllers.length === 0)
			return;

		for(const controller of controllers) {
			const controller_module = await import(controller) as { default: new (...args: unknown[]) => unknown[]};

			container.bind(types.Controller).to(controller_module.default);
		}

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
 * @returns
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