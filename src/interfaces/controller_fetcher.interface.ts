export interface IControllerFetcher {
	getAll(controller_dir: string): Promise<string[]>
}