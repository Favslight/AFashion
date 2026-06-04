**What Should I Wear? Backend**

Production-ready Fastify + TypeScript backend for an AI fashion styling platform.

**Stack**

- Fastify, TypeScript, PostgreSQL with `pg`
- JWT auth, bcrypt password hashing, zod validation
- Cloudinary uploads, Sharp image optimization, file signature validation
- OpenAI API for wardrobe analysis, outfit generation, stylist chat, and outfit photo feedback
- Resend for verification, reset, and welcome emails
- Helmet, CORS whitelist, global and route-level rate limits

**Setup**

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Create a PostgreSQL database and run the schema:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

4. Start development server:

```bash
npm run dev
```

5. Build and run production output:

```bash
npm run build
npm start
```

**API Shape**

Successful responses:

```json
{
  "success": true,
  "message": "Done",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

**Database**

The complete schema and seed data live in `src/database/schema.sql`. It includes seed subscription plans and outfit occasions.

**Security Notes**

- All private routes use the JWT auth middleware.
- `password_hash`, reset tokens, verification token hashes, and Cloudinary credentials are never returned.
- Uploads are accepted only through the backend, validated by file signature, optimized with Sharp, then uploaded to Cloudinary.
- Subscription limits are enforced before wardrobe uploads and AI generation actions.

**Admin Setup**

Admin accounts are stored separately from public users in `admin_users`. Admin APIs live under `/api/admin` and require an admin JWT from `POST /api/admin/auth/login`. Super admins have full access. Operational admins can manage day-to-day moderation, users, settings, policies, analytics, and subscriptions, but cannot perform super-admin-only actions.

The schema seeds these admin accounts:

```txt
full_name: Fashionista
email: admin@fashionista.com
role: super_admin

full_name: Fashionio
email: admin@fashionio.com
role: admin
```

Run the updated schema before using admin routes:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

**Admin Routes**

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/wardrobe-items`
- `GET /api/admin/wardrobe-items/:id`
- `DELETE /api/admin/wardrobe-items/:id`
- `GET /api/admin/outfits`
- `GET /api/admin/outfits/:id`
- `DELETE /api/admin/outfits/:id`
- `GET /api/admin/moderation/reports`
- `GET /api/admin/moderation/reports/:id`
- `PATCH /api/admin/moderation/reports/:id/status`
- `POST /api/admin/moderation/blocked-keywords`
- `GET /api/admin/moderation/blocked-keywords`
- `PATCH /api/admin/moderation/blocked-keywords/:id`
- `DELETE /api/admin/moderation/blocked-keywords/:id`
- `GET /api/admin/settings`
- `GET /api/admin/settings/:key`
- `POST /api/admin/settings`
- `PATCH /api/admin/settings/:key`
- `GET /api/settings/public`
- `POST /api/admin/policies`
- `GET /api/admin/policies`
- `GET /api/admin/policies/:id`
- `PATCH /api/admin/policies/:id`
- `DELETE /api/admin/policies/:id`
- `GET /api/admin/subscriptions/plans`
- `POST /api/admin/subscriptions/plans`
- `PATCH /api/admin/subscriptions/plans/:id`
- `DELETE /api/admin/subscriptions/plans/:id`
- `GET /api/admin/subscriptions/users`
- `PATCH /api/admin/subscriptions/users/:userId`
- `GET /api/admin/analytics/users`
- `GET /api/admin/analytics/wardrobe`
- `GET /api/admin/analytics/outfits`
- `GET /api/admin/analytics/ai-usage`
- `GET /api/admin/analytics/subscriptions`

Admin list endpoints support pagination, search, filters, and safe allow-listed sorting via query parameters such as `page`, `limit`, `search`, `sort_by`, and `sort_order`.

**Site Settings**

Site settings are stored in `site_settings` as JSON values so product and safety controls can change without code changes. Seeded settings include `app_name`, `maintenance_mode`, `allow_new_signups`, plan limits, upload limits, supported image types, subscription/community toggles, realtime AI toggle, outfit photo analysis toggle, terms/privacy versions, minimum user age, forbidden styling categories, and sensitive content rules.

Only settings with `is_public = true` are returned from `GET /api/settings/public`.

**Audit Logs**

