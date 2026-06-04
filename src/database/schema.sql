CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  suspension_reason TEXT
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super_admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check CHECK (account_status IN ('active', 'suspended', 'deactivated'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gender_preference TEXT,
  body_type TEXT,
  budget_range TEXT,
  climate_location TEXT,
  fashion_goals TEXT[] NOT NULL DEFAULT '{}',
  favorite_aesthetics TEXT[] NOT NULL DEFAULT '{}',
  favorite_colors TEXT[] NOT NULL DEFAULT '{}',
  preferred_categories TEXT[] NOT NULL DEFAULT '{}',
  fashion_inspirations TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_wardrobe_items INTEGER NOT NULL,
  max_ai_generations_per_month INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  gender_fit TEXT,
  color TEXT,
  secondary_colors TEXT[] NOT NULL DEFAULT '{}',
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  material TEXT,
  season_tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  image_public_id TEXT NOT NULL,
  background_removed_url TEXT,
  ai_description TEXT,
  ai_confidence NUMERIC(4, 3),
  times_worn INTEGER NOT NULL DEFAULT 0,
  last_worn_at TIMESTAMPTZ,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS outfit_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  formality_level INTEGER NOT NULL CHECK (formality_level BETWEEN 1 AND 5),
  gender_support TEXT[] NOT NULL DEFAULT '{}',
  recommended_categories TEXT[] NOT NULL DEFAULT '{}',
  avoid_categories TEXT[] NOT NULL DEFAULT '{}',
  style_tone TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occasion_id UUID REFERENCES outfit_occasions(id),
  title TEXT NOT NULL,
  mood TEXT,
  weather_context TEXT,
  ai_summary TEXT,
  why_this_works TEXT,
  color_harmony_score NUMERIC(4, 2),
  formality_score NUMERIC(4, 2),
  comfort_score NUMERIC(4, 2),
  image_preview_url TEXT,
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  wardrobe_item_id UUID NOT NULL REFERENCES wardrobe_items(id) ON DELETE CASCADE,
  item_role TEXT NOT NULL DEFAULT 'selected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (outfit_id, wardrobe_item_id)
);

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Stylist chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  source TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_suspended_by_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_suspended_by_admin_users_fkey;
ALTER TABLE users ADD CONSTRAINT users_suspended_by_admin_users_fkey
  FOREIGN KEY (suspended_by) REFERENCES admin_users(id);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_admin_user_id_fkey;
ALTER TABLE admin_audit_logs ADD CONSTRAINT admin_audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) NOT VALID;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_suspended_by_fkey;
ALTER TABLE users ADD CONSTRAINT users_suspended_by_fkey FOREIGN KEY (suspended_by) REFERENCES admin_users(id) NOT VALID;

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  version TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_updated_by_fkey;
ALTER TABLE site_settings ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES admin_users(id) NOT VALID;

ALTER TABLE content_policies DROP CONSTRAINT IF EXISTS content_policies_created_by_fkey;
ALTER TABLE content_policies ADD CONSTRAINT content_policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES admin_users(id) NOT VALID;
ALTER TABLE content_policies DROP CONSTRAINT IF EXISTS content_policies_updated_by_fkey;
ALTER TABLE content_policies ADD CONSTRAINT content_policies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES admin_users(id) NOT VALID;

ALTER TABLE moderation_reports DROP CONSTRAINT IF EXISTS moderation_reports_reviewed_by_fkey;
ALTER TABLE moderation_reports ADD CONSTRAINT moderation_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) NOT VALID;

