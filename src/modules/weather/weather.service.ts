import { env } from "../../config/env.js";
import { queryOne } from "../../database/db.js";
import { buildOutfitGenerationContext } from "../ai/ai.context.js";
import { weatherStylingAgent } from "../ai/ai.agents.js";

export async function getCurrentWeather(location: string) {
  const today = new Date().toISOString().slice(0, 10);
  const cached = await queryOne<{ weather_data: unknown }>(
    `SELECT weather_data
     FROM weather_style_cache
     WHERE LOWER(location) = LOWER($1)
       AND weather_date = $2::date
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC
     LIMIT 1`,
    [location, today]
  );

  if (cached) return cached.weather_data;

  if (!env.WEATHER_API_KEY) {
    const error = new Error("WEATHER_API_KEY is not configured");
    (error as Error & { statusCode?: number }).statusCode = 503;
    throw error;
  }

  const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(env.WEATHER_API_KEY)}&q=${encodeURIComponent(location)}&aqi=no`);
  if (!response.ok) {
    const error = new Error("Unable to fetch current weather");
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  const raw = await response.json() as {
    location?: { name?: string; region?: string; country?: string; localtime?: string };
    current?: {
      temp_c?: number;
      feelslike_c?: number;
      humidity?: number;
      wind_kph?: number;
      precip_mm?: number;
      condition?: { text?: string };
    };
  };

  const weatherData = {
    location: raw.location,
    temperature_c: raw.current?.temp_c,
    feels_like_c: raw.current?.feelslike_c,
    humidity: raw.current?.humidity,
    wind_kph: raw.current?.wind_kph,
    precipitation_mm: raw.current?.precip_mm,
    condition: raw.current?.condition?.text,
    source: "weatherapi.com"
  };

  await queryOne(
    `INSERT INTO weather_style_cache (location, weather_date, weather_data, expires_at)
     VALUES ($1, $2::date, $3, NOW() + INTERVAL '2 hours')
     RETURNING id`,
    [location, today, weatherData]
  );

  return weatherData;
}

export async function getWeatherStyleAdvice(userId: string, input: {
  location: string;
  occasionSlug: string;
  preferences?: Record<string, unknown>;
}) {
  const weatherData = await getCurrentWeather(input.location);
  const fashionContext = await buildOutfitGenerationContext(userId, input.occasionSlug);
  const advice = await weatherStylingAgent(userId, {
    location: input.location,
    weather: weatherData,
    occasion_slug: input.occasionSlug,
    preferences: input.preferences,
    fashion_context: fashionContext
  });

  const today = new Date().toISOString().slice(0, 10);
  await queryOne(
    `UPDATE weather_style_cache
     SET style_advice = $3
     WHERE LOWER(location) = LOWER($1) AND weather_date = $2::date
     RETURNING id`,
    [input.location, today, advice]
  );

  return { weather: weatherData, advice };
}
