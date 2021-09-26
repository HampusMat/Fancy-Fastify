import { ControllerMetadata } from "../metadata/controller.metadata";
import { ControllerInstance } from "./controller.interface";
import { FancyRouteOptions } from "./fastify.interface";
import { IHooks } from "./hooks.interface";

export interface SortedControllers {
	with_parent: ControllerInstance[],
	without_parent: ControllerInstance[]
}

export interface ShouldControllerBeSkipped {
	status: boolean
	reason?: string
}

export interface IControllerUtils {
	getControllersWithParentOfName(controllers: ControllerInstance[], name: string): ControllerInstance[]
	shouldSkipController(controller_metadata: ControllerMetadata): ShouldControllerBeSkipped
	verifyController(controller_metadata: ControllerMetadata): boolean
	sortControllersByHasParent(controllers: ControllerInstance[], hooks?: IHooks): SortedControllers
	getControllerRoutes(controller: ControllerInstance, routes: string[]): FancyRouteOptions[]
}