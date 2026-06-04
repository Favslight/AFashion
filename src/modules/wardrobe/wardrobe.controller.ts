import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "../../utils/constants.js";
import { getMultipartField } from "../../utils/image.js";
import { ok } from "../../utils/response.js";
import * as visionService from "../vision/vision.service.js";
import { wardrobeUpdateSchema, wardrobeUploadFieldsSchema } from "./wardrobe.schema.js";
import * as service from "./wardrobe.service.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function upload(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
  if (!file) {
    const error = new Error("Image file is required");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const fields = wardrobeUploadFieldsSchema.parse({
    name: getMultipartField(file, "name"),
    category: getMultipartField(file, "category"),
    subcategory: getMultipartField(file, "subcategory"),
    gender_fit: getMultipartField(file, "gender_fit"),
    color: getMultipartField(file, "color"),
    material: getMultipartField(file, "material")
  });
  const buffer = await file.toBuffer();
  const item = await service.uploadWardrobeItem(request.user!.id, buffer, fields);
  return ok(reply, "Wardrobe item uploaded", { item }, 201);
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const items = await service.listWardrobe(request.user!.id);
  return ok(reply, "Wardrobe fetched", { items });
}

export async function getOne(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const item = await service.getWardrobeItem(request.user!.id, id);
  return ok(reply, "Wardrobe item fetched", { item });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const input = wardrobeUpdateSchema.parse(request.body);
  const item = await service.updateWardrobeItem(request.user!.id, id, input);
  return ok(reply, "Wardrobe item updated", { item });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  await service.deleteWardrobeItem(request.user!.id, id);
  return ok(reply, "Wardrobe item deleted");
}

export async function analyze(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const item = await service.analyzeAndUpdateWardrobeItem(request.user!.id, id);
  return ok(reply, "Wardrobe item analyzed", { item });
}

export async function rescan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const result = await visionService.rescanWardrobeItem(request.user!.id, id);
  return ok(reply, "Wardrobe item rescanned", result);
}

export async function bulkScan(request: FastifyRequest, reply: FastifyReply) {
  const files: Array<{ buffer: Buffer; filename?: string }> = [];
  for await (const file of request.files()) {
    files.push({
      buffer: await file.toBuffer(),
      filename: file.filename
    });
  }

  if (!files.length) {
    const error = new Error("At least one image file is required");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const result = await visionService.bulkScan(request.user!.id, files);
  return ok(reply, "Bulk wardrobe scan completed", result, 201);
}

export async function scanJobs(request: FastifyRequest, reply: FastifyReply) {
  const jobs = await visionService.listScanJobs(request.user!.id);
  return ok(reply, "Wardrobe scan jobs fetched", { jobs });
}

export async function scanJob(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const job = await visionService.getScanJob(request.user!.id, id);
  return ok(reply, "Wardrobe scan job fetched", { job });
}
