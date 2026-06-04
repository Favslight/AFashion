import type { FastifyReply, FastifyRequest } from "fastify";

export function asyncHandler<TRequest extends FastifyRequest = FastifyRequest>(
  handler: (request: TRequest, reply: FastifyReply) => Promise<unknown>
) {
  return (request: FastifyRequest, reply: FastifyReply) => handler(request as TRequest, reply);
}
