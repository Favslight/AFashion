"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function WeatherPage() {
  return (
    <ModulePage
      module={userModule("Weather Styling")}
      loads={[{ title: "Occasions", path: "/api/occasions" }]}
      actions={[
        {
          label: "Get current weather",
          method: "GET",
          path: "/api/weather/current?location=:location",
          fields: [{ name: "location", label: "Location", placeholder: "Lagos", required: true }],
        },
        {
          label: "Get style advice",
          method: "POST",
          path: "/api/weather/style-advice",
          fields: [
            { name: "location", label: "Location", placeholder: "Lagos", required: true },
            {
              name: "occasionSlug",
              label: "Occasion",
              required: true,
              source: {
                title: "Occasions",
                collection: "occasions",
                valueKey: "slug",
                labelKeys: ["name"],
                emptyLabel: "Choose an occasion",
              },
            },
            { name: "preferences", label: "Styling preferences", type: "textarea", placeholder: "Polished but comfortable" },
          ],
        },
      ]}
    />
  );
}