ALTER TABLE blocked_keywords DROP CONSTRAINT IF EXISTS blocked_keywords_created_by_fkey;
ALTER TABLE blocked_keywords ADD CONSTRAINT blocked_keywords_created_by_fkey FOREIGN KEY (created_by) REFERENCES admin_users(id) NOT VALID;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  target_role TEXT CHECK (target_role IN ('admin', 'super_admin')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_admin_filters ON users (role, account_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_active ON wardrobe_items (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_outfits_user_created ON outfits (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON ai_chat_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON ai_chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs (admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_settings_public ON site_settings (is_public, setting_key);
CREATE INDEX IF NOT EXISTS idx_content_policies_type_status ON content_policies (policy_type, status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_keywords_active ON blocked_keywords (is_active, category);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_style_profiles_updated_at ON user_style_profiles;
CREATE TRIGGER trg_user_style_profiles_updated_at
BEFORE UPDATE ON user_style_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_wardrobe_items_updated_at ON wardrobe_items;
CREATE TRIGGER trg_wardrobe_items_updated_at
BEFORE UPDATE ON wardrobe_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ai_chat_sessions_updated_at ON ai_chat_sessions;
CREATE TRIGGER trg_ai_chat_sessions_updated_at
BEFORE UPDATE ON ai_chat_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_content_policies_updated_at ON content_policies;
CREATE TRIGGER trg_content_policies_updated_at
BEFORE UPDATE ON content_policies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_blocked_keywords_updated_at ON blocked_keywords;
CREATE TRIGGER trg_blocked_keywords_updated_at
BEFORE UPDATE ON blocked_keywords
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO subscription_plans (
  name,
  price_monthly,
  price_yearly,
  max_wardrobe_items,
  max_ai_generations_per_month,
  features
) VALUES
  (
    'Free',
    0,
    0,
    30,
    20,
    '{"wardrobe_uploads": true, "basic_ai_outfits": true, "style_chat": true}'::jsonb
  ),
  (
    'Pro',
    19.99,
    199.00,
    250,
    300,
    '{"advanced_recommendations": true, "event_styling": true, "priority_ai": true, "expanded_wardrobe": true}'::jsonb
  ),
  (
    'Premium',
    39.99,
    399.00,
    1000,
    1200,
    '{"event_styling": true, "wardrobe_analytics": true, "celebrity_inspired_looks": true, "premium_support": true}'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_wardrobe_items = EXCLUDED.max_wardrobe_items,
  max_ai_generations_per_month = EXCLUDED.max_ai_generations_per_month,
  features = EXCLUDED.features;

INSERT INTO admin_users (full_name, email, password_hash, role, status)
VALUES (
  'Fashionista',
  'admin@fashionista.com',
  '$2a$12$x/TQa//2K3fdSHM8DEXCIeAoyTPQzvY2nxp.CAJuJjISDkl4tUgre',
  'super_admin',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

INSERT INTO admin_users (full_name, email, password_hash, role, status)
VALUES (
  'Fashionio',
  'admin@fashionio.com',
  '$2a$12$PXNNVAeTYNaYu.U/c70Gb.FyNMt8z.BkcRMzDPCGqlItk6aMrOEtu',
  'admin',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

INSERT INTO site_settings (
  setting_key,
  setting_value,
  description,
  is_public
) VALUES
  ('app_name', '"What Should I Wear?"'::jsonb, 'Public application name.', TRUE),
  ('maintenance_mode', 'false'::jsonb, 'Temporarily disable product access during maintenance.', TRUE),
  ('allow_new_signups', 'true'::jsonb, 'Allow new users to create accounts.', TRUE),
  ('free_plan_limits', '{"max_wardrobe_items": 30, "max_ai_generations_per_month": 20}'::jsonb, 'Limits for the free plan.', FALSE),
  ('ai_generation_limits', '{"free": 20, "pro": 300, "premium": 1200}'::jsonb, 'AI generation limits by plan.', FALSE),
  ('upload_limits', '{"max_file_size_mb": 6}'::jsonb, 'Image upload limits.', TRUE),
  ('supported_image_types', '["jpg", "jpeg", "png", "webp"]'::jsonb, 'Supported image upload types.', TRUE),
  ('default_currency', '"USD"'::jsonb, 'Default billing currency.', TRUE),
  ('subscription_enabled', 'true'::jsonb, 'Enable paid subscription features.', TRUE),
  ('community_enabled', 'false'::jsonb, 'Enable future community features.', TRUE),
  ('realtime_ai_enabled', 'false'::jsonb, 'Enable realtime camera AI styling.', TRUE),
  ('outfit_photo_analysis_enabled', 'true'::jsonb, 'Enable outfit photo analysis.', TRUE),
  ('email_notifications_enabled', 'true'::jsonb, 'Enable transactional and notification emails.', FALSE),
  ('terms_version', '"1.0"'::jsonb, 'Current terms of service version.', TRUE),
  ('privacy_policy_version', '"1.0"'::jsonb, 'Current privacy policy version.', TRUE),
  ('forbidden_styling_categories', '["sexualized minors", "extremist symbolism", "self-harm glorification"]'::jsonb, 'AI styling categories that must be refused.', FALSE),
  ('sensitive_content_rules', '{"minimize_body_judgment": true, "avoid_protected_class_stereotypes": true, "medical_claims": "disallow"}'::jsonb, 'AI safety and sensitive content rules.', FALSE),
  ('minimum_user_age', '13'::jsonb, 'Minimum age to use the application.', TRUE),
  ('celebrity_inspired_looks_enabled', 'false'::jsonb, 'Enable celebrity-inspired outfit recommendations.', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO outfit_occasions (
  name,
  slug,
  formality_level,
  gender_support,
  recommended_categories,
  avoid_categories,
  style_tone
) VALUES
  ('Wedding', 'wedding', 5, ARRAY['all'], ARRAY['dress', 'suit', 'heels', 'loafers', 'accessories'], ARRAY['gymwear', 'flip flops'], ARRAY['elegant', 'polished', 'celebratory']),
  ('Church Service', 'church-service', 4, ARRAY['all'], ARRAY['dress', 'shirt', 'skirt', 'trousers', 'blazer'], ARRAY['revealing tops', 'gymwear'], ARRAY['modest', 'refined', 'comfortable']),
  ('Office', 'office', 4, ARRAY['all'], ARRAY['shirt', 'blouse', 'trousers', 'skirt', 'blazer'], ARRAY['beachwear', 'gymwear'], ARRAY['professional', 'clean', 'practical']),
  ('Corporate Meeting', 'corporate-meeting', 5, ARRAY['all'], ARRAY['suit', 'blazer', 'shirt', 'dress shoes'], ARRAY['denim shorts', 'slides'], ARRAY['formal', 'authoritative', 'minimal']),
  ('Casual Visit', 'casual-visit', 2, ARRAY['all'], ARRAY['jeans', 't-shirt', 'sneakers', 'casual dress'], ARRAY['overly formal suits'], ARRAY['relaxed', 'friendly', 'easy']),
  ('Dinner', 'dinner', 4, ARRAY['all'], ARRAY['dress', 'shirt', 'trousers', 'heels', 'loafers'], ARRAY['gymwear'], ARRAY['polished', 'evening', 'warm']),
  ('Date Night', 'date-night', 4, ARRAY['all'], ARRAY['dress', 'shirt', 'jeans', 'heels', 'boots'], ARRAY['work uniform'], ARRAY['confident', 'intentional', 'soft']),
  ('Interview', 'interview', 5, ARRAY['all'], ARRAY['blazer', 'shirt', 'trousers', 'skirt', 'dress shoes'], ARRAY['loud casualwear'], ARRAY['credible', 'focused', 'neat']),
  ('Birthday Party', 'birthday-party', 3, ARRAY['all'], ARRAY['statement top', 'dress', 'jeans', 'sneakers', 'accessories'], ARRAY['strict workwear'], ARRAY['fun', 'expressive', 'comfortable']),
  ('Travel', 'travel', 2, ARRAY['all'], ARRAY['layers', 'sneakers', 'joggers', 't-shirt', 'jacket'], ARRAY['uncomfortable heels'], ARRAY['mobile', 'practical', 'layered']),
  ('Rainy Weather', 'rainy-weather', 2, ARRAY['all'], ARRAY['jacket', 'boots', 'dark denim', 'hoodie'], ARRAY['suede shoes', 'long dragging hems'], ARRAY['weather-ready', 'layered', 'durable']),
  ('Hot Weather', 'hot-weather', 1, ARRAY['all'], ARRAY['linen', 'cotton', 'shorts', 'dress', 'sandals'], ARRAY['heavy knits'], ARRAY['breathable', 'light', 'fresh']),
  ('School/Campus', 'school-campus', 2, ARRAY['all'], ARRAY['jeans', 't-shirt', 'sneakers', 'hoodie', 'backpack'], ARRAY['black tie'], ARRAY['casual', 'functional', 'youthful']),
  ('Traditional Event', 'traditional-event', 5, ARRAY['all'], ARRAY['traditional wear', 'native attire', 'accessories', 'dress shoes'], ARRAY['gymwear'], ARRAY['cultural', 'respectful', 'statement']),
  ('Gym/Fitness', 'gym-fitness', 1, ARRAY['all'], ARRAY['activewear', 'trainers', 'sports bra', 'joggers'], ARRAY['formal shoes', 'heavy jewelry'], ARRAY['sporty', 'breathable', 'flexible'])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  formality_level = EXCLUDED.formality_level,
  gender_support = EXCLUDED.gender_support,
  recommended_categories = EXCLUDED.recommended_categories,
  avoid_categories = EXCLUDED.avoid_categories,
  style_tone = EXCLUDED.style_tone;

CREATE TABLE IF NOT EXISTS color_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color TEXT NOT NULL,
  matching_color TEXT NOT NULL,
  harmony_type TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS style_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  gender_support TEXT[] NOT NULL DEFAULT ARRAY['male','female','unisex'],
  rule_text TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS occasion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_slug TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  recommended_categories TEXT[] NOT NULL DEFAULT '{}',
  avoid_categories TEXT[] NOT NULL DEFAULT '{}',
  recommended_colors TEXT[] NOT NULL DEFAULT '{}',
  avoid_colors TEXT[] NOT NULL DEFAULT '{}',
  formality_level TEXT,
  gender_support TEXT[] NOT NULL DEFAULT ARRAY['male','female','unisex'],
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS body_type_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body_type TEXT NOT NULL,
  gender_support TEXT[] NOT NULL DEFAULT ARRAY['male','female','unisex'],
  recommended_fits TEXT[] NOT NULL DEFAULT '{}',
  avoid_fits TEXT[] NOT NULL DEFAULT '{}',
  styling_tips TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS climate_style_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  climate_type TEXT NOT NULL,
  recommended_fabrics TEXT[] NOT NULL DEFAULT '{}',
  avoid_fabrics TEXT[] NOT NULL DEFAULT '{}',
  recommended_categories TEXT[] NOT NULL DEFAULT '{}',
  styling_tips TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fashion_aesthetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  recommended_colors TEXT[] NOT NULL DEFAULT '{}',
  common_categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  color_harmony_score NUMERIC,
  occasion_fit_score NUMERIC,
  formality_score NUMERIC,
  comfort_score NUMERIC,
  wardrobe_match_score NUMERIC,
  overall_score NUMERIC,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_color_combinations_unique ON color_combinations (LOWER(primary_color), LOWER(matching_color), COALESCE(LOWER(harmony_type), ''));
CREATE UNIQUE INDEX IF NOT EXISTS idx_style_rules_unique_seed ON style_rules (LOWER(title), LOWER(category));
CREATE UNIQUE INDEX IF NOT EXISTS idx_occasion_rules_unique_seed ON occasion_rules (occasion_slug, rule_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_body_type_rules_unique_seed ON body_type_rules (LOWER(body_type));
CREATE UNIQUE INDEX IF NOT EXISTS idx_climate_style_rules_unique_seed ON climate_style_rules (LOWER(climate_type));
CREATE INDEX IF NOT EXISTS idx_style_rules_category_active ON style_rules (category, is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_occasion_rules_slug_active ON occasion_rules (occasion_slug, is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_body_type_rules_body_type ON body_type_rules (body_type);
CREATE INDEX IF NOT EXISTS idx_climate_style_rules_type ON climate_style_rules (climate_type);
CREATE INDEX IF NOT EXISTS idx_outfit_scores_outfit ON outfit_scores (outfit_id);

DROP TRIGGER IF EXISTS trg_style_rules_updated_at ON style_rules;
CREATE TRIGGER trg_style_rules_updated_at
BEFORE UPDATE ON style_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_occasion_rules_updated_at ON occasion_rules;
CREATE TRIGGER trg_occasion_rules_updated_at
BEFORE UPDATE ON occasion_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO color_combinations (primary_color, matching_color, harmony_type, score, description) VALUES
  ('black', 'white', 'classic contrast', 9.8, 'Sharp, timeless contrast for formal and casual looks.'),
  ('black', 'gold', 'luxury accent', 9.2, 'Elevates black with warmth and evening polish.'),
  ('black', 'camel', 'neutral harmony', 8.8, 'Softens black while keeping a refined finish.'),
  ('navy', 'white', 'classic contrast', 9.4, 'Clean and reliable for office, church, and smart casual outfits.'),
  ('navy', 'burgundy', 'rich complementary', 8.9, 'Elegant depth for dinners and corporate settings.'),
  ('brown', 'cream', 'warm neutral', 9.0, 'Relaxed, expensive-looking neutral pairing.'),
  ('beige', 'olive', 'earth harmony', 8.6, 'Natural, grounded pairing for casual and travel looks.'),
  ('green', 'white', 'fresh contrast', 8.2, 'Crisp and breathable for warm weather styling.'),
  ('red', 'black', 'statement contrast', 8.4, 'Bold, confident pairing best balanced with simple silhouettes.'),
  ('pink', 'grey', 'soft balance', 8.1, 'Romantic color softened by a calm neutral.'),
  ('blue', 'tan', 'warm-cool balance', 8.7, 'Approachable pairing for casual and smart casual looks.'),
  ('denim blue', 'white', 'casual classic', 9.0, 'Fresh, easy match for everyday styling.'),
  ('grey', 'black', 'monochrome depth', 8.7, 'Simple tonal pairing with urban polish.'),
  ('purple', 'silver', 'cool accent', 7.8, 'Works best for evening or expressive styling.'),
  ('orange', 'navy', 'complementary', 7.9, 'High-energy pairing that needs restraint.'),
  ('cream', 'gold', 'soft luxury', 8.8, 'Warm, refined combination for weddings and traditional events.')
ON CONFLICT DO NOTHING;

INSERT INTO style_rules (title, category, gender_support, rule_text, priority) VALUES
  ('Male fit balance', 'fit', ARRAY['male','unisex'], 'Keep shoulder seams clean, trousers proportionate, and avoid combining oversized tops with overly baggy bottoms unless the aesthetic is intentional.', 5),
  ('Male smart casual anchor', 'occasion', ARRAY['male','unisex'], 'For smart casual events, anchor the outfit with one structured piece such as a blazer, overshirt, pressed trousers, or polished shoe.', 4),
  ('Female proportion balance', 'fit', ARRAY['female','unisex'], 'Balance fitted and fluid pieces so the eye has a clear silhouette; use waist definition, length contrast, or structured layers when needed.', 5),
  ('Female occasion polish', 'occasion', ARRAY['female','unisex'], 'For formal occasions, prioritize clean hemlines, intentional accessories, and shoes that match the outfit formality.', 4),
  ('Unisex color restraint', 'color', ARRAY['male','female','unisex'], 'Use one dominant color, one supporting neutral, and one accent when building polished outfits.', 5),
  ('Unisex comfort rule', 'comfort', ARRAY['male','female','unisex'], 'An outfit scores higher when fabrics, shoes, and layers fit the weather, movement needs, and event duration.', 5),
  ('Modesty and culture awareness', 'cultural', ARRAY['male','female','unisex'], 'For religious, traditional, or family events, lean toward respectful coverage, neat grooming, and culturally appropriate colors or textiles.', 5),
  ('Accessory hierarchy', 'accessories', ARRAY['male','female','unisex'], 'Accessories should support the outfit mood; avoid multiple loud focal points competing at once.', 3)
ON CONFLICT DO NOTHING;

INSERT INTO occasion_rules (occasion_slug, rule_type, rule_text, recommended_categories, avoid_categories, recommended_colors, avoid_colors, formality_level, priority) VALUES
  ('wedding', 'dress_code', 'Choose celebratory polish without upstaging the couple. Avoid overly casual footwear and loud white-dominant looks unless culturally expected.', ARRAY['dress','suit','blazer','heels','loafers','accessories','traditional wear'], ARRAY['gymwear','slides','distressed denim'], ARRAY['navy','emerald','burgundy','cream','gold','pastel'], ARRAY['all white','neon'], 'formal', 5),
  ('church-service', 'modesty', 'Prioritize respectful coverage, neat layers, and comfortable shoes for standing or walking.', ARRAY['dress','shirt','skirt','trousers','blazer','loafers'], ARRAY['revealing tops','short shorts','gymwear'], ARRAY['navy','white','cream','brown','soft pink'], ARRAY['neon'], 'smart', 5),
  ('office', 'professional', 'Use clean, repeatable pieces that look polished through a full workday.', ARRAY['shirt','blouse','trousers','skirt','blazer','loafers'], ARRAY['beachwear','gymwear','slides'], ARRAY['navy','grey','white','black','camel'], ARRAY['neon'], 'business casual', 4),
  ('corporate-meeting', 'authority', 'Prioritize structure, minimal distractions, polished shoes, and strong neutral color combinations.', ARRAY['suit','blazer','shirt','trousers','dress shoes'], ARRAY['ripped denim','loud graphics','slides'], ARRAY['navy','black','white','grey','burgundy'], ARRAY['neon','muddy mixed prints'], 'formal', 5),
  ('casual-visit', 'comfort', 'Look relaxed but intentional; choose breathable pieces and one detail that makes the outfit feel styled.', ARRAY['jeans','t-shirt','casual dress','sneakers','overshirt'], ARRAY['black tie','heavy formalwear'], ARRAY['denim blue','white','olive','beige'], ARRAY[]::text[], 'casual', 3),
  ('dinner', 'evening', 'Aim for elevated comfort, richer colors, and a small accessory or shoe upgrade.', ARRAY['dress','shirt','trousers','dark denim','heels','loafers'], ARRAY['gymwear','flip flops'], ARRAY['black','burgundy','navy','cream','gold'], ARRAY['washed out activewear'], 'smart', 4),
  ('date-night', 'confidence', 'Choose one memorable focal point while keeping fit, fragrance, shoes, and grooming intentional.', ARRAY['dress','shirt','dark denim','boots','heels','jewelry'], ARRAY['work uniform','gymwear'], ARRAY['black','red','cream','navy','soft pink'], ARRAY[]::text[], 'smart', 4),
  ('interview', 'credibility', 'Look credible before expressive. Choose tidy lines, restrained colors, and comfortable shoes.', ARRAY['blazer','shirt','trousers','skirt','closed toe shoes'], ARRAY['loud graphics','short shorts','slides'], ARRAY['navy','white','grey','black','camel'], ARRAY['neon'], 'formal', 5),
  ('traditional-event', 'cultural', 'Respect cultural expectations with intentional textiles, accessories, and neat finishing.', ARRAY['traditional wear','native attire','headwear','dress shoes','accessories'], ARRAY['gymwear','slides'], ARRAY['gold','cream','emerald','burgundy','royal blue'], ARRAY[]::text[], 'formal', 5),
  ('gym-fitness', 'performance', 'Prioritize movement, breathable fabrics, supportive shoes, and sweat-friendly layers.', ARRAY['activewear','trainers','joggers','sports bra','shorts'], ARRAY['formal shoes','heavy jewelry','stiff denim'], ARRAY['black','grey','white','blue'], ARRAY[]::text[], 'active', 5),
  ('travel', 'mobility', 'Choose wrinkle-resistant layers, comfortable shoes, and pockets or bags that support movement.', ARRAY['layers','sneakers','joggers','t-shirt','jacket','crossbody bag'], ARRAY['uncomfortable heels','stiff formalwear'], ARRAY['black','grey','olive','navy','beige'], ARRAY[]::text[], 'casual', 4),
  ('hot-weather', 'breathability', 'Prefer lightweight fabrics, open weaves, light colors, and minimal layering.', ARRAY['linen','cotton','shorts','dress','sandals','t-shirt'], ARRAY['heavy knits','leather layers'], ARRAY['white','cream','pastel','tan'], ARRAY['all black heavy fabrics'], 'casual', 4),
  ('rainy-weather', 'protection', 'Use water-tolerant shoes, darker hems, and layers that dry reasonably fast.', ARRAY['jacket','boots','dark denim','hoodie','umbrella'], ARRAY['suede shoes','long dragging hems'], ARRAY['black','navy','olive','charcoal'], ARRAY[]::text[], 'weather-ready', 4)
ON CONFLICT DO NOTHING;

INSERT INTO body_type_rules (body_type, gender_support, recommended_fits, avoid_fits, styling_tips) VALUES
  ('rectangle', ARRAY['male','female','unisex'], ARRAY['structured layers','waist definition','tapered trousers'], ARRAY['shapeless full-volume outfits'], ARRAY['Create shape with jackets, belts, or contrast between top and bottom volume.']),
  ('triangle', ARRAY['male','female','unisex'], ARRAY['structured shoulders','darker bottoms','straight-leg trousers'], ARRAY['clingy light bottoms with tiny tops'], ARRAY['Draw attention upward with color, collars, or layering.']),
  ('inverted triangle', ARRAY['male','female','unisex'], ARRAY['relaxed bottoms','simple tops','soft shoulders'], ARRAY['extra shoulder bulk'], ARRAY['Balance broader shoulders with volume or visual weight below.']),
  ('hourglass', ARRAY['female','unisex'], ARRAY['waist emphasis','wrap silhouettes','tailored pieces'], ARRAY['boxy pieces without structure'], ARRAY['Keep natural proportions visible with clean waist or vertical lines.']),
  ('oval', ARRAY['male','female','unisex'], ARRAY['open layers','vertical lines','midweight fabrics'], ARRAY['clingy thin fabrics','bulky waist details'], ARRAY['Use layers and neckline openness to create length and comfort.'])
ON CONFLICT DO NOTHING;

INSERT INTO climate_style_rules (climate_type, recommended_fabrics, avoid_fabrics, recommended_categories, styling_tips) VALUES
  ('hot', ARRAY['linen','cotton','rayon','lightweight denim'], ARRAY['heavy wool','thick leather','polyester fleece'], ARRAY['shorts','breathable shirts','dresses','sandals'], ARRAY['Choose lighter colors and leave room for airflow.']),
  ('humid', ARRAY['linen','cotton','bamboo','performance blends'], ARRAY['silk that stains easily','heavy synthetics'], ARRAY['loose shirts','skirts','shorts','open shoes'], ARRAY['Avoid tight layers and prioritize quick-dry comfort.']),
  ('rainy', ARRAY['nylon','treated cotton','water-resistant blends'], ARRAY['suede','thin silk','dragging hems'], ARRAY['rain jackets','boots','hoodies','dark trousers'], ARRAY['Keep hems shorter and shoes weather-safe.']),
  ('cold', ARRAY['wool','cashmere','fleece','thermal cotton'], ARRAY['thin linen','mesh'], ARRAY['coats','knits','boots','scarves'], ARRAY['Layer base, insulation, and outer protection.']),
  ('mild', ARRAY['cotton','denim','light wool','knits'], ARRAY['overly heavy outerwear'], ARRAY['light jackets','jeans','shirts','sneakers'], ARRAY['Use removable layers for changing temperatures.'])
ON CONFLICT DO NOTHING;

INSERT INTO fashion_aesthetics (name, slug, description, keywords, recommended_colors, common_categories) VALUES
  ('Old Money', 'old-money', 'Quiet luxury with tailored classics, refined fabrics, and restrained colors.', ARRAY['tailored','heritage','quiet luxury','polished'], ARRAY['navy','cream','camel','white','brown'], ARRAY['blazer','polo','trousers','loafers','knitwear']),
  ('Streetwear', 'streetwear', 'Urban, relaxed, graphic, and sneaker-led styling.', ARRAY['oversized','graphic','sneakers','urban'], ARRAY['black','white','grey','red','denim blue'], ARRAY['hoodie','cargo pants','sneakers','graphic tee','cap']),
  ('Minimalist', 'minimalist', 'Clean silhouettes, low visual noise, and edited color palettes.', ARRAY['clean','simple','monochrome','structured'], ARRAY['black','white','grey','navy','beige'], ARRAY['shirt','trousers','slip dress','loafers','coat']),
  ('Classic', 'classic', 'Timeless staples that work across seasons and occasions.', ARRAY['timeless','balanced','neat','versatile'], ARRAY['navy','white','black','camel','burgundy'], ARRAY['button-down','jeans','blazer','dress','loafers']),
  ('Casual', 'casual', 'Comfortable everyday pieces with easy styling.', ARRAY['easy','comfortable','relaxed','practical'], ARRAY['denim blue','white','olive','grey'], ARRAY['t-shirt','jeans','sneakers','hoodie','casual dress']),
  ('Corporate', 'corporate', 'Structured, professional, credible office styling.', ARRAY['formal','structured','credible','business'], ARRAY['navy','black','white','grey'], ARRAY['suit','blazer','shirt','trousers','dress shoes']),
  ('Romantic', 'romantic', 'Soft colors, graceful shapes, delicate details, and polished femininity.', ARRAY['soft','floral','delicate','flowy'], ARRAY['pink','cream','white','lavender'], ARRAY['dress','skirt','blouse','heels','jewelry']),
  ('Soft Girl', 'soft-girl', 'Youthful, pastel, cozy, and sweet styling.', ARRAY['pastel','cozy','cute','soft'], ARRAY['pink','white','cream','baby blue'], ARRAY['cardigan','mini skirt','sneakers','hair accessories']),
  ('Clean Girl', 'clean-girl', 'Fresh, minimal, polished, and grooming-focused styling.', ARRAY['fresh','sleek','minimal','polished'], ARRAY['white','cream','black','beige'], ARRAY['tank','shirt','straight jeans','gold jewelry','slick layers']),
  ('Afro-Modern', 'afro-modern', 'Modern silhouettes with African textiles, color, craft, or cultural detail.', ARRAY['ankara','native','modern','cultural'], ARRAY['gold','emerald','royal blue','cream'], ARRAY['traditional wear','two-piece','headwear','statement accessories']),
  ('Luxury', 'luxury', 'Elevated fabrics, refined finishing, and expensive-looking combinations.', ARRAY['premium','elevated','silk','tailored'], ARRAY['black','cream','gold','camel','burgundy'], ARRAY['suit','silk blouse','coat','heels','loafers']),
  ('Sporty', 'sporty', 'Athletic, movement-ready, clean active styling.', ARRAY['active','performance','trainers','functional'], ARRAY['black','grey','white','blue'], ARRAY['activewear','trainers','joggers','zip jacket']),
  ('Vintage', 'vintage', 'Retro references, nostalgic silhouettes, and characterful pieces.', ARRAY['retro','heritage','thrifted','nostalgic'], ARRAY['brown','cream','mustard','burgundy'], ARRAY['denim jacket','printed shirt','midi skirt','loafers'])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  keywords = EXCLUDED.keywords,
  recommended_colors = EXCLUDED.recommended_colors,
  common_categories = EXCLUDED.common_categories;

CREATE TABLE IF NOT EXISTS outfit_photo_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_public_id TEXT NOT NULL,
  occasion_slug TEXT,
  weather_context JSONB,
  overall_score NUMERIC,
  color_harmony_score NUMERIC,
  formality_score NUMERIC,
  fit_balance_score NUMERIC,
  occasion_suitability_score NUMERIC,
  ai_feedback TEXT,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  improvements TEXT[] NOT NULL DEFAULT '{}',
  accessory_suggestions TEXT[] NOT NULL DEFAULT '{}',
  alternative_suggestions TEXT[] NOT NULL DEFAULT '{}',
  final_verdict TEXT,
  raw_ai_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wardrobe_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wardrobe_item_id UUID REFERENCES wardrobe_items(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_url TEXT,
  image_public_id TEXT,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_style_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  weather_date DATE NOT NULL,
  weather_data JSONB NOT NULL,
  style_advice JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wardrobe_health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_items INTEGER NOT NULL DEFAULT 0,
  category_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  color_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  style_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_essentials JSONB NOT NULL DEFAULT '[]'::jsonb,
  overrepresented_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  underrepresented_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outfit_photo_reviews_user ON outfit_photo_reviews (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wardrobe_scan_jobs_user ON wardrobe_scan_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_style_cache_location_date ON weather_style_cache (LOWER(location), weather_date, expires_at);
CREATE INDEX IF NOT EXISTS idx_wardrobe_health_reports_user ON wardrobe_health_reports (user_id, created_at DESC);

INSERT INTO site_settings (setting_key, setting_value, description, is_public) VALUES
  ('vision_analysis_enabled', 'true'::jsonb, 'Enable AI clothing image analysis.', TRUE),
  ('outfit_photo_review_enabled', 'true'::jsonb, 'Enable outfit photo review.', TRUE),
  ('weather_styling_enabled', 'true'::jsonb, 'Enable weather-aware styling.', TRUE),
  ('wardrobe_health_enabled', 'true'::jsonb, 'Enable wardrobe health reports.', TRUE),
  ('bulk_wardrobe_scan_enabled', 'true'::jsonb, 'Enable bulk wardrobe scan.', FALSE),
  ('max_photo_reviews_free', '5'::jsonb, 'Monthly outfit photo review limit for Free users.', FALSE),
  ('max_photo_reviews_pro', '40'::jsonb, 'Monthly outfit photo review limit for Pro users.', FALSE),
  ('max_photo_reviews_premium', '150'::jsonb, 'Monthly outfit photo review limit for Premium users.', FALSE),
  ('max_wardrobe_scans_free', '10'::jsonb, 'Monthly wardrobe scan limit for Free users.', FALSE),
  ('max_wardrobe_scans_pro', '100'::jsonb, 'Monthly wardrobe scan limit for Pro users.', FALSE),
  ('max_wardrobe_scans_premium', '500'::jsonb, 'Monthly wardrobe scan limit for Premium users.', FALSE),
  ('max_bulk_scan_items_free', '0'::jsonb, 'Maximum items per bulk scan for Free users.', FALSE),
  ('max_bulk_scan_items_pro', '10'::jsonb, 'Maximum items per bulk scan for Pro users.', FALSE),
  ('max_bulk_scan_items_premium', '50'::jsonb, 'Maximum items per bulk scan for Premium users.', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS outfit_wear_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  wardrobe_item_ids UUID[] NOT NULL DEFAULT '{}',
  occasion_slug TEXT,
  worn_date DATE NOT NULL,
  location TEXT,
  weather_context JSONB,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_fashion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  occasion_slug TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  dress_code TEXT,
  notes TEXT,
  selected_outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  liked_parts TEXT[] NOT NULL DEFAULT '{}',
  disliked_parts TEXT[] NOT NULL DEFAULT '{}',
  feedback_note TEXT,
  would_wear_again BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_style_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, memory_type, memory_key)
);

CREATE TABLE IF NOT EXISTS outfit_recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  occasion_slug TEXT,
  recommendation_reason TEXT,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  rejected BOOLEAN NOT NULL DEFAULT FALSE,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outfit_wear_history_user_date ON outfit_wear_history (user_id, worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_wear_history_items ON outfit_wear_history USING GIN (wardrobe_item_ids);
CREATE INDEX IF NOT EXISTS idx_user_fashion_events_user_date ON user_fashion_events (user_id, event_date ASC);
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_outfit ON outfit_feedback (user_id, outfit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_style_memory_user_type ON user_style_memory (user_id, memory_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_recommendation_logs_user ON outfit_recommendation_logs (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_user_fashion_events_updated_at ON user_fashion_events;
CREATE TRIGGER trg_user_fashion_events_updated_at
BEFORE UPDATE ON user_fashion_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_style_memory_updated_at ON user_style_memory;
CREATE TRIGGER trg_user_style_memory_updated_at
BEFORE UPDATE ON user_style_memory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO site_settings (setting_key, setting_value, description, is_public) VALUES
  ('fashion_memory_enabled', 'true'::jsonb, 'Enable personal fashion memory.', TRUE),
  ('outfit_history_enabled', 'true'::jsonb, 'Enable outfit wear history.', TRUE),
  ('event_styling_enabled', 'true'::jsonb, 'Enable event styling.', TRUE),
  ('style_feedback_enabled', 'true'::jsonb, 'Enable outfit feedback learning.', TRUE),
  ('reminders_enabled', 'true'::jsonb, 'Enable manual styling reminder emails.', TRUE),
  ('max_events_free', '3'::jsonb, 'Maximum active fashion events for Free users.', FALSE),
  ('max_events_pro', '30'::jsonb, 'Maximum active fashion events for Pro users.', FALSE),
  ('max_events_premium', '100'::jsonb, 'Maximum active fashion events for Premium users.', FALSE),
  ('max_memory_entries_free', '20'::jsonb, 'Maximum style memory entries for Free users.', FALSE),
  ('max_memory_entries_pro', '200'::jsonb, 'Maximum style memory entries for Pro users.', FALSE),
  ('max_memory_entries_premium', '1000'::jsonb, 'Maximum style memory entries for Premium users.', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  profile_image_public_id TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  creator_type TEXT NOT NULL DEFAULT 'public_user' CHECK (creator_type IN ('public_user', 'stylist', 'creator')),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  follower_count INTEGER NOT NULL DEFAULT 0,
  total_posts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_profile_id UUID REFERENCES creator_profiles(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  cover_image_url TEXT,
  cover_image_public_id TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('ai_generated_outfit', 'wardrobe_outfit', 'outfit_photo', 'inspiration_post')),
  source_id UUID,
  occasion_slug TEXT,
  aesthetic_slug TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS community_post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (creator_profile_id, follower_user_id)
);

CREATE TABLE IF NOT EXISTS style_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS style_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES style_boards(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (board_id, post_id)
);

CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'clicked', 'liked', 'saved', 'shared')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_user ON creator_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_feed ON community_posts (visibility, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_aesthetic ON community_posts (aesthetic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_occasion ON community_posts (occasion_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_followers_creator ON creator_followers (creator_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_boards_user ON style_boards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_events_user ON discovery_events (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_creator_profiles_updated_at ON creator_profiles;
CREATE TRIGGER trg_creator_profiles_updated_at
BEFORE UPDATE ON creator_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_community_comments_updated_at ON community_comments;
CREATE TRIGGER trg_community_comments_updated_at
BEFORE UPDATE ON community_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_style_boards_updated_at ON style_boards;
CREATE TRIGGER trg_style_boards_updated_at
BEFORE UPDATE ON style_boards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO site_settings (setting_key, setting_value, description, is_public) VALUES
  ('community_enabled', 'true'::jsonb, 'Enable community inspiration feed.', TRUE),
  ('creator_profiles_enabled', 'true'::jsonb, 'Enable creator profiles.', TRUE),
  ('style_boards_enabled', 'true'::jsonb, 'Enable style boards.', TRUE),
  ('comments_enabled', 'true'::jsonb, 'Enable community comments.', TRUE),
  ('reporting_enabled', 'true'::jsonb, 'Enable community reporting.', TRUE),
  ('max_boards_free', '3'::jsonb, 'Maximum style boards for Free users.', FALSE),
  ('max_boards_pro', '25'::jsonb, 'Maximum style boards for Pro users.', FALSE),
  ('max_boards_premium', '200'::jsonb, 'Maximum style boards for Premium users.', FALSE)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

CREATE TABLE IF NOT EXISTS cultural_fashion_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  region TEXT,
  ethnic_group TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  male_signature_outfits TEXT[] NOT NULL DEFAULT '{}',
  female_signature_outfits TEXT[] NOT NULL DEFAULT '{}',
  unisex_signature_outfits TEXT[] NOT NULL DEFAULT '{}',
  common_fabrics TEXT[] NOT NULL DEFAULT '{}',
  common_colors TEXT[] NOT NULL DEFAULT '{}',
  symbolic_colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  common_accessories TEXT[] NOT NULL DEFAULT '{}',
  modern_variations TEXT[] NOT NULL DEFAULT '{}',
  cultural_notes TEXT[] NOT NULL DEFAULT '{}',
  mistakes_to_avoid TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultural_occasion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultural_profile_id UUID NOT NULL REFERENCES cultural_fashion_profiles(id) ON DELETE CASCADE,
  occasion_slug TEXT NOT NULL,
  dress_code_level TEXT,
  male_recommendations TEXT[] NOT NULL DEFAULT '{}',
  female_recommendations TEXT[] NOT NULL DEFAULT '{}',
  unisex_recommendations TEXT[] NOT NULL DEFAULT '{}',
  accessories TEXT[] NOT NULL DEFAULT '{}',
  color_guidance TEXT[] NOT NULL DEFAULT '{}',
  avoid_rules TEXT[] NOT NULL DEFAULT '{}',
  formality_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultural_outfit_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultural_profile_id UUID NOT NULL REFERENCES cultural_fashion_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  component_type TEXT NOT NULL,
  gender_support TEXT[] NOT NULL DEFAULT ARRAY['male','female','unisex'],
  description TEXT,
  common_pairings TEXT[] NOT NULL DEFAULT '{}',
  suitable_occasions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_cultural_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  country TEXT,
  ethnic_group TEXT,
  preferred_cultural_styles TEXT[] NOT NULL DEFAULT '{}',
  wears_traditional_attire BOOLEAN NOT NULL DEFAULT FALSE,
  cultural_style_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cultural_occasion_rules_unique ON cultural_occasion_rules (cultural_profile_id, occasion_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cultural_components_unique ON cultural_outfit_components (cultural_profile_id, LOWER(name), LOWER(component_type));
CREATE INDEX IF NOT EXISTS idx_cultural_profiles_search ON cultural_fashion_profiles (LOWER(country), LOWER(ethnic_group), is_active);
CREATE INDEX IF NOT EXISTS idx_user_cultural_preferences_user ON user_cultural_preferences (user_id);

DROP TRIGGER IF EXISTS trg_cultural_fashion_profiles_updated_at ON cultural_fashion_profiles;
CREATE TRIGGER trg_cultural_fashion_profiles_updated_at
BEFORE UPDATE ON cultural_fashion_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cultural_occasion_rules_updated_at ON cultural_occasion_rules;
CREATE TRIGGER trg_cultural_occasion_rules_updated_at
BEFORE UPDATE ON cultural_occasion_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_cultural_preferences_updated_at ON user_cultural_preferences;
CREATE TRIGGER trg_user_cultural_preferences_updated_at
BEFORE UPDATE ON user_cultural_preferences
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO cultural_fashion_profiles (
  country, region, ethnic_group, slug, description, male_signature_outfits,
  female_signature_outfits, unisex_signature_outfits, common_fabrics, common_colors,
  symbolic_colors, common_accessories, modern_variations, cultural_notes, mistakes_to_avoid
) VALUES
  ('Nigeria', 'South West', 'Yoruba', 'yoruba', 'Yoruba fashion is known for elegant ceremonial tailoring, Aso Oke fabric, coordinated family fabrics, and expressive headwear.', ARRAY['Agbada', 'Buba', 'Sokoto', 'Fila'], ARRAY['Iro', 'Buba', 'Gele'], ARRAY['Aso Ebi coordinated looks'], ARRAY['Aso Oke', 'Ankara', 'Lace'], ARRAY['gold', 'white', 'cream', 'royal blue', 'burgundy'], '{"white":"purity and celebration","gold":"prestige and celebration"}'::jsonb, ARRAY['Fila', 'Gele', 'beads'], ARRAY['tailored Agbada with loafers', 'lace Iro and Buba with modern clutch', 'Ankara two-piece'], ARRAY['Gele and Fila are important finishing pieces for ceremonial styling.', 'Aso Ebi coordination matters at many weddings.'], ARRAY['Avoid underdressing for traditional weddings.', 'Avoid careless or poorly tied headwear for formal ceremonies.']),
  ('Nigeria', 'South East', 'Igbo', 'igbo', 'Igbo cultural fashion often uses Isi Agu, wrappers, coral beads, red caps, and rich ceremonial textiles.', ARRAY['Isi Agu', 'wrapper', 'red cap'], ARRAY['blouse and wrapper', 'George wrapper'], ARRAY['coral bead styling'], ARRAY['George', 'Isi Agu fabric', 'lace', 'Ankara'], ARRAY['red', 'white', 'gold', 'black', 'coral'], '{"red":"title and prestige in many ceremonial contexts","coral":"status and celebration"}'::jsonb, ARRAY['coral beads', 'red cap', 'head tie'], ARRAY['Isi Agu shirt with tailored trousers', 'George wrapper with contemporary blouse'], ARRAY['Coral beads are common for traditional weddings and title ceremonies.', 'Red cap can carry title symbolism.'], ARRAY['Avoid using title symbols casually where context requires respect.', 'Avoid clashing ceremonial beads with overly casual footwear.']),
  ('Nigeria', 'North', 'Hausa/Fulani', 'hausa-fulani', 'Hausa/Fulani fashion emphasizes modest, flowing silhouettes, embroidery, caps, hijab styling, and regal simplicity.', ARRAY['Babban Riga', 'Kaftan', 'Fula cap'], ARRAY['Abaya', 'Zani', 'Hijab', 'embroidered gowns'], ARRAY['embroidered modest robes'], ARRAY['cotton brocade', 'embroidery', 'silk blends'], ARRAY['white', 'cream', 'navy', 'green', 'gold'], '{"white":"clean modest elegance","green":"heritage and refinement"}'::jsonb, ARRAY['caps', 'modest jewelry', 'hijab'], ARRAY['embroidered kaftan with clean sandals', 'modern abaya with structured bag'], ARRAY['Modesty is important; prioritize coverage and graceful drape.', 'Embroidery often defines formality.'], ARRAY['Avoid overly revealing styling.', 'Avoid tight or transparent fabrics for modest occasions.']),
  ('Nigeria', 'Middle Belt', 'Tiv', 'tiv', 'Tiv fashion is strongly associated with black-and-white striped A’nger fabric used in wrappers, sashes, and modern tailoring.', ARRAY['A’nger tunic', 'wrapper', 'cap'], ARRAY['A’nger wrapper', 'blouse', 'head tie'], ARRAY['A’nger sash', 'black-and-white striped fabric'], ARRAY['A’nger', 'cotton', 'Ankara'], ARRAY['black', 'white'], '{"black_and_white":"Tiv identity and cultural pride"}'::jsonb, ARRAY['beads', 'caps', 'sashes'], ARRAY['A’nger blazer', 'A’nger skirt set', 'striped accent sash'], ARRAY['The black-and-white A’nger fabric is the signature visual cue.', 'Works well for festivals and cultural weddings.'], ARRAY['Avoid losing the signature stripe balance with too many competing prints.']),
  ('Nigeria', 'North Central', 'Igala', 'igala', 'Igala traditional styling includes wrapper forms, caps, beads, and the yellow-green-black striped Achi fabric for cultural ceremony attire.', ARRAY['traditional wrapper', 'cap', 'embroidered top'], ARRAY['wrapper styling', 'blouse', 'head tie'], ARRAY['Achi striped fabric'], ARRAY['Achi', 'Ankara', 'cotton'], ARRAY['yellow', 'green', 'black'], '{"yellow_green_black":"Igala cultural identity in Achi fabric"}'::jsonb, ARRAY['caps', 'beads'], ARRAY['Achi accent scarf', 'Achi tailored top', 'modern wrapper set'], ARRAY['Achi fabric is a strong cultural marker.', 'Beads and caps elevate ceremony looks.'], ARRAY['Avoid treating Achi fabric as a random stripe without cultural intent.']),
  ('Nigeria', 'South South', 'Edo', 'edo', 'Edo ceremonial fashion is known for coral beads, wrappers, royal-inspired styling, and dramatic ceremonial elegance.', ARRAY['wrapper', 'embroidered shirt', 'coral beads'], ARRAY['wrapper', 'beaded top', 'headpiece'], ARRAY['coral bead ceremonial styling'], ARRAY['velvet', 'George', 'lace', 'beaded textiles'], ARRAY['coral', 'red', 'gold', 'white'], '{"coral":"royalty, ceremony, and prestige"}'::jsonb, ARRAY['coral beads', 'beaded headpiece', 'wrappers'], ARRAY['coral beads with minimalist modern tailoring', 'royal-inspired reception look'], ARRAY['Coral beads are central to many Edo ceremonial looks.', 'Royal-inspired styling should feel dignified.'], ARRAY['Avoid cheap-looking bead overload.', 'Avoid casual footwear with ceremonial bead styling.']),
  ('Nigeria', 'South South', 'Efik/Ibibio', 'efik-ibibio', 'Efik/Ibibio fashion includes Onyonyo, wrapper and blouse styling, beads, and graceful ceremonial forms.', ARRAY['wrapper', 'embroidered shirt', 'cap'], ARRAY['Onyonyo', 'wrapper and blouse'], ARRAY['beaded ceremonial styling'], ARRAY['lace', 'George', 'cotton', 'Ankara'], ARRAY['white', 'gold', 'red', 'blue'], '{"white":"ceremony and grace","gold":"celebration"}'::jsonb, ARRAY['beads', 'head ties', 'fans'], ARRAY['modern Onyonyo silhouette', 'wrapper and blouse with structured accessories'], ARRAY['Onyonyo is a recognizable feminine ceremonial style.', 'Beads and graceful draping matter.'], ARRAY['Avoid overly casual styling for ceremonial Onyonyo looks.']),
  ('Nigeria', 'North Central', 'Nupe', 'nupe', 'Nupe traditional fashion features embroidered outfits, caps, modest styling, and dignified ceremonial dressing.', ARRAY['embroidered traditional outfit', 'cap', 'kaftan'], ARRAY['embroidered gown', 'wrapper', 'head covering'], ARRAY['embroidered modest styling'], ARRAY['cotton', 'brocade', 'embroidery'], ARRAY['white', 'cream', 'green', 'blue'], '{"embroidery":"craft and formality"}'::jsonb, ARRAY['caps', 'modest jewelry'], ARRAY['embroidered kaftan with modern shoes', 'modest embroidered gown'], ARRAY['Embroidery and modest styling are important.', 'Caps can complete male traditional looks.'], ARRAY['Avoid ignoring modesty expectations for formal cultural contexts.']),
  ('Nigeria', 'North East', 'Kanuri', 'kanuri', 'Kanuri fashion includes flowing robes, caps, modest layers, and regal styling suitable for cultural and formal events.', ARRAY['flowing robes', 'embroidered kaftan', 'cap'], ARRAY['modest gown', 'abaya-inspired robes', 'head covering'], ARRAY['regal flowing robe'], ARRAY['brocade', 'cotton', 'embroidered fabric'], ARRAY['white', 'cream', 'gold', 'navy'], '{"flowing_robes":"regal and dignified presentation"}'::jsonb, ARRAY['caps', 'modest jewelry'], ARRAY['flowing robe with refined sandals', 'modern modest gown with embroidery'], ARRAY['Regal modesty and flowing silhouettes are central.', 'Embroidery increases formality.'], ARRAY['Avoid tight or revealing silhouettes for formal cultural styling.'])
ON CONFLICT (slug) DO UPDATE SET
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  ethnic_group = EXCLUDED.ethnic_group,
  description = EXCLUDED.description,
  male_signature_outfits = EXCLUDED.male_signature_outfits,
  female_signature_outfits = EXCLUDED.female_signature_outfits,
  unisex_signature_outfits = EXCLUDED.unisex_signature_outfits,
  common_fabrics = EXCLUDED.common_fabrics,
  common_colors = EXCLUDED.common_colors,
  symbolic_colors = EXCLUDED.symbolic_colors,
  common_accessories = EXCLUDED.common_accessories,
  modern_variations = EXCLUDED.modern_variations,
  cultural_notes = EXCLUDED.cultural_notes,
  mistakes_to_avoid = EXCLUDED.mistakes_to_avoid;

INSERT INTO cultural_occasion_rules (
  cultural_profile_id, occasion_slug, dress_code_level, male_recommendations,
  female_recommendations, unisex_recommendations, accessories, color_guidance,
  avoid_rules, formality_notes
)
SELECT id, occasion_slug, dress_code_level, male_recommendations, female_recommendations,
  unisex_recommendations, accessories, color_guidance, avoid_rules, formality_notes
FROM (
  VALUES
    ('yoruba', 'wedding', 'formal traditional', ARRAY['Agbada', 'Buba and Sokoto', 'Fila'], ARRAY['Iro and Buba', 'Gele', 'lace wrapper set'], ARRAY['Aso Ebi coordinated fabric'], ARRAY['Fila', 'Gele', 'beads'], ARRAY['Coordinate with Aso Ebi colors when provided.', 'Gold and cream elevate ceremony looks.'], ARRAY['Avoid underdressing.', 'Avoid clashing with family Aso Ebi colors.'], 'Yoruba weddings are usually highly polished and ceremonial.'),
    ('yoruba', 'traditional-ceremony', 'formal traditional', ARRAY['Agbada', 'Fila'], ARRAY['Iro and Buba', 'Gele'], ARRAY['Aso Oke accents'], ARRAY['beads', 'headwear'], ARRAY['Use rich but respectful colors.'], ARRAY['Avoid casual sneakers unless the event is explicitly modern casual.'], 'Traditional ceremonies call for respectful tailoring and complete accessories.'),
    ('yoruba', 'church-thanksgiving', 'smart traditional', ARRAY['Buba and Sokoto', 'Fila'], ARRAY['Iro and Buba', 'Gele'], ARRAY['lace or Ankara sets'], ARRAY['Gele', 'Fila'], ARRAY['White, cream, and soft jewel tones work well.'], ARRAY['Avoid revealing or overly loud styling.'], 'Balance celebration with church-appropriate modesty.'),
    ('igbo', 'traditional-wedding', 'formal traditional', ARRAY['Isi Agu', 'wrapper', 'red cap where appropriate'], ARRAY['George wrapper', 'blouse and wrapper'], ARRAY['coral bead styling'], ARRAY['coral beads', 'red cap', 'head tie'], ARRAY['Red, coral, white, gold, and black are common ceremonial colors.'], ARRAY['Avoid misusing title symbols.', 'Avoid overly casual footwear.'], 'Igbo traditional weddings reward rich textiles, beads, and symbolic detail.'),
    ('igbo', 'title-ceremony', 'formal traditional', ARRAY['Isi Agu', 'red cap where culturally appropriate'], ARRAY['George wrapper', 'coral beads'], ARRAY['coral accessories'], ARRAY['coral beads'], ARRAY['Deep red, white, gold, and coral feel ceremonial.'], ARRAY['Avoid wearing status symbols without context.'], 'Title ceremonies are high-formality cultural events.'),
    ('hausa-fulani', 'wedding', 'formal modest', ARRAY['Babban Riga', 'embroidered kaftan', 'Fula cap'], ARRAY['Abaya', 'embroidered gown', 'Hijab'], ARRAY['modest embroidered robes'], ARRAY['caps', 'modest jewelry'], ARRAY['White, cream, green, navy, and gold are refined options.'], ARRAY['Avoid revealing cuts.', 'Avoid transparent fabrics.'], 'Prioritize modesty, embroidery, and graceful drape.'),
    ('tiv', 'cultural-event', 'traditional', ARRAY['A’nger tunic', 'wrapper'], ARRAY['A’nger wrapper', 'blouse'], ARRAY['A’nger sash'], ARRAY['beads', 'caps'], ARRAY['Let black-and-white A’nger remain the visual anchor.'], ARRAY['Avoid too many competing prints.'], 'A’nger fabric is the core cultural marker.'),
    ('igala', 'traditional-ceremony', 'traditional', ARRAY['Achi fabric top', 'wrapper', 'cap'], ARRAY['Achi wrapper styling', 'head tie'], ARRAY['Achi accent pieces'], ARRAY['beads', 'caps'], ARRAY['Yellow, green, and black should be treated as intentional cultural colors.'], ARRAY['Avoid styling Achi like a random fashion stripe.'], 'Achi fabric carries strong cultural identity.'),
    ('edo', 'traditional-wedding', 'royal ceremonial', ARRAY['wrapper', 'embroidered shirt', 'coral beads'], ARRAY['wrapper', 'beaded top', 'coral beads'], ARRAY['royal-inspired bead styling'], ARRAY['coral beads', 'beaded headpiece'], ARRAY['Coral, red, white, and gold create Edo ceremony impact.'], ARRAY['Avoid cheap-looking bead overload.', 'Avoid casual footwear.'], 'Edo ceremonial looks should feel regal and dignified.'),
    ('efik-ibibio', 'traditional-wedding', 'ceremonial', ARRAY['wrapper', 'embroidered shirt'], ARRAY['Onyonyo', 'wrapper and blouse'], ARRAY['beaded styling'], ARRAY['beads', 'fans', 'head ties'], ARRAY['White, gold, red, and blue are graceful choices.'], ARRAY['Avoid under-accessorizing formal Onyonyo looks.'], 'Graceful silhouette and beads are central.'),
    ('nupe', 'cultural-event', 'modest traditional', ARRAY['embroidered kaftan', 'cap'], ARRAY['embroidered gown', 'head covering'], ARRAY['embroidered modest styling'], ARRAY['caps', 'modest jewelry'], ARRAY['Cream, green, white, and blue feel refined.'], ARRAY['Avoid ignoring modesty expectations.'], 'Embroidery and modest formality matter.'),
    ('kanuri', 'cultural-event', 'regal modest', ARRAY['flowing robe', 'embroidered kaftan', 'cap'], ARRAY['modest gown', 'head covering'], ARRAY['regal flowing robe'], ARRAY['caps', 'modest jewelry'], ARRAY['White, cream, gold, and navy support regal styling.'], ARRAY['Avoid tight or revealing silhouettes.'], 'Flowing modest robes create a dignified Kanuri look.')
) AS rules(slug, occasion_slug, dress_code_level, male_recommendations, female_recommendations, unisex_recommendations, accessories, color_guidance, avoid_rules, formality_notes)
JOIN cultural_fashion_profiles cfp ON cfp.slug = rules.slug
ON CONFLICT (cultural_profile_id, occasion_slug) DO UPDATE SET
  dress_code_level = EXCLUDED.dress_code_level,
  male_recommendations = EXCLUDED.male_recommendations,
  female_recommendations = EXCLUDED.female_recommendations,
  unisex_recommendations = EXCLUDED.unisex_recommendations,
  accessories = EXCLUDED.accessories,
  color_guidance = EXCLUDED.color_guidance,
  avoid_rules = EXCLUDED.avoid_rules,
  formality_notes = EXCLUDED.formality_notes;

INSERT INTO cultural_outfit_components (cultural_profile_id, name, component_type, gender_support, description, common_pairings, suitable_occasions)
SELECT cfp.id, component.name, component.component_type, component.gender_support, component.description, component.common_pairings, component.suitable_occasions
FROM cultural_fashion_profiles cfp
JOIN (
  VALUES
    ('yoruba', 'Agbada', 'outerwear', ARRAY['male','unisex'], 'Wide-sleeved flowing robe used for high-formality Yoruba looks.', ARRAY['Buba', 'Sokoto', 'Fila'], ARRAY['wedding', 'traditional-ceremony']),
    ('yoruba', 'Gele', 'headwear', ARRAY['female'], 'Structured head tie that completes formal Yoruba women’s attire.', ARRAY['Iro', 'Buba', 'lace'], ARRAY['wedding', 'church-thanksgiving']),
    ('igbo', 'Isi Agu', 'top', ARRAY['male','unisex'], 'Patterned ceremonial top strongly associated with Igbo cultural dressing.', ARRAY['wrapper', 'red cap', 'coral beads'], ARRAY['traditional-wedding', 'title-ceremony']),
    ('igbo', 'George Wrapper', 'wrapper', ARRAY['female'], 'Rich wrapper textile often used for ceremonial Igbo women’s styling.', ARRAY['blouse', 'coral beads', 'head tie'], ARRAY['traditional-wedding']),
    ('hausa-fulani', 'Babban Riga', 'robe', ARRAY['male'], 'Flowing embroidered robe for formal Hausa/Fulani occasions.', ARRAY['kaftan', 'Fula cap'], ARRAY['wedding', 'cultural-event']),
    ('hausa-fulani', 'Hijab', 'headwear', ARRAY['female'], 'Modest head covering styled with gowns or abaya looks.', ARRAY['abaya', 'embroidered gown'], ARRAY['wedding', 'religious-event']),
    ('tiv', 'A’nger Fabric', 'fabric', ARRAY['male','female','unisex'], 'Black-and-white striped fabric central to Tiv identity.', ARRAY['wrapper', 'sash', 'cap'], ARRAY['cultural-event', 'wedding']),
    ('igala', 'Achi Fabric', 'fabric', ARRAY['male','female','unisex'], 'Yellow-green-black striped fabric associated with Igala cultural styling.', ARRAY['wrapper', 'cap', 'beads'], ARRAY['traditional-ceremony']),
    ('edo', 'Coral Beads', 'accessory', ARRAY['male','female','unisex'], 'Ceremonial beads associated with Edo royal-inspired looks.', ARRAY['wrapper', 'beaded headpiece'], ARRAY['traditional-wedding']),
    ('efik-ibibio', 'Onyonyo', 'dress', ARRAY['female'], 'Recognizable graceful ceremonial dress style.', ARRAY['beads', 'fan', 'head tie'], ARRAY['traditional-wedding']),
    ('nupe', 'Embroidered Kaftan', 'robe', ARRAY['male','unisex'], 'Modest embroidered traditional outfit.', ARRAY['cap', 'sandals'], ARRAY['cultural-event']),
    ('kanuri', 'Flowing Robe', 'robe', ARRAY['male','unisex'], 'Regal flowing robe suited to formal cultural styling.', ARRAY['cap', 'modest jewelry'], ARRAY['cultural-event'])
) AS component(slug, name, component_type, gender_support, description, common_pairings, suitable_occasions) ON component.slug = cfp.slug
ON CONFLICT DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, description, is_public) VALUES
  ('cultural_fashion_enabled', 'true'::jsonb, 'Enable cultural fashion context features.', TRUE),
  ('cultural_fashion_public_profiles_enabled', 'true'::jsonb, 'Expose public cultural fashion profiles.', TRUE),
  ('cultural_fashion_ai_styling_enabled', 'true'::jsonb, 'Enable AI cultural fashion styling.', TRUE)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;
