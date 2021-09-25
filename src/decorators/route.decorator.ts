import { HTTPMethods } from "fastify";
import { RouteDecorator } from "../interfaces/fastify.interface";
import { ControllerMetadata } from "../metadata/controller.metadata";
import { RouteMetadata } from "../metadata/route.metadata";

export enum PrefixTrailingSlash {
	Slash = "slash",
	NoSlash = "no-slash",
	Both = "both"
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
 *     public async bananas(req: FastifyRequest, reply: FastifyReply) {
 *         reply.send([
 *             "one banana",
 *             "two bananas",
 *             "three bananas"
*          ]);
 *     }
 * }
 */
export function route(options: { method: HTTPMethods, url: string, prefix_trailing_slash?: PrefixTrailingSlash }): RouteDecorator {
	return (target, key, descriptor) => {
		const controller_metadata = new ControllerMetadata(target);
		const route_metadata = new RouteMetadata(target, key.toString());

		route_metadata.set(route_metadata.keys.PrettyType, "route");
		route_metadata.set(route_metadata.keys.Method, options.method);
		route_metadata.set(route_metadata.keys.Url, options.url);
		route_metadata.set(route_metadata.keys.Handler, descriptor.value?.name);
		route_metadata.set(route_metadata.keys.PrefixTrailingSlash, options.prefix_trailing_slash);

		const routes: string[] = controller_metadata.get(controller_metadata.keys.Routes) || [];

		routes.push(key.toString());

		controller_metadata.set(controller_metadata.keys.Routes, routes);
	};
}