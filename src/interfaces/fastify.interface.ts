import {
	FastifyRequest,
	FastifyReply,
	RawServerBase,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	ContextConfigDefault,
	RawServerDefault,
	FastifyError
} from "fastify";
import { RouteGenericInterface } from "fastify/types/route";

export interface RouteHandler<
	RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
	RawServer extends RawServerBase = RawServerDefault,
	RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
	RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
	ContextConfig = ContextConfigDefault
> {
	(
		request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
		reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
	): Promise<void>
}

export interface ErrorHandler {
	(error: FastifyError, request: FastifyRequest, reply: FastifyReply): void
}

export interface RouteDecorator {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<RouteHandler>): void
}

export interface ErrorHandlerDecorator {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<ErrorHandler>): void
}