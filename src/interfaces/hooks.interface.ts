import { ControllerInstance } from "./controller.interface";

export interface IHooks {
	beforeRegisterController?(controller: ControllerInstance): void
}