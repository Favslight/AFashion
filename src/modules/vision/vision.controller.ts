import type { FastifyReply, FastifyRequest } from "fastify";
import { MAX_UPLOAD_BYTES } from "../../utils/constants.js";
import { getMultipartField } from "../../utils/image.js";
import { ok } from "../../utils/response.js";
import {
  analyzeWardrobeFieldsSchema,
  outfitReviewFieldsSchema,
  uuidParamsSchema
} from "./vision.schema.js";
import * as service from "./vision.service.js";

export async function analyzeWardrobeItem(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
  if (!file) throwRequiredFile();
  const input = analyzeWardrobeFieldsSchema.parse({
    saveToWardrobe: getMultipartField(file, "saveToWardrobe"),
    name: getMultipartField(file, "name")
  });
  const result = await service.analyzeWardrobeImageUpload(request.user!.id, await file.toBuffer(), input);
  return ok(reply, "Wardrobe image analyzed", result, 201);
}

export async function reviewOutfitPhoto(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
  if (!file) throwRequiredFile();
  const input = outfitReviewFieldsSchema.parse({
    occasionSlug: getMultipartField(file, "occasionSlug"),
    location: getMultipartField(file, "location"),
    weatherData: getMultipartField(file, "weatherData")
  });
  const result = await service.reviewOutfitPhoto(request.user!.id, await file.toBuffer(), input);
  return ok(reply, "Outfit photo reviewed", result, 201);
}

export async function listReviews(request: FastifyRequest, reply: FastifyReply) {
  const reviews = await service.listReviews(request.user!.id);
  return ok(reply, "Outfit photo reviews fetched", { reviews });
}

export async function getReview(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  const review = await service.getReview(request.user!.id, id);
  return ok(reply, "Outfit photo review fetched", { review });
}

export async function deleteReview(request: FastifyRequest, reply: FastifyReply) {
  const { id } = uuidParamsSchema.parse(request.params);
  await service.deleteReview(request.user!.id, id);
  return ok(reply, "Outfit photo review deleted");
}

function throwRequiredFile(): never {
  const error = new Error("Image file is required");
  (error as Error & { statusCode?: number }).statusCode = 400;
  throw error;
}
