import { FastifyReply, FastifyRequest, HTTPMethods, RouteOptions } from "fastify";
import { ControllerInstance } from "../interfaces/controller.interface";
import { IControllerUtils, ShouldControllerBeSkipped, SortedControllers } from "../interfaces/controller_utils.interface";
import { RouteHandler } from "../interfaces/fastify.interface";
import { IHooks } from "../interfaces/hooks.interface";
import { ControllerMetadata } from "../metadata/controller.metadata";
import { RouteMetadata } from "../metadata/route.metadata";

export class ControllerUtils implements IControllerUtils {
	public getControllersWithParentOfName(controllers: ControllerInstance[], name: string): ControllerInstance[] {
		return controllers.filter(potential_child => {
			const potential_child_metadata = new ControllerMetadata(potential_child);

			const potential_child_name = potential_child_metadata.get<string>(potential_child_metadata.keys.Name);
			const potential_child_parent = potential_child_metadata.get<string>(potential_child_metadata.keys.Parent);

			return potential_child_name !== name && potential_child_parent === name;
		});
	}

	public shouldSkipController(controller_metadata: ControllerMetadata): ShouldControllerBeSkipped {
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

	public sortControllersByHasParent(controllers: ControllerInstance[], hooks?: IHooks): SortedControllers {
		return controllers.reduce((sorted: SortedControllers, controller) => {
			// Run the user-defined beforeRegisterController hook (if there is one)
			if(hooks && hooks.beforeRegisterController)
				hooks.beforeRegisterController(controller);

			const controller_metadata = new ControllerMetadata(controller);

			// Sort the controller
			if(
				controller_metadata.has(controller_metadata.keys.Parent) &&
				controller_metadata.get<string>(controller_metadata.keys.Parent) !== undefined
			)
				sorted.with_parent.push(controller);
			else
				sorted.without_parent.push(controller);

			return sorted;
		}, { with_parent: [], without_parent: [] });
	}

	public getControllerRoutes(controller: ControllerInstance, routes: string[]): RouteOptions[] {
		return routes.map(route => {
			const route_metadata = new RouteMetadata(controller, route);

			return {
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
			};
		});
	}
}