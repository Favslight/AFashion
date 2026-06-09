"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function OutfitsPage() {
  return (
    <ModulePage
      module={userModule("AI Outfits")}
      loads={[
        { title: "Occasions", path: "/api/occasions" },
        { title: "Outfits", path: "/api/outfits" },
        { title: "Cultural profiles", path: "/api/cultural-fashion/profiles", mode: "public" },
      ]}
      actions={[
        {
          label: "Generate outfit",
          method: "POST",
          path: "/api/outfits/generate",
          fields: [
            {
              name: "occasionSlug",
              label: "Occasion",
              source: {
                title: "Occasions",
                collection: "occasions",
                valueKey: "slug",
                labelKeys: ["name"],
                emptyLabel: "Choose an occasion",
              },
            },
            { name: "mood", label: "Mood", placeholder: "confident but elegant" },
            { name: "location", label: "Location", placeholder: "Lagos" },
            { name: "useWeather", label: "Use weather", type: "checkbox", placeholder: "Include weather styling" },
            { name: "useFashionMemory", label: "Use fashion memory", type: "checkbox", defaultValue: true },
            { name: "culturalOccasion", label: "Cultural occasion", type: "checkbox" },
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
          ],
        },
        {
          label: "Save outfit",
          method: "POST",
          path: "/api/outfits/:id/save",
          fields: [
            {
              name: "id",
              label: "Outfit",
              source: {
                title: "Outfits",
                collection: "outfits",
                labelKeys: ["title", "occasion_name"],
                emptyLabel: "Choose an outfit",
              },
            },
          ],
        },
      ]}
    />
  );
}