Every admin mutation writes an `admin_audit_logs` row with the admin user, action, entity type, entity id, metadata, IP address, user agent, and timestamp. Example actions include `USER_SUSPENDED`, `USER_ROLE_CHANGED`, `SETTING_UPDATED`, `POLICY_CREATED`, `WARDROBE_ITEM_DELETED`, `OUTFIT_DELETED`, `SUBSCRIPTION_PLAN_UPDATED`, and `BLOCKED_KEYWORD_CREATED`.

**Moderation**

The moderation module supports user reports, report review status, blocked keywords, wardrobe item review/deletion, and outfit review/deletion. Reports can move through `pending`, `reviewing`, `resolved`, and `dismissed`.

**AI Safety Controls**

AI regulation is admin-controlled through settings and blocked keywords. Admins can configure forbidden styling categories, blocked words, sensitive content rules, minimum user age, AI generations per plan, outfit photo analysis availability, live camera AI availability, and celebrity-inspired look availability without redeploying the backend.

**Phase 2: Fashion Intelligence Layer**

Phase 2 adds a structured fashion knowledge layer so the backend behaves more like a real stylist engine than a generic wardrobe app. The system now stores color combinations, style rules, occasion rules, body type guidance, climate guidance, aesthetics, and persisted outfit scores in PostgreSQL.

New user-facing routes:

- `GET /api/fashion/colors/combinations`
- `GET /api/fashion/aesthetics`
- `GET /api/fashion/rules`
- `GET /api/fashion/occasions/:slug/rules`
- `POST /api/fashion/score-outfit`
- `POST /api/fashion/recommend-missing-items`

New admin fashion routes:

- `GET /api/admin/fashion/:resource`
- `POST /api/admin/fashion/:resource`
- `PATCH /api/admin/fashion/:resource/:id`
- `DELETE /api/admin/fashion/:resource/:id`

Supported admin resources are `colors`, `style-rules`, `occasion-rules`, `body-type-rules`, `climate-rules`, and `aesthetics`.

**Fashion Intelligence Architecture**

- `src/modules/fashion-intelligence` exposes fashion APIs and admin CRUD.
- `src/modules/ai/ai.context.ts` builds safe OpenAI context from user profile, wardrobe, subscription tier, occasion rules, style rules, color rules, body type rules, climate rules, aesthetics, and recent outfits.
- `src/modules/ai/ai.agents.ts` contains specialized OpenAI agents with strict JSON validation where needed.
- `src/modules/ai/ai.scoring.ts` scores outfits using fashion rules, wardrobe metadata, occasion metadata, climate hints, and user preferences.

Seed fashion intelligence data by rerunning:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

The schema seeds color combinations, major occasion rules, male/female/unisex styling rules, body type rules, climate rules, and aesthetics such as old money, streetwear, minimalist, classic, casual, corporate, romantic, soft girl, clean girl, afro-modern, luxury, sporty, and vintage.

**AI Agents**

- `analyzeWardrobeItemAgent`: analyzes uploaded clothing photos into structured wardrobe metadata.
- `generateOutfitAgent`: generates outfit combinations from wardrobe IDs and fashion intelligence context.
- `occasionStylingAgent`: gives event-specific styling guidance.
- `outfitCriticAgent`: analyzes an outfit photo and returns critique fields.
- `personalShopperAgent`: Premium wardrobe gap and missing-item recommendations.
- `stylistChatAgent`: natural chat using wardrobe, profile, recent messages, and fashion rules.

**Scoring**

Outfit scoring combines:

- color harmony from `color_combinations`
- occasion fit from `occasion_rules`
- formality match from occasion metadata and item categories
- comfort from climate rules, weather, materials, and categories
- wardrobe match from user preferences and item metadata

Generated outfits now save a row in `outfit_scores` with `color_harmony_score`, `occasion_fit_score`, `formality_score`, `comfort_score`, `wardrobe_match_score`, `overall_score`, and a JSON score breakdown.

**Outfit Generation Flow**

`POST /api/outfits/generate` now:

1. Authenticates the user.
2. Checks monthly AI generation limits.
3. Resolves the occasion.
4. Builds a full fashion intelligence context.
5. Calls `generateOutfitAgent`.
6. Validates selected wardrobe IDs belong to the user.
7. Calculates rule-based outfit scores.
8. Saves `outfits`, `outfit_items`, and `outfit_scores`.
9. Returns the outfit, selected items, score record, accessories, and alternatives.

