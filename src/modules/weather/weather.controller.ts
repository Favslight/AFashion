import type { FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { currentWeatherQuerySchema, weatherStyleAdviceSchema } from "./weather.schema.js";
import * as service from "./weather.service.js";

export async function current(request: FastifyRequest, reply: FastifyReply) {
  const { location } = currentWeatherQuerySchema.parse(request.query);
  const weather = await service.getCurrentWeather(location);
  return ok(reply, "Current weather fetched", { weather });
}

export async function styleAdvice(request: FastifyRequest, reply: FastifyReply) {
  const input = weatherStyleAdviceSchema.parse(request.body);
  const data = await service.getWeatherStyleAdvice(request.user!.id, input);
  return ok(reply, "Weather style advice generated", data);
}
