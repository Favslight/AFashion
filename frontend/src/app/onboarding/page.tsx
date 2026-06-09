"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function OnboardingPage() {
  return (
    <ModulePage
      module={userModule("Onboarding")}
      actions={[
        {
          label: "Save style profile",
          method: "PATCH",
          path: "/api/onboarding/profile",
          description: "Updates the profile used by wardrobe intelligence, cultural context, and AI recommendations.",
          fields: [
            { name: "gender_preference", label: "Gender preference", placeholder: "female, male, unisex" },
            { name: "body_type", label: "Body type", placeholder: "optional" },
            { name: "budget_range", label: "Budget range", placeholder: "mid-range" },
            { name: "climate_location", label: "Climate location", placeholder: "Lagos" },
            { name: "fashion_goals", label: "Fashion goals", type: "tags", placeholder: "polished workwear, date night, church" },
            { name: "favorite_aesthetics", label: "Favorite aesthetics", type: "tags", placeholder: "minimalist, afro-modern, clean girl" },
            { name: "favorite_colors", label: "Favorite colors", type: "tags", placeholder: "black, white, fuchsia" },
            { name: "country", label: "Country", placeholder: "Nigeria" },
            { name: "ethnic_group", label: "Ethnic group", placeholder: "Yoruba, Igbo, Hausa/Fulani" },
            { name: "wears_traditional_attire", label: "Wears traditional attire", type: "checkbox", placeholder: "Include cultural fashion context" },
            { name: "cultural_style_notes", label: "Cultural style notes", type: "textarea", placeholder: "Any preferences or boundaries..." },
          ],
        },
      ]}
    />
  );
}

