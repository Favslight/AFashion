import type { FastifyReply } from "fastify";

export function ok<T>(reply: FastifyReply, message: string, data?: T, statusCode = 200) {
  return reply.status(statusCode).send({
    success: true,
    message,
    data: data ?? null
  });
}

export function fail(reply: FastifyReply, message: string, statusCode = 400, errors?: unknown) {
  return reply.status(statusCode).send({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
}
