"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function StyleQuizPage() {
  return (
    <ModulePage
      module={userModule("Onboarding")}
      actions={[
        {
          label: "Save quiz answers",
          method: "PATCH",
          path: "/api/onboarding/profile",
          description: "The style quiz writes into the same onboarding profile the AI uses for outfit generation.",
          fields: [
            { name: "favorite_aesthetics", label: "Favorite aesthetics", type: "tags", placeholder: "corporate, romantic, afro-modern" },
            { name: "preferred_categories", label: "Preferred categories", type: "tags", placeholder: "blazers, dresses, kaftans" },
            { name: "fashion_goals", label: "Fashion goals", type: "tags", placeholder: "office, church, weddings, dinner" },
            { name: "favorite_colors", label: "Favorite colors", type: "tags", placeholder: "black, white, pink" },
            { name: "fashion_inspirations", label: "Fashion inspirations", type: "tags", placeholder: "creator names, brands, moods" },
          ],
        },
      ]}
    />
  );
}

