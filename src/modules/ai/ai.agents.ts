import { z } from "zod";
import { OPENAI_TEXT_MODEL, OPENAI_VISION_MODEL, openai } from "../../config/openai.js";
import { logAiUsage } from "../subscriptions/subscriptions.service.js";
import { buildChatContext, buildOutfitGenerationContext, buildUserFashionContext } from "./ai.context.js";
import {
  CULTURAL_FASHION_STYLIST_PROMPT,
  FASHION_STYLIST_SYSTEM_PROMPT,
  EVENT_STYLING_PROMPT,
  MEMORY_AWARE_OUTFIT_PROMPT,
  OCCASION_STYLING_PROMPT,
  OUTFIT_CRITIC_PROMPT,
  OUTFIT_PHOTO_REVIEW_PROMPT,
  OUTFIT_GENERATOR_PROMPT,
  PERSONAL_SHOPPER_PROMPT,
  PERSONAL_STYLE_MEMORY_PROMPT,
  VISION_WARDROBE_ANALYSIS_PROMPT,
  WARDROBE_HEALTH_PROMPT,
  WEATHER_STYLING_PROMPT,
  WARDROBE_ANALYSIS_PROMPT
} from "./ai.prompts.js";

const wardrobeAnalysisSchema = z.object({
  category: z.string().default("unknown"),
  subcategory: z.string().default("unknown"),
  color: z.string().default("unknown"),
  secondaryColors: z.array(z.string()).default([]),
  styleTags: z.array(z.string()).default([]),
  materialGuess: z.string().default("unknown"),
  seasonTags: z.array(z.string()).default([]),
  genderFit: z.string().default("unisex"),
  description: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0)
});

const outfitGeneratorSchema = z.object({
  title: z.string().default("Styled outfit"),
  selectedWardrobeItemIds: z.array(z.string()).default([]),
  stylingNotes: z.string().default(""),
  whyThisWorks: z.string().default(""),
  accessorySuggestions: z.array(z.string()).default([]),
  alternativeCombinations: z.array(z.unknown()).default([]),
  scores: z.object({
    colorHarmony: z.number().min(0).max(10).default(0),
    occasionFit: z.number().min(0).max(10).default(0),
    formality: z.number().min(0).max(10).default(0),
    comfort: z.number().min(0).max(10).default(0),
    overall: z.number().min(0).max(10).default(0)
  }).default({
    colorHarmony: 0,
    occasionFit: 0,
    formality: 0,
    comfort: 0,
    overall: 0
  })
});

const outfitCriticSchema = z.object({
  overall_score: z.number().min(0).max(10).default(0),
  occasion_suitability: z.string().default(""),
  color_harmony: z.string().default(""),
  fit_balance: z.string().default(""),
  formality: z.string().default(""),
  what_works: z.array(z.string()).default([]),
  what_to_improve: z.array(z.string()).default([]),
  accessory_suggestions: z.array(z.string()).default([]),
  final_recommendation: z.string().default("")
});

const personalShopperSchema = z.object({
  summary: z.string().default(""),
  missing_items: z.array(z.object({
    name: z.string(),
    category: z.string(),
    priority: z.string(),
    recommended_colors: z.array(z.string()).default([]),
    why_needed: z.string(),
    estimated_budget_note: z.string().default("")
  })).default([]),
  avoid_buying: z.array(z.string()).default([]),
  styling_strategy: z.string().default("")
});

const visionWardrobeAnalysisSchema = z.object({
  category: z.string().default("unknown"),
  subcategory: z.string().default("unknown"),
  color: z.string().default("unknown"),
  secondaryColors: z.array(z.string()).default([]),
  pattern: z.string().default("unknown"),
  materialGuess: z.string().default("unknown"),
  styleTags: z.array(z.string()).default([]),
  seasonTags: z.array(z.string()).default([]),
  genderFit: z.string().default("unisex"),
  formalityLevel: z.string().default("casual"),
  recommendedOccasions: z.array(z.string()).default([]),
  avoidOccasions: z.array(z.string()).default([]),
  description: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0)
});

const outfitPhotoReviewSchema = z.object({
  overallScore: z.number().min(0).max(10).default(0),
  colorHarmonyScore: z.number().min(0).max(10).default(0),
  formalityScore: z.number().min(0).max(10).default(0),
  fitBalanceScore: z.number().min(0).max(10).default(0),
  occasionSuitabilityScore: z.number().min(0).max(10).default(0),
  feedback: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  accessorySuggestions: z.array(z.string()).default([]),
  alternativeSuggestions: z.array(z.string()).default([]),
  finalVerdict: z.string().default("")
});

