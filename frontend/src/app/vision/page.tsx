"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function VisionPage() {
  return (
    <ModulePage
      module={userModule("AI Vision")}
      loads={[
        { title: "Occasions", path: "/api/occasions" },
        { title: "Reviews", path: "/api/vision/reviews" },
      ]}
      actions={[
        {
          label: "Analyze wardrobe photo",
          method: "POST",
          path: "/api/vision/analyze-wardrobe-item",
          multipart: true,
          fields: [
            { name: "file", label: "Clothing image", type: "file" },
            { name: "saveToWardrobe", label: "Save to wardrobe", type: "checkbox", placeholder: "Create wardrobe item" },
            { name: "name", label: "Optional item name", placeholder: "Cream blouse" },
          ],
        },
        {
          label: "Review outfit photo",
          method: "POST",
          path: "/api/vision/review-outfit-photo",
          multipart: true,
          fields: [
            { name: "file", label: "Outfit photo", type: "file" },
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
            { name: "location", label: "Location", placeholder: "Lagos" },
          ],
        },
      ]}
    />
  );
}

