import { IBindingTo, IContainer, Identifier } from "../../src/interfaces/container.interface";

interface IMockContainer extends IContainer {
	classes: Record<string, unknown[]>
	named_classes: Record<string, { identifier: string, index: number }>

	prune(): void
}

export class BindingTo<T> implements IBindingTo<T> {
	private _container: IMockContainer;
	private _identifier: Identifier<T>;

	constructor(
		container: IMockContainer,
		identifier: Identifier<T>
	) {
		this._container = container;
		this._identifier = identifier;
	}

	public to(Ctor: new (...args: unknown[]) => T): void {
		const identifier = this._identifier.toString();

		if(!this._container.classes[identifier])
			this._container.classes[identifier] = [];

		this._container.classes[identifier].push(new Ctor());
	}
}

export class MockContainer implements IMockContainer {
	public classes: Record<string, unknown[]> = {};
	public named_classes: Record<string, { identifier: string, index: number }> = {}

	public bind<T>(identifer: Identifier<T>): IBindingTo<T> {
		return new BindingTo(this, identifer);
	}

	public get<T>(identifier: Identifier<T>): T {
		return this.classes[identifier.toString()][0] as T;
	}

	public getAll<T>(identifier: Identifier<T>): T[] {
		return this.classes[identifier.toString()] as T[];
	}

	public prune(): void {
		this.classes = {};
	}
}