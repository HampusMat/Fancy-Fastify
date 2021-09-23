import {
	FastifyError,
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
	HTTPMethods
} from "fastify";
import { IContainer } from "./interfaces/container.interface";
import { ControllerInstance } from "./interfaces/controller.interface";
import { ErrorHandler, RouteHandler } from "./interfaces/fastify.interface";
import { IHooks } from "./interfaces/hooks.interface";
import { ControllerMetadata } from "./metadata/controller.metadata";
import { RouteMetadata } from "./metadata/route.metadata";
import { types } from "./types";

export class FancyFastify {
	private _container: IContainer;

	public controllers_with_parents: ControllerInstance[] = []

	constructor(
		container: IContainer
	) {
		this._container = container;
	}

	public async bootstrap(fastify: FastifyInstance, hooks?: IHooks): Promise<void> {
		const controllers = this._container.getAll<ControllerInstance>(types.Controller);

		const parentless_controllers = controllers.filter(controller => {
			// Run the user-defined beforeRegisterController hook (if there is one)
			if(hooks && hooks.beforeRegisterController)
				hooks.beforeRegisterController(controller);

			const controller_metadata = new ControllerMetadata(controller);

			// Save the controller for later use if it has a parent
			if(
				controller_metadata.has(controller_metadata.keys.Parent) &&
				controller_metadata.get<string>(controller_metadata.keys.Parent) !== undefined
			) {
				this.controllers_with_parents.push(controller);
				return false;
			}

			return true;
		});

		for(const controller of parentless_controllers)
			await this.registerController(fastify, controller);
	}

	public async registerController(fastify: FastifyInstance, controller: ControllerInstance): Promise<void> {
		const controller_metadata = new ControllerMetadata(controller);

		const controller_name = controller_metadata.get<string>(controller_metadata.keys.Name);

		this.verifyController(controller_metadata);

		const should_be_skipped = this.shouldSkipController(controller_metadata);

		if(should_be_skipped.status === true) {
			console.log(`Skipped registering controller ${controller_name} because ${should_be_skipped.reason}`);
			return;
		}

		const prefix = controller_metadata.get<string>(controller_metadata.keys.Prefix);

		await fastify.register(async plugin => {
			if(controller_metadata.has(controller_metadata.keys.ErrorHandler))
				plugin.setErrorHandler((error: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
					const error_handler = controller[controller_metadata.get<string>(controller_metadata.keys.ErrorHandler)] as ErrorHandler;

					return error_handler(error, req, reply);
				});

			for(const child_controller of this.getControllersWithParentOfName(controller_name)) {
				await this.registerController(plugin, child_controller);

				const child_controller_metadata = new ControllerMetadata(child_controller);

				child_controller_metadata.set(child_controller_metadata.keys.IsRegistered, true);
			}

			this.registerRoutesOfController(plugin, controller, controller_metadata);

			controller_metadata.set(controller_metadata.keys.IsRegistered, true);
		}, { prefix: prefix });
	}

	public registerRoutesOfController(fastify: FastifyInstance, controller: ControllerInstance, controller_metadata: ControllerMetadata): void {
		const routes = controller_metadata.get<string[]>(controller_metadata.keys.Routes);

		for(const route of routes) {
			const route_metadata = new RouteMetadata(controller, route);

			fastify.route({
				method: route_metadata.get<HTTPMethods>(route_metadata.keys.Method),
				url: route_metadata.get<string>(route_metadata.keys.Url),
				prefixTrailingSlash: route_metadata.get(route_metadata.keys.PrefixTrailingSlash),
				handler: async(req: FastifyRequest, reply: FastifyReply) => {
					const route = controller[route_metadata.get<string>(route_metadata.keys.Handler)] as RouteHandler;

					/*
						The route method has to be bound back to it's controller
						because it forgets this
					   */
					return route.bind(controller)(req, reply);
				}
			});
		}
	}

	public getControllersWithParentOfName(name: string): ControllerInstance[] {
		return this.controllers_with_parents.filter(potential_child => {
			const potential_child_metadata = new ControllerMetadata(potential_child);

			const potential_child_name = potential_child_metadata.get<string>(potential_child_metadata.keys.Name);
			const potential_child_parent = potential_child_metadata.get<string>(potential_child_metadata.keys.Parent);

			return potential_child_name !== name && potential_child_parent === name;
		});
	}

	public shouldSkipController(controller_metadata: ControllerMetadata): { status: boolean, reason?: string} {
		if(controller_metadata.get<boolean>(controller_metadata.keys.IsRegistered) === true)
			return {
				status: true,
				reason: "it has already been registered"
			};

		return { status: false };
	}

	public verifyController(controller_metadata: ControllerMetadata): boolean {
		const controller_name = controller_metadata.get<string>(controller_metadata.keys.Name);

		if(!controller_metadata.has(controller_metadata.keys.PrettyType))
			throw(new Error(`Controller ${controller_name} is not a controller because it doesn't have the pretty type metadata key`));

		if(controller_metadata.get<string>(controller_metadata.keys.PrettyType) !== "controller")
			throw(new Error(`Controller ${controller_name} is not a controller because it's pretty type is not a controller`));

		if(!controller_metadata.has(controller_metadata.keys.Prefix))
			throw(new Error(`Controller ${controller_name} doesn't have a prefix`));

		if(!controller_metadata.has(controller_metadata.keys.Routes))
			throw(new Error(`Controller ${controller_name} doesn't have any routes`));

		return true;
	}
}