const weatherStylingSchema = z.object({
  weatherSummary: z.string().default(""),
  styleAdvice: z.string().default(""),
  recommendedCategories: z.array(z.string()).default([]),
  avoidCategories: z.array(z.string()).default([]),
  fabricAdvice: z.array(z.string()).default([]),
  footwearAdvice: z.array(z.string()).default([]),
  colorAdvice: z.array(z.string()).default([]),
  comfortTips: z.array(z.string()).default([])
});

const wardrobeHealthSchema = z.object({
  missingEssentials: z.array(z.unknown()).default([]),
  overrepresentedItems: z.array(z.unknown()).default([]),
  underrepresentedItems: z.array(z.unknown()).default([]),
  recommendations: z.array(z.unknown()).default([]),
  summary: z.string().default("")
});

const fashionMemorySchema = z.object({
  memories: z.array(z.object({
    memoryType: z.string(),
    memoryKey: z.string(),
    memoryValue: z.record(z.unknown()).default({}),
    confidenceScore: z.number().min(0).max(1).default(0.5)
  })).default([]),
  stylePersonalitySummary: z.string().default("")
});

const eventStylingSchema = z.object({
  title: z.string().default("Event outfit"),
  eventReadinessScore: z.number().min(0).max(10).default(0),
  selectedWardrobeItemIds: z.array(z.string()).default([]),
  stylingNotes: z.string().default(""),
  whyThisWorksForEvent: z.string().default(""),
  whyThisFitsUser: z.string().default(""),
  recentlyWornWarnings: z.array(z.string()).default([]),
  accessorySuggestions: z.array(z.string()).default([]),
  alternatives: z.array(z.unknown()).default([]),
  finalChecklist: z.array(z.string()).default([])
});

const culturalFashionStylingSchema = z.object({
  title: z.string().default("Cultural look"),
  culturalContext: z.string().default(""),
  recommendedLook: z.string().default(""),
  wardrobeItemIds: z.array(z.string()).default([]),
  missingPieces: z.array(z.string()).default([]),
  accessories: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  mistakesToAvoid: z.array(z.string()).default([]),
  modernStylingTips: z.array(z.string()).default([]),
  whyThisWorks: z.string().default("")
});

export async function analyzeWardrobeItemAgent(userId: string, imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: WARDROBE_ANALYSIS_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this clothing item and return only the requested JSON." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  await logAiUsage(userId, "wardrobe_item_analysis", completion.usage?.total_tokens ?? 0, OPENAI_VISION_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, wardrobeAnalysisSchema);
}

export async function visionWardrobeAnalysisAgent(userId: string, imageUrl: string, context?: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: VISION_WARDROBE_ANALYSIS_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: JSON.stringify({ task: "Analyze this single clothing item.", context }) },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  await logAiUsage(userId, "vision_wardrobe_analysis", completion.usage?.total_tokens ?? 0, OPENAI_VISION_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, visionWardrobeAnalysisSchema);
}

export async function generateOutfitAgent(userId: string, input: {
  occasionSlug: string;
  weather?: string;
  mood?: string;
  genderStylePreference?: string;
  memoryAware?: boolean;
  extraContext?: unknown;
}) {
  const context = await buildOutfitGenerationContext(userId, input.occasionSlug);

  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${OUTFIT_GENERATOR_PROMPT}\n${input.memoryAware ? MEMORY_AWARE_OUTFIT_PROMPT : ""}` },
      {
        role: "user",
        content: JSON.stringify({
          task: "Generate an outfit from the wardrobe items only.",
          weather: input.weather,
          mood: input.mood,
          gender_style_preference: input.genderStylePreference,
          context,
          extra_context: input.extraContext
        })
      }
    ]
  });

  await logAiUsage(userId, "outfit_generation", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return {
    result: parseAndValidate(completion.choices[0]?.message.content, outfitGeneratorSchema),
    context
  };
}

export async function fashionMemoryAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${PERSONAL_STYLE_MEMORY_PROMPT}` },
      { role: "user", content: JSON.stringify(context) }
    ]
  });

  await logAiUsage(userId, "fashion_memory_rebuild", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, fashionMemorySchema);
}

export async function memoryAwareOutfitAgent(userId: string, input: {
  occasionSlug: string;
  weather?: string;
  mood?: string;
  genderStylePreference?: string;
  extraContext?: unknown;
}) {
  return generateOutfitAgent(userId, { ...input, memoryAware: true });
}

