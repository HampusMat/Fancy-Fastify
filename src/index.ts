import { IDIDecorator } from "./interfaces/container.interface";

// Global variables available everywhere and across imports
declare global {
	var di_decorator: IDIDecorator; // eslint-disable-line no-var
}

export { fancyFastify } from "./bootstrap";

export * from "./decorators/controller.decorator";
export * from "./decorators/error_handler.decorator";
export * from "./decorators/not_found_handler.decorator";
export * from "./decorators/route.decorator";

export * from "./interfaces/fastify.interface";