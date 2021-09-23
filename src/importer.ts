import { IContainer } from "./interfaces/container.interface";
import { types } from "./types";

export async function importControllers(controllers: string[], container: IContainer): Promise<void> {
	for(const controller of controllers) {
		const controller_module = await import(controller) as { default: new (...args: unknown[]) => unknown[]};

		container.bind(types.Controller).to(controller_module.default);
	}
}