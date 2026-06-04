import OpenAI from "openai";
import { env } from "./env.js";

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export const OPENAI_TEXT_MODEL = "gpt-4o-mini";
export const OPENAI_VISION_MODEL = "gpt-4o-mini";
