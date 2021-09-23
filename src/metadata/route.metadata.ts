import { IMetadata, IMetadataKey } from "../interfaces/metadata.interface";

export class RouteMetadata implements IMetadata {
	private _controller: Record<string, unknown>;
	private _route: string;

	public keys = {
		PrettyType: { name: "pretty_type" },
		Handler: { name: "handler" },
		Method: { name: "method" },
		Url: { name: "url" },
		PrefixTrailingSlash: { name: "prefixTrailingSlash" }
	}

	constructor(controller: Record<string, unknown>, route: string) {
		this._controller = controller;
		this._route = route;
	}

	public get<T>(key: IMetadataKey): T {
		return Reflect.getMetadata(key.name, this._controller, this._route) as T;
	}

	public has(key: IMetadataKey): boolean {
		return Reflect.hasMetadata(key.name, this._controller, this._route);
	}

	public set(key: IMetadataKey, value: unknown): void {
		Reflect.defineMetadata(key.name, value, this._controller, this._route);
	}
}