"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function CulturalFashionPage() {
  return (
    <ModulePage
      module={userModule("Cultural Fashion")}
      loads={[
        { title: "Cultural profiles", path: "/api/cultural-fashion/profiles", mode: "public" },
        { title: "My cultural preferences", path: "/api/cultural-fashion/preferences" },
      ]}
      actions={[
        {
          label: "Save cultural preference",
          method: "PATCH",
          path: "/api/cultural-fashion/preferences",
          fields: [
            { name: "country", label: "Country", placeholder: "Nigeria" },
            { name: "ethnic_group", label: "Ethnic group", placeholder: "Igbo" },
            { name: "preferred_cultural_styles", label: "Preferred cultural styles", type: "tags", placeholder: "isi agu, george wrapper" },
            { name: "wears_traditional_attire", label: "Wears traditional attire", type: "checkbox" },
            { name: "cultural_style_notes", label: "Notes", type: "textarea", placeholder: "Modern but respectful." },
          ],
        },
        {
          label: "Style cultural look",
          method: "POST",
          path: "/api/cultural-fashion/style",
          fields: [
            {
              name: "cultureSlug",
              label: "Cultural background",
              source: {
                title: "Cultural profiles",
                collection: "profiles",
                valueKey: "slug",
                labelKeys: ["ethnic_group", "country"],
                emptyLabel: "Choose a cultural profile",
              },
            },
            {
              name: "occasionSlug",
              label: "Event type",
              type: "select",
              options: [
                { label: "Wedding", value: "wedding" },
                { label: "Traditional wedding", value: "traditional-wedding" },
                { label: "Traditional ceremony", value: "traditional-ceremony" },
                { label: "Church thanksgiving", value: "church-thanksgiving" },
                { label: "Title ceremony", value: "title-ceremony" },
                { label: "Cultural event", value: "cultural-event" },
              ],
            },
            { name: "genderPreference", label: "Gender preference", placeholder: "female" },
            { name: "mood", label: "Mood", placeholder: "premium" },
            { name: "useWardrobe", label: "Use wardrobe", type: "checkbox", defaultValue: true },
          ],
        },
      ]}
    />
  );
}

