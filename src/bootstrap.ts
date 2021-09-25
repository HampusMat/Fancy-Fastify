import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { readdir, stat } from "fs";
import { Loader } from "./loader";
import { IContainer, IDIDecorator } from "./interfaces/container.interface";
import { IHooks } from "./interfaces/hooks.interface";
import { Filesystem } from "./lib/filesystem";
import { ControllerUtils } from "./utils/controller";
import { ControllerFetcher } from "./utils/controller_fetcher";
import { importControllers } from "./utils/importer";

/**
 * Bootstrap Fastify controllers
 *
 * @param container - A DI container
 * @param controller_dir - A directory with controllers
 * @param di_decorator - A decorator from a DI container used to mark that a class can be injected
 * @param [hooks] - Hooks for the various stages in bootstrapping
 * @returns A Fastify plugin that will load your controllers
 *
 * @example
 *
 * import fastify from "fastify";
 * import { Container, injectable } from "inversify";
 * import { fancyFastify } from "fancy-fastify";
 *
 * const app = fastify();
 * const container = new Container();
 *
 * app.register(fancyFastify(container, join(__dirname, "controllers"), injectable));
 */
export function fancyFastify(
	container: IContainer,
	controller_dir: string,
	di_decorator: IDIDecorator,
	hooks?: IHooks
): FastifyPluginAsync {
	return async(fastify: FastifyInstance) => {
		global.di_decorator = di_decorator;

		const loader = new Loader(
			container,
			new ControllerUtils(),
			new ControllerFetcher(
				new Filesystem(readdir, stat)
			),
			importControllers
		);

		await loader.load(fastify, controller_dir, hooks);
	};
}