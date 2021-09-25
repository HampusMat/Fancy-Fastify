import {
	FastifyError,
	FastifyInstance,
	FastifyReply,
	FastifyRequest
} from "fastify";
import { IContainer } from "./interfaces/container.interface";
import { ControllerInstance } from "./interfaces/controller.interface";
import { IControllerFetcher } from "./interfaces/controller_fetcher.interface";
import { IControllerUtils } from "./interfaces/controller_utils.interface";
import { ErrorHandler } from "./interfaces/fastify.interface";
import { IHooks } from "./interfaces/hooks.interface";
import { IImportControllers } from "./interfaces/importer.interface";
import { ControllerMetadata } from "./metadata/controller.metadata";
import { types } from "./types";

/**
 * Loader for controllers
 */
export class Loader {
	private _container: IContainer;
	private _controller_utils: IControllerUtils;
	private _controller_fetcher: IControllerFetcher;
	private _importControllers: IImportControllers;

	public controllers_with_parents: ControllerInstance[] = []

	/**
	 * @param container - A DI container
	 * @param controller_utils - A controller utilities instance
	 * @param controller_fetcher - A controller fetcher instance
	 * @param importControllers - A function that imports controllers
	 */
	constructor(
		container: IContainer,
		controller_utils: IControllerUtils,
		controller_fetcher: IControllerFetcher,
		importControllers: IImportControllers
	) {
		this._container = container;
		this._controller_utils = controller_utils;
		this._controller_fetcher = controller_fetcher;
		this._importControllers = importControllers;
	}

	/**
	 * Load controllers from a controllers directory
	 *
	 * @param fastify - A Fastify instance
	 * @param controller_dir - A directory with controllers
	 * @param [hooks] - Hooks for the various stages in bootstrapping
	 */
	public async load(fastify: FastifyInstance, controller_dir: string, hooks?: IHooks): Promise<void> {
		// Import the controllers inside of the controllers directory
		const controller_paths = await this._controller_fetcher.getAll(controller_dir);

		if(controller_paths.length === 0)
			return;

		await this._importControllers(controller_paths, this._container);

		// Register the controllers
		const controllers = this._container.getAll<ControllerInstance>(types.Controller);
		const sorted_controllers = this._controller_utils.sortControllersByHasParent(controllers, hooks);

		this.controllers_with_parents = sorted_controllers.with_parent;

		for(const controller of sorted_controllers.without_parent)
			await this.registerController(fastify, controller);
	}

	/**
	 * Register a controller
	 *
	 * @param fastify - A Fastify instance
	 * @param controller - A controller instance
	 */
	public async registerController(fastify: FastifyInstance, controller: ControllerInstance): Promise<void> {
		const controller_metadata = new ControllerMetadata(controller);

		const controller_name = controller_metadata.get<string>(controller_metadata.keys.Name);

		// Make sure that the controller is valid and shouldn't be skipped
		this._controller_utils.verifyController(controller_metadata);

		const should_be_skipped = this._controller_utils.shouldSkipController(controller_metadata);
		if(should_be_skipped.status === true) {
			console.log(`Skipped registering controller ${controller_name} because ${should_be_skipped.reason}`);
			return;
		}

		await fastify.register(async plugin => {
			// Set the error handler (if one is specified)
			if(controller_metadata.has(controller_metadata.keys.ErrorHandler))
				plugin.setErrorHandler((error: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
					const error_handler = controller[controller_metadata
						.get<string>(controller_metadata.keys.ErrorHandler)
					] as ErrorHandler;

					return error_handler(error, req, reply);
				});

			// Register all of the controllers that has this controller as a parent
			const child_controllers = this._controller_utils
				.getControllersWithParentOfName(this.controllers_with_parents, controller_name);

			for(const child_controller of child_controllers) {
				await this.registerController(plugin, child_controller);

				const child_controller_metadata = new ControllerMetadata(child_controller);

				child_controller_metadata.set(child_controller_metadata.keys.IsRegistered, true);
			}

			const route_names = controller_metadata.get<string[]>(controller_metadata.keys.Routes);
			const routes = this._controller_utils.getControllerRoutes(controller, route_names);

			for(const route of routes)
				plugin.route(route);

			controller_metadata.set(controller_metadata.keys.IsRegistered, true);
		}, {
			prefix: controller_metadata.get<string>(controller_metadata.keys.Prefix)
		});
	}
}