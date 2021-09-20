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
import { ControllerMetadata } from "./metadata/controller.metadata";
import { RouteMetadata } from "./metadata/route.metadata";
import { types } from "./types";

export class FancyFastify {
	private _container: IContainer;

	constructor(
		container: IContainer
	) {
		this._container = container;
	}

	public async bootstrap(fastify: FastifyInstance): Promise<void> {
		const controllers = this._container.getAll<ControllerInstance>(types.Controller);

		for(const controller of controllers)
			await this.registerController(fastify, controller);
	}

	public async registerController(fastify: FastifyInstance, controller: ControllerInstance, is_child = false): Promise<void> {
		const controller_metadata = new ControllerMetadata(controller);

		const controller_name = controller_metadata.get<string>(controller_metadata.keys.Name);

		this.verifyController(controller_metadata);

		const should_be_skipped = this.shouldSkipController(controller_metadata, is_child);

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

			for(const child_controller of this.getControllersWithParentOfName(controller_name))
				await this.registerController(plugin, child_controller, true);

			this.registerRoutesOfController(plugin, controller, controller_metadata);
		}, { prefix: prefix });

		controller_metadata.set(controller_metadata.keys.IsRegistered, true);
	}

	public registerRoutesOfController(fastify: FastifyInstance, controller: ControllerInstance, controller_metadata: ControllerMetadata): void {
		const routes = controller_metadata.get<string[]>(controller_metadata.keys.Routes);

		for(const route of routes) {
			const route_metadata = new RouteMetadata(controller, route);

			fastify.route({
				method: route_metadata.get<HTTPMethods>(route_metadata.keys.Method),
				url: route_metadata.get<string>(route_metadata.keys.Url),
				handler: (req: FastifyRequest, reply: FastifyReply) => {
					const route = controller[route_metadata.get<string>(route_metadata.keys.Handler)] as RouteHandler;

					return route(req, reply);
				}
			});
		}
	}

	public getControllersWithParentOfName(name: string): ControllerInstance[] {
		return this._container.getAll<ControllerInstance>(types.Controller).filter(potential_child => {
			const potential_child_metadata = new ControllerMetadata(potential_child);

			const potential_child_name = potential_child_metadata.get<string>(potential_child_metadata.keys.Name);
			const potential_child_parent = potential_child_metadata.get<string>(potential_child_metadata.keys.Parent);

			return potential_child_name !== name && potential_child_parent === name;
		});
	}

	public shouldSkipController(controller_metadata: ControllerMetadata, is_child: boolean): { status: boolean, reason?: string} {
		if(
			!is_child &&
			controller_metadata.has(controller_metadata.keys.Parent) &&
			controller_metadata.get<string>(controller_metadata.keys.Parent) !== undefined
		)
			return {
				status: true,
				reason: "it has a parent"
			};

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