**Subscription-Gated Phase 2 Features**

- Free: basic recommendations and normal outfit generation within plan limits.
- Pro: advanced outfit scoring via `POST /api/fashion/score-outfit`.
- Premium: personal shopper and wardrobe gap analysis via `POST /api/fashion/recommend-missing-items`.

**Phase 3: AI Vision, Weather Styling, And Wardrobe Health**

Phase 3 makes the stylist visually intelligent. Users can scan clothing photos, review outfit photos, get weather-aware styling, bulk scan wardrobe images, and generate wardrobe health reports. This phase intentionally does not include live video, WebRTC, realtime camera sessions, or frame-by-frame analysis.

New modules:

- `src/modules/vision`
- `src/modules/weather`
- `src/modules/wardrobe-health`

New tables:

- `outfit_photo_reviews`
- `wardrobe_scan_jobs`
- `weather_style_cache`
- `wardrobe_health_reports`

Run the schema again after pulling Phase 3:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

Add `WEATHER_API_KEY` to `.env`. The weather service uses WeatherAPI-compatible current weather responses and caches weather data in `weather_style_cache`.

**AI Vision**

`POST /api/vision/analyze-wardrobe-item` accepts a single image upload, validates the real file signature, optimizes with Sharp, uploads through backend Cloudinary credentials, and calls OpenAI Vision. If `saveToWardrobe=true`, the backend creates a wardrobe item automatically.

Example multipart fields:

- `file`: image
- `saveToWardrobe`: `true`
- `name`: optional wardrobe item name

**Outfit Photo Review**

`POST /api/vision/review-outfit-photo` accepts an outfit photo plus optional `occasionSlug`, `location`, and `weatherData`. The review is saved in `outfit_photo_reviews` and can be listed, fetched, or deleted:

- `GET /api/vision/reviews`
- `GET /api/vision/reviews/:id`
- `DELETE /api/vision/reviews/:id`

Deleting a review also deletes the Cloudinary image. Users can only access their own reviews.

**Wardrobe Scan**

- `POST /api/wardrobe/:id/rescan` reanalyzes an existing wardrobe image and updates metadata.
- `POST /api/wardrobe/bulk-scan` accepts multiple images, analyzes them, creates wardrobe items, and saves scan jobs.
- `GET /api/wardrobe/scan-jobs`
- `GET /api/wardrobe/scan-jobs/:id`

Bulk scan is Premium-gated in this implementation. Scan jobs are owner-scoped.

**Weather Styling**

- `GET /api/weather/current?location=Lagos`
- `POST /api/weather/style-advice`

Example JSON body:

```json
{
  "location": "Lagos",
  "occasionSlug": "dinner",
  "preferences": {
    "mood": "polished but comfortable"
  }
}
```

Weather-aware outfit generation is also supported by `POST /api/outfits/generate`:

```json
{
  "occasionSlug": "office",
  "mood": "confident",
  "location": "Lagos",
  "useWeather": true,
  "includeAlternatives": true
}
```

Weather-aware generation is Pro/Premium-gated.

**Wardrobe Health**

- `POST /api/wardrobe-health/analyze`
- `GET /api/wardrobe-health/latest`
- `GET /api/wardrobe-health/reports`
- `GET /api/wardrobe-health/reports/:id`

Wardrobe health analyzes category balance, color balance, style balance, repeated categories, missing essentials, missing occasion items, climate readiness, professional readiness, casual readiness, event readiness, and practical missing-piece recommendations. It does not recommend stores or products.

**Phase 3 Subscription Rules**

- Free: limited outfit photo reviews, limited wardrobe scans, basic weather styling.
- Pro: higher review/scan limits, weather-aware outfit generation, wardrobe health reports.
- Premium: highest limits, bulk wardrobe scan, advanced outfit critique, advanced wardrobe health analysis.

**Privacy And Image Security**

- OpenAI, Cloudinary, and weather API keys are never exposed to clients.
- All image uploads go through the backend.
- Image file signatures are validated with `file-type`; MIME headers alone are not trusted.
- Images are optimized with Sharp before Cloudinary upload.
- Users can only access their own reviews, scan jobs, and reports.
- Deleting outfit reviews removes the related Cloudinary image.
- The AI context builder avoids password hashes, verification tokens, reset data, and private payment data.

