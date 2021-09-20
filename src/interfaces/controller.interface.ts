// eslint-disable-next-line @typescript-eslint/ban-types
export type ControllerCtor = (new (...args: unknown[]) => unknown) | Function;

export interface ControllerInstance {
	// eslint-disable-next-line @typescript-eslint/ban-types
	constructor: Function
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any
}