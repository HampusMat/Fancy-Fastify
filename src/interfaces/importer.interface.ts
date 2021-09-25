import { IContainer } from "./container.interface";

export interface IImportControllers {
	(controllers: string[], container: IContainer): Promise<void>
}