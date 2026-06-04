import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((rawError, _request, reply) => {
    const error = rawError as Error & { statusCode?: number; code?: string };
    const statusCode = error.statusCode ?? 500;

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: error.flatten()
      });
    }

    if (error.code === "23505") {
      return reply.status(409).send({
        success: false,
        message: "A record with this value already exists"
      });
    }

    const isServerError = statusCode >= 500;
    if (isServerError) {
      app.log.error(error);
    }

    return reply.status(statusCode).send({
      success: false,
      message: isServerError && env.isProduction ? "Internal server error" : error.message,
      ...(!env.isProduction && isServerError ? { errors: { stack: error.stack } } : {})
    });
  });
}
