"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function OutfitHistoryPage() {
  return (
    <ModulePage
      module={userModule("Outfit History")}
      loads={[
        { title: "Outfits", path: "/api/outfits" },
        { title: "Recent history", path: "/api/outfit-history/recent" },
      ]}
      actions={[
        {
          label: "Mark outfit worn",
          method: "POST",
          path: "/api/outfit-history/worn",
          fields: [
            {
              name: "outfit_id",
              label: "Outfit",
              source: {
                title: "Outfits",
                collection: "outfits",
                labelKeys: ["title", "occasion_name"],
                emptyLabel: "Choose an outfit",
              },
            },
            { name: "worn_date", label: "Worn date", type: "date" },
            { name: "user_rating", label: "Rating", type: "number", placeholder: "5" },
            { name: "notes", label: "Notes", type: "textarea", placeholder: "Felt polished and comfortable." },
          ],
        },
      ]}
    />
  );
}

