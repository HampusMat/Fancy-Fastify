import { IMetadata, IMetadataKey } from "../interfaces/metadata.interface";

export class NotFoundHandlerMetadata implements IMetadata {
	private _controller: Record<string, unknown>;
	private _not_found_handler: string;

	public keys = {
		PrettyType: { name: "pretty_type" }
	}

	constructor(controller: Record<string, unknown>, not_found_handler: string) {
		this._controller = controller;
		this._not_found_handler = not_found_handler;
	}

	public get<T>(key: IMetadataKey): T {
		return Reflect.getMetadata(key.name, this._controller, this._not_found_handler) as T;
	}

	public has(key: IMetadataKey): boolean {
		return Reflect.hasMetadata(key.name, this._controller, this._not_found_handler);
	}

	public set(key: IMetadataKey, value: unknown): void {
		Reflect.defineMetadata(key.name, value, this._controller, this._not_found_handler);
	}
}