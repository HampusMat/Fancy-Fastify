import { ControllerCtor, ControllerInstance } from "../interfaces/controller.interface";
import { IMetadata, IMetadataKey } from "../interfaces/metadata.interface";

export interface IControllerMetadataKey extends IMetadataKey {
	in_instance: boolean
}

export class ControllerMetadata implements IMetadata {
	private _controller: ControllerCtor | ControllerInstance;

	public keys = {
		PrettyType: { name: "pretty_type", in_instance: false },
		Routes: { name: "routes", in_instance: true },
		ErrorHandler: { name: "error_handler", in_instance: true },
		NotFoundHandler: { name: "not_found_handler", in_instance: true },
		Name: { name: "name", in_instance: false },
		Prefix: { name: "prefix", in_instance: false },
		IsRegistered: { name: "is_registered", in_instance: false },
		Parent: { name: "parent", in_instance: false }
	}

	constructor(controller: ControllerCtor | ControllerInstance) {
		this._controller = controller;
	}

	public get<T>(key: IControllerMetadataKey): T {
		this._restrictAccessWhenNoInstance(key);

		return (Reflect.getMetadata(key.name, this._getControllerForKey(key))) as T;
	}

	public has(key: IControllerMetadataKey): boolean {
		this._restrictAccessWhenNoInstance(key);

		return Reflect.hasMetadata(key.name, this._getControllerForKey(key));
	}

	public set(key: IControllerMetadataKey, value: unknown): void {
		this._restrictAccessWhenNoInstance(key);

		Reflect.defineMetadata(key.name, value, this._getControllerForKey(key));
	}

	private _restrictAccessWhenNoInstance(key: IControllerMetadataKey) {
		if(this._controller.constructor === undefined && key.in_instance)
			throw(new Error(`Tried to access a controller instance metadata value from a no-instance controller metadata instance of ${key.name}`));
	}

	private _getControllerForKey(key: IControllerMetadataKey) {
		if(typeof this._controller === "function")
			return this._controller;

		return key.in_instance
			? this._controller
			: this._controller.constructor;
	}
}