**Admin Vision Analytics**

`GET /api/admin/analytics/vision` returns total outfit reviews, total wardrobe scans, total wardrobe health reports, average outfit review score, common improvement suggestions, common missing wardrobe essentials, and vision usage by subscription plan.

**Phase 4: Personal Fashion Memory, Outfit History, Events, And Feedback**

Phase 4 makes the stylist remember user behavior over time. The backend now tracks what users wear, what they like or dislike, upcoming events, selected event outfits, and AI-learned style memories. Outfit generation can use this memory to personalize recommendations and reduce repetition.

New tables:

- `outfit_wear_history`
- `user_fashion_events`
- `outfit_feedback`
- `user_style_memory`
- `outfit_recommendation_logs`

Run the schema again:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

**Fashion Memory**

Routes:

- `GET /api/fashion-memory`
- `POST /api/fashion-memory`
- `PATCH /api/fashion-memory/:id`
- `DELETE /api/fashion-memory/:id`
- `POST /api/fashion-memory/rebuild`
- `GET /api/fashion-memory/insights`

Fashion memory can be manually created or rebuilt from saved outfits, outfit feedback, wear history, wardrobe favorites, style profile, and outfit photo reviews. The insights endpoint returns favorite colors, favorite categories, most worn items, least worn items, repeated items, preferred aesthetics, disliked styles, wardrobe gaps, and a style personality summary.

Example memory entry:

```json
{
  "memory_type": "liked_style",
  "memory_key": "minimalist neutrals",
  "memory_value": {
    "notes": "User repeatedly saves clean neutral looks."
  },
  "confidence_score": 0.8,
  "source": "manual"
}
```

**Outfit History**

Routes:

- `POST /api/outfit-history/worn`
- `GET /api/outfit-history`
- `GET /api/outfit-history/recent`
- `GET /api/outfit-history/calendar`
- `DELETE /api/outfit-history/:id`

Marking an outfit or wardrobe items as worn updates `wardrobe_items.times_worn` and `wardrobe_items.last_worn_at`.

Example:

```json
{
  "outfit_id": "00000000-0000-0000-0000-000000000000",
  "worn_date": "2026-06-04",
  "occasion_slug": "office",
  "user_rating": 5,
  "notes": "Felt polished and comfortable."
}
```

**Style Feedback**

Routes:

- `POST /api/style-feedback/outfit/:outfitId`
- `GET /api/style-feedback/outfit/:outfitId`
- `GET /api/style-feedback/me`

Feedback stores ratings, liked parts, disliked parts, notes, and whether the user would wear the outfit again. The backend updates fashion memory from feedback and can ask the AI to learn higher-level preferences.

Example:

```json
{
  "rating": 4,
  "liked_parts": ["black blazer", "clean color palette"],
  "disliked_parts": ["shoes felt too casual"],
  "feedback_note": "Good for work, but not for client meetings.",
  "would_wear_again": true
}
```

**Event Styling**

Routes:

- `POST /api/events`
- `GET /api/events`
- `GET /api/events/upcoming`
- `GET /api/events/:id`
- `PATCH /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/events/:id/generate-outfit`
- `POST /api/events/:id/select-outfit`
- `POST /api/events/:id/send-reminder`

Event styling uses occasion, date, location, dress code, notes, weather, wardrobe, fashion memory, and recent wear history. The reminder endpoint sends a manual Resend email with event details, selected outfit summary, and a final checklist. There are no background scheduled jobs yet.

Example event:

```json
{
  "title": "Client dinner",
  "occasion_slug": "dinner",
  "event_date": "2026-06-20T18:30:00.000Z",
  "location": "Lagos",
  "dress_code": "smart casual",
  "notes": "Polished but not too formal",
  "reminder_enabled": true
}
```

**Repetition Prevention**

`POST /api/outfits/generate` now accepts:

- `allowRecentlyWorn`
- `avoidItemsWornWithinDays`
- `eventId`
- `useFashionMemory`

Example:

```json
{
  "occasionSlug": "corporate-meeting",
  "mood": "confident",
  "useFashionMemory": true,
  "allowRecentlyWorn": false,
  "avoidItemsWornWithinDays": 14,
  "includeAlternatives": true
}
```

