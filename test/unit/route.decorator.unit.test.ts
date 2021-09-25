import "reflect-metadata";
import { FastifyReply, FastifyRequest } from "fastify";
import { route } from "../../src";

describe("Route decorator", () => {
	it("Should set route metadata", () => {
		const decorator = route({ method: "GET", url: "/about" });

		const controller = {
			async aboutRoute(req: FastifyRequest, reply: FastifyReply) {
				reply.send("Hello there");
			}
		};

		decorator(controller, "aboutRoute", { value: controller.aboutRoute });

		expect(Reflect.getMetadata("pretty_type", controller, "aboutRoute")).toEqual("route");
		expect(Reflect.getMetadata("method", controller, "aboutRoute")).toEqual("GET");
		expect(Reflect.getMetadata("url", controller, "aboutRoute")).toEqual("/about");
		expect(Reflect.getMetadata("handler", controller, "aboutRoute")).toEqual("aboutRoute");

		expect(Reflect.getMetadata("routes", controller)).toHaveLength(1);
	});
});