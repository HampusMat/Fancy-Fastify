import { ControllerMetadata } from "../metadata/controller.metadata";

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
		global.di_decorator()(target);

		const controller_metadata = new ControllerMetadata(target);

		controller_metadata.set(controller_metadata.keys.PrettyType, "controller");
		controller_metadata.set(controller_metadata.keys.IsRegistered, false);

		controller_metadata.set(controller_metadata.keys.Name, options.name);
		controller_metadata.set(controller_metadata.keys.Prefix, options.prefix || "");
		controller_metadata.set(controller_metadata.keys.Parent, options.parent);
	};
}