The backend fetches recent wear history, sends repetition context to the AI, filters recently worn items unless allowed, returns recently worn warnings, and saves an `outfit_recommendation_logs` record.

**Phase 4 Subscription Rules**

- Free: basic outfit history, limited fashion memory, limited event count.
- Pro: full outfit history, event styling, repetition prevention, style insights.
- Premium: advanced fashion memory, smart event preparation, deeper preference learning, and stronger wardrobe intelligence.

**Admin Fashion Memory Analytics**

`GET /api/admin/analytics/fashion-memory` returns total wear history logs, total fashion events, total feedback records, common occasions, liked aesthetics, disliked categories, average outfit rating, and event styling usage by subscription plan.

**Phase 5: Community, Style Boards, Creator Profiles, And Discovery**

Phase 5 adds an AI-powered fashion inspiration ecosystem. It is focused on discovery and inspiration, not a full social network. There are no direct messages, stories, reels, video uploads, live streaming, or creator monetization.

New tables:

- `creator_profiles`
- `community_posts`
- `community_post_likes`
- `community_post_saves`
- `community_comments`
- `creator_followers`
- `style_boards`
- `style_board_items`
- `community_reports`
- `discovery_events`

Run the schema again:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

**Creator Profiles**

Routes:

- `POST /api/creators/profile`
- `GET /api/creators/profile/me`
- `GET /api/creators/:id`
- `PATCH /api/creators/profile`
- `DELETE /api/creators/profile`
- `POST /api/creators/:id/follow`
- `DELETE /api/creators/:id/follow`
- `GET /api/creators/:id/followers`
- `GET /api/creators/:id/posts`

Example:

```json
{
  "display_name": "Fashionista",
  "bio": "Clean corporate and afro-modern outfit ideas.",
  "creator_type": "creator",
  "instagram_handle": "fashionista"
}
```

**Community Feed**

Routes:

- `POST /api/community/posts`
- `GET /api/community/posts`
- `GET /api/community/posts/:id`
- `PATCH /api/community/posts/:id`
- `DELETE /api/community/posts/:id`
- `POST /api/community/share-outfit/:outfitId`
- `POST /api/community/posts/:id/like`
- `DELETE /api/community/posts/:id/like`
- `POST /api/community/posts/:id/save`
- `DELETE /api/community/posts/:id/save`
- `POST /api/community/posts/:id/comments`
- `GET /api/community/posts/:id/comments`
- `DELETE /api/community/comments/:id`
- `POST /api/community/posts/:id/report`

Posts can come from AI generated outfits, wardrobe outfits, outfit photo reviews, or custom inspiration posts.

Example:

```json
{
  "title": "Office neutrals",
  "description": "Simple blazer outfit for a focused workday.",
  "source_type": "ai_generated_outfit",
  "source_id": "00000000-0000-0000-0000-000000000000",
  "occasion_slug": "office",
  "aesthetic_slug": "minimalist",
  "tags": ["office", "neutral", "blazer"],
  "visibility": "public"
}
```

**Style Boards**

Routes:

- `POST /api/style-boards`
- `GET /api/style-boards`
- `GET /api/style-boards/:id`
- `PATCH /api/style-boards/:id`
- `DELETE /api/style-boards/:id`
- `POST /api/style-boards/:id/items`
- `DELETE /api/style-boards/:id/items/:itemId`

Boards can be private or public, such as Wedding Looks, Office Style, Church Fits, Old Money, Date Night, or Vacation Fits.

**AI Discovery Engine**

Routes:

- `GET /api/discovery/feed`
- `GET /api/discovery/trending`
- `GET /api/discovery/aesthetics/:slug`
- `GET /api/discovery/occasions/:slug`
- `GET /api/discovery/for-you`

The For You feed is personalized, not chronological. It ranks posts using style profile, fashion memory, saved posts, liked posts, wardrobe interests, followed creators, engagement, aesthetics, and occasions.

**Moderation Flow**

Users can report posts. Admin moderation routes:

- `GET /api/admin/community/posts`
- `GET /api/admin/community/reports`
- `PATCH /api/admin/community/reports/:id`
- `DELETE /api/admin/community/posts/:id`

Admin moderation actions are audit logged.

**Phase 5 Subscription Features**

- Free: limited boards and basic discovery.
- Pro: more boards, advanced discovery, creator profile customization.
- Premium: highest board limits, advanced AI discovery ranking, featured creator profile options.

**Admin Community Analytics**

`GET /api/admin/analytics/community` returns total posts, likes, saves, comments, creators, top aesthetics, top occasions, most followed creators, most saved posts, and discovery engagement events.

**Version 1.1: Cultural Fashion Context Layer**

Version 1.1 adds a structured cultural fashion knowledge base. This is not model training or fine-tuning: the backend stores cultural profiles, occasion rules, outfit components, and user preferences in PostgreSQL, then injects the relevant context into OpenAI prompts at request time.

New tables:

- `cultural_fashion_profiles`
- `cultural_occasion_rules`
- `cultural_outfit_components`
- `user_cultural_preferences`

The schema seeds Nigerian cultural fashion profiles for Yoruba, Igbo, Hausa/Fulani, Tiv, Igala, Edo, Efik/Ibibio, Nupe, and Kanuri, including signature outfits, fabrics, accessories, colors, notes, and mistakes to avoid.

Run the schema again:

```bash
psql "$DATABASE_URL" -f src/database/schema.sql
```

**Cultural Fashion APIs**

Public/profile routes:

- `GET /api/cultural-fashion/profiles`
- `GET /api/cultural-fashion/profiles/:slug`
- `GET /api/cultural-fashion/profiles/:slug/occasion-rules`
- `GET /api/cultural-fashion/search?country=Nigeria&ethnicGroup=Igbo`

Preference routes:

- `POST /api/cultural-fashion/preferences`
- `GET /api/cultural-fashion/preferences`
- `PATCH /api/cultural-fashion/preferences`

AI styling route:

- `POST /api/cultural-fashion/style`

Example:

```json
{
  "cultureSlug": "igbo",
  "occasionSlug": "traditional-wedding",
  "genderPreference": "male",
  "mood": "premium",
  "useWardrobe": true
}
```

The response includes cultural context, recommended look, matching wardrobe item IDs, missing pieces, accessories, colors, mistakes to avoid, modern styling tips, and why the look works.

`POST /api/outfits/generate` also supports cultural styling:

```json
{
  "occasionSlug": "wedding",
  "cultureSlug": "yoruba",
  "culturalOccasion": true,
  "gender_style_preference": "female",
  "mood": "elegant"
}
```

**Admin Cultural Fashion Management**

Admin CRUD routes:

- `GET /api/admin/cultural-fashion/profiles`
- `POST /api/admin/cultural-fashion/profiles`
- `GET /api/admin/cultural-fashion/profiles/:id`
- `PATCH /api/admin/cultural-fashion/profiles/:id`
- `DELETE /api/admin/cultural-fashion/profiles/:id`
- `GET /api/admin/cultural-fashion/occasion-rules`
- `POST /api/admin/cultural-fashion/occasion-rules`
- `PATCH /api/admin/cultural-fashion/occasion-rules/:id`
- `DELETE /api/admin/cultural-fashion/occasion-rules/:id`
- `GET /api/admin/cultural-fashion/components`
- `POST /api/admin/cultural-fashion/components`
- `PATCH /api/admin/cultural-fashion/components/:id`
- `DELETE /api/admin/cultural-fashion/components/:id`

All admin cultural fashion mutations write `admin_audit_logs` records. Admins can correct cultural knowledge without code changes.

**Cultural AI Context**

`buildCulturalFashionContext()` fetches:

- cultural profile
- cultural occasion rules
- cultural outfit components
- the current user's optional cultural preferences
- the user's wardrobe items when `useWardrobe` is true

OpenAI receives only style-relevant context. It does not receive password hashes, verification data, reset data, private payment data, or another user's preferences.

**Cultural Settings**

Seeded settings:

- `cultural_fashion_enabled`
- `cultural_fashion_public_profiles_enabled`
- `cultural_fashion_ai_styling_enabled`

These settings let admins enable or disable public cultural profiles and AI cultural styling without redeploying.

**Cultural Preference Privacy**

Cultural preference is optional. Users are never forced to select ethnicity or traditional attire preferences. Users can update their preferences, and the backend only exposes a user's cultural preferences to that authenticated user.
