import { IMetadata, IMetadataKey } from "../interfaces/metadata.interface";

export class ErrorHandlerMetadata implements IMetadata {
	private _controller: Record<string, unknown>;
	private _error_handler: string;

	public keys = {
		PrettyType: { name: "pretty_type" }
	}

	constructor(controller: Record<string, unknown>, error_handler: string) {
		this._controller = controller;
		this._error_handler = error_handler;
	}

	public get<T>(key: IMetadataKey): T {
		return Reflect.getMetadata(key.name, this._controller, this._error_handler) as T;
	}

	public has(key: IMetadataKey): boolean {
		return Reflect.hasMetadata(key.name, this._controller, this._error_handler);
	}

	public set(key: IMetadataKey, value: unknown): void {
		Reflect.defineMetadata(key.name, value, this._controller, this._error_handler);
	}
}