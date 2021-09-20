// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Newable<T> = new (...args: any[]) => T;

interface Abstract<T> {
	prototype: T;
}

export type Identifier<T> = (string | symbol | Newable<T> | Abstract<T>);

export interface IBindingTo<T> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	to(ctor: new (...args: any[]) => T): any
}

export interface IContainer {
	bind<T>(identifer: Identifier<T>): IBindingTo<T>
	get<T>(identifier: Identifier<T>): T
	getAll<T>(identifier: Identifier<T>): T[]
}