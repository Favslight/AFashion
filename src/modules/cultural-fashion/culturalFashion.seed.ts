import { query } from "../../database/db.js";

export async function seedCulturalFashionSettings() {
  await query(
    `INSERT INTO site_settings (setting_key, setting_value, description, is_public)
     VALUES
       ('cultural_fashion_enabled', 'true'::jsonb, 'Enable cultural fashion knowledge and user preferences.', TRUE),
       ('cultural_fashion_public_profiles_enabled', 'true'::jsonb, 'Expose active cultural fashion profiles publicly.', TRUE),
       ('cultural_fashion_ai_styling_enabled', 'true'::jsonb, 'Enable AI styling with cultural fashion context.', FALSE)
     ON CONFLICT (setting_key) DO UPDATE SET
       setting_value = EXCLUDED.setting_value,
       description = EXCLUDED.description,
       is_public = EXCLUDED.is_public`
  );
}

export async function seedCulturalFashionKnowledge() {
  await seedCulturalFashionSettings();
}
