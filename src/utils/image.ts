import { Readable } from "node:stream";
import type { MultipartFile } from "@fastify/multipart";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { cloudinary } from "../config/cloudinary.js";
import { ALLOWED_IMAGE_MIME_TYPES } from "./constants.js";

export async function validateImageBuffer(buffer: Buffer) {
  const type = await fileTypeFromBuffer(buffer);

  if (!type || !ALLOWED_IMAGE_MIME_TYPES.has(type.mime)) {
    const error = new Error("Only JPG, PNG, and WEBP images are allowed");
    (error as Error & { statusCode?: number }).statusCode = 415;
    throw error;
  }

  return type;
}

export async function optimizeImage(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();
}

export async function uploadImageToCloudinary(buffer: Buffer, folder: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        overwrite: false
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    Readable.from(buffer).pipe(upload);
  });
}

export async function deleteCloudinaryImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export function getMultipartField(file: MultipartFile, fieldName: string) {
  const field = file.fields[fieldName];
  if (!field || Array.isArray(field) || field.type !== "field") {
    return undefined;
  }

  return typeof field.value === "string" ? field.value : String(field.value);
}
