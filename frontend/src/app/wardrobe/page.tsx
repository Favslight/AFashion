"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function WardrobePage() {
  return (
    <ModulePage
      module={userModule("Wardrobe")}
      loads={[
        { title: "Wardrobe items", path: "/api/wardrobe" },
        { title: "Scan jobs", path: "/api/wardrobe/scan-jobs" },
      ]}
      actions={[
        {
          label: "Upload wardrobe item",
          method: "POST",
          path: "/api/wardrobe/upload",
          multipart: true,
          fields: [
            { name: "file", label: "Clothing photo", type: "file" },
            { name: "name", label: "Item name", placeholder: "Black blazer" },
            { name: "category", label: "Category", placeholder: "outerwear" },
            { name: "subcategory", label: "Subcategory", placeholder: "blazer" },
            { name: "gender_fit", label: "Gender fit", placeholder: "female" },
            { name: "color", label: "Color", placeholder: "black" },
            { name: "material", label: "Material", placeholder: "wool blend" },
          ],
        },
        {
          label: "Analyze item",
          method: "POST",
          path: "/api/wardrobe/:id/analyze",
          fields: [
            {
              name: "id",
              label: "Wardrobe item",
              source: {
                title: "Wardrobe items",
                collection: "items",
                labelKeys: ["name", "category", "color"],
                emptyLabel: "Choose an item",
              },
            },
          ],
        },
      ]}
    />
  );
}