export async function eventStylingAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${EVENT_STYLING_PROMPT}` },
      { role: "user", content: JSON.stringify(context) }
    ]
  });

  await logAiUsage(userId, "event_styling", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, eventStylingSchema);
}

export async function culturalFashionStylingAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${CULTURAL_FASHION_STYLIST_PROMPT}` },
      { role: "user", content: JSON.stringify(context) }
    ]
  });

  await logAiUsage(userId, "cultural_fashion_styling", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, culturalFashionStylingSchema);
}

export async function outfitFeedbackLearningAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${PERSONAL_STYLE_MEMORY_PROMPT}` },
      { role: "user", content: JSON.stringify({ task: "Learn from this outfit feedback.", context }) }
    ]
  });

  await logAiUsage(userId, "outfit_feedback_learning", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, fashionMemorySchema);
}

export async function occasionStylingAgent(userId: string, input: {
  occasionSlug: string;
  weather?: string;
  mood?: string;
}) {
  const context = await buildOutfitGenerationContext(userId, input.occasionSlug);
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${OCCASION_STYLING_PROMPT}` },
      { role: "user", content: JSON.stringify({ request: input, context }) }
    ]
  });

  await logAiUsage(userId, "occasion_styling", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return { recommendation: completion.choices[0]?.message.content ?? "" };
}

export async function outfitCriticAgent(userId: string, imageUrl: string, occasion?: string) {
  const context = await buildUserFashionContext(userId);
  const completion = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${OUTFIT_CRITIC_PROMPT}` },
      {
        role: "user",
        content: [
          { type: "text", text: JSON.stringify({ occasion, context }) },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  await logAiUsage(userId, "outfit_photo_analysis", completion.usage?.total_tokens ?? 0, OPENAI_VISION_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, outfitCriticSchema);
}

export async function outfitPhotoReviewAgent(userId: string, imageUrl: string, input: {
  occasionSlug?: string;
  weatherContext?: unknown;
}) {
  const context = await buildUserFashionContext(userId);
  const completion = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${OUTFIT_PHOTO_REVIEW_PROMPT}` },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              occasion_slug: input.occasionSlug,
              weather_context: input.weatherContext,
              fashion_context: context
            })
          },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  await logAiUsage(userId, "outfit_photo_review", completion.usage?.total_tokens ?? 0, OPENAI_VISION_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, outfitPhotoReviewSchema);
}

export async function personalShopperAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${PERSONAL_SHOPPER_PROMPT}` },
      { role: "user", content: JSON.stringify(context) }
    ]
  });

  await logAiUsage(userId, "personal_shopper", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, personalShopperSchema);
}

export async function weatherStylingAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${WEATHER_STYLING_PROMPT}` },
      { role: "user", content: JSON.stringify(context) }
    ]
  });

  await logAiUsage(userId, "weather_styling", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, weatherStylingSchema);
}

export async function wardrobeHealthAgent(userId: string, context: unknown) {
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${FASHION_STYLIST_SYSTEM_PROMPT}\n${WARDROBE_HEALTH_PROMPT}` },
      { role: "user", content: JSON.stringify(context) }
    ]
  });

  await logAiUsage(userId, "wardrobe_health", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return parseAndValidate(completion.choices[0]?.message.content, wardrobeHealthSchema);
}

export async function stylistChatAgent(userId: string, message: string) {
  const context = await buildChatContext(userId, message);
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    messages: [
      { role: "system", content: FASHION_STYLIST_SYSTEM_PROMPT },
      { role: "system", content: JSON.stringify({ fashion_context: context }) },
      { role: "user", content: message }
    ]
  });

  await logAiUsage(userId, "style_chat", completion.usage?.total_tokens ?? 0, OPENAI_TEXT_MODEL);
  return completion.choices[0]?.message.content ?? "";
}

function parseAndValidate<T extends z.ZodTypeAny>(raw: string | null | undefined, schema: T): z.infer<T> {
  if (!raw) {
    throwAiError("AI returned an empty response");
  }

  const parsedJson = safeJson(raw);
  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    const error = new Error("AI returned malformed structured output");
    (error as Error & { statusCode?: number; errors?: unknown }).statusCode = 502;
    (error as Error & { errors?: unknown }).errors = parsed.error.flatten();
    throw error;
  }

  return parsed.data;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(raw.slice(first, last + 1));
      } catch {
        throwAiError("AI returned invalid JSON");
      }
    }
    throwAiError("AI returned invalid JSON");
  }
}

function throwAiError(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 502;
  throw error;
}
