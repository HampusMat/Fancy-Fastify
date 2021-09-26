import {
	FastifyRequest,
	FastifyReply,
	FastifyError,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	RouteOptions
} from "fastify";
import { Server } from "http";

export interface IFancyRequest {
	Params: Record<string, string>
	Querystring: Record<string, string>
}

export interface RouteHandler {
	(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		request: FastifyRequest<IFancyRequest>,
		reply: FastifyReply,
	): Promise<void>
}

export type FancyRouteOptions = RouteOptions<
	Server,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	IFancyRequest
>

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