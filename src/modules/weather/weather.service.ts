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

  const raw = await fetchOpenWeather(location);

  const weatherData = {
    location: {
      name: raw.name,
      country: raw.sys?.country,
      coordinates: raw.coord,
      timezone_offset_seconds: raw.timezone,
      observed_at_unix: raw.dt
    },
    temperature_c: raw.main?.temp,
    feels_like_c: raw.main?.feels_like,
    humidity: raw.main?.humidity,
    wind_kph: raw.wind?.speed !== undefined ? Math.round(raw.wind.speed * 3.6 * 10) / 10 : undefined,
    precipitation_mm: raw.rain?.["1h"] ?? raw.snow?.["1h"] ?? 0,
    condition: raw.weather?.[0]?.description ?? raw.weather?.[0]?.main,
    source: "openweathermap.org"
  };

  await queryOne(
    `INSERT INTO weather_style_cache (location, weather_date, weather_data, expires_at)
     VALUES ($1, $2::date, $3, NOW() + INTERVAL '2 hours')
     RETURNING id`,
    [location, today, weatherData]
  );

  return weatherData;
}

type OpenWeatherResponse = {
  name?: string;
  dt?: number;
  timezone?: number;
  coord?: {
    lon?: number;
    lat?: number;
  };
  weather?: Array<{
    main?: string;
    description?: string;
    icon?: string;
  }>;
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
  };
  rain?: {
    "1h"?: number;
  };
  snow?: {
    "1h"?: number;
  };
  sys?: {
    country?: string;
  };
};

async function fetchOpenWeather(location: string) {
  const candidates = location.includes(",") ? [location] : [location, `${location},NG`];

  for (const candidate of candidates) {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", candidate);
    url.searchParams.set("appid", env.WEATHER_API_KEY);
    url.searchParams.set("units", "metric");

    const response = await fetch(url);
    if (response.ok) {
      return await response.json() as OpenWeatherResponse;
    }

    if (response.status !== 404 || candidate === candidates[candidates.length - 1]) {
      const error = new Error(`Unable to fetch current weather from OpenWeatherMap (${response.status})`);
      (error as Error & { statusCode?: number }).statusCode = response.status === 401 ? 503 : 502;
      throw error;
    }
  }

  const error = new Error("Unable to fetch current weather from OpenWeatherMap");
  (error as Error & { statusCode?: number }).statusCode = 502;
  throw error;
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
