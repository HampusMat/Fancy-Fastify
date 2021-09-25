import "reflect-metadata";
import { controller } from "../../src";
import { IDIDecorator } from "../../src/interfaces/container.interface";

declare global {
	// eslint-disable-next-line no-var
	var di_decorator: IDIDecorator;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
global.di_decorator = () => () => {};

describe("Controller decorator", () => {
	it("Should set controller metadata", () => {
		const decorator = controller({
			name: "APIControllerV1",
			prefix: "/api/v1"
		});

		const controllerConstructor = () => {
			console.log("Creating api v1 controller");
		};

		decorator(controllerConstructor);

		expect(Reflect.getMetadata("pretty_type", controllerConstructor)).toEqual("controller");
		expect(Reflect.getMetadata("is_registered", controllerConstructor)).toBeFalsy();
		expect(Reflect.getMetadata("name", controllerConstructor)).toEqual("APIControllerV1");
		expect(Reflect.getMetadata("prefix", controllerConstructor)).toEqual("/api/v1");
	});
});