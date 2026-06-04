import type { FastifyReply, FastifyRequest } from "fastify";
import { MAX_UPLOAD_BYTES } from "../../utils/constants.js";
import {
  getMultipartField,
  optimizeImage,
  uploadImageToCloudinary,
  validateImageBuffer
} from "../../utils/image.js";
import { ok } from "../../utils/response.js";
import {
  analyzeOutfitPhotoFieldsSchema,
  recommendForEventSchema,
  styleChatSchema
} from "./ai.schema.js";
import * as service from "./ai.service.js";

export async function styleChat(request: FastifyRequest, reply: FastifyReply) {
  const input = styleChatSchema.parse(request.body);
  const result = await service.styleChat(request.user!.id, input);
  return ok(reply, "Stylist response generated", result);
}

export async function analyzeOutfitPhoto(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
  if (!file) {
    const error = new Error("Outfit photo is required");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const fields = analyzeOutfitPhotoFieldsSchema.parse({
    occasion: getMultipartField(file, "occasion")
  });
  const buffer = await file.toBuffer();
  await validateImageBuffer(buffer);
  const optimized = await optimizeImage(buffer);
  const upload = await uploadImageToCloudinary(optimized, `what-should-i-wear/${request.user!.id}/outfit-photos`);
  const analysis = await service.analyzeOutfitPhoto(request.user!.id, upload.secure_url, fields.occasion);

  return ok(reply, "Outfit photo analyzed", {
    image_url: upload.secure_url,
    analysis
  });
}

export async function recommendForEvent(request: FastifyRequest, reply: FastifyReply) {
  const input = recommendForEventSchema.parse(request.body);
  const result = await service.recommendForEvent(request.user!.id, input);
  return ok(reply, "Event recommendation generated", result);
}

export async function realtimeSessionToken(request: FastifyRequest, reply: FastifyReply) {
  const session = await service.createRealtimeSessionToken(request.user!.id);
  return ok(reply, "Realtime session token created", { session });
}
