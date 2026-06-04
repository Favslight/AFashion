export const fashionSeedTables = [
  "color_combinations",
  "style_rules",
  "occasion_rules",
  "body_type_rules",
  "climate_style_rules",
  "fashion_aesthetics"
];

export const seedInstructions = "Run psql \"$DATABASE_URL\" -f src/database/schema.sql to create and seed Phase 2 fashion intelligence tables.";
