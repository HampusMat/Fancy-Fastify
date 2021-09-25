import { basename } from "path";
import { IContainer } from "../interfaces/container.interface";
import { ControllerMetadata } from "../metadata/controller.metadata";
import { types } from "../types";

export async function importControllers(controllers: string[], container: IContainer): Promise<void> {
	for(const controller of controllers) {
		const controller_module = await import(controller) as { default: new (...args: unknown[]) => unknown[]};

		if(controller_module.default.name === undefined) {
			console.log(`Fancy Fastify - Warning: Imported ${basename(controller)} but it's not a valid controller! Skipping it.`);
			continue;
		}

		const controller_metadata = new ControllerMetadata(controller_module.default);

		if(!controller_metadata.has(controller_metadata.keys.PrettyType)) {
			console.log(`Fancy Fastify - Warning: Imported ${basename(controller)} but it's default export doesn't seem to be a controller! Skipping it.`);
			continue;
		}

		container.bind(types.Controller).to(controller_module.default);
	}
}