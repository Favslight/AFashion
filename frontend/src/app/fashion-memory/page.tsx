"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function FashionMemoryPage() {
  return (
    <ModulePage
      module={userModule("Fashion Memory")}
      actions={[
        {
          label: "Create memory",
          method: "POST",
          path: "/api/fashion-memory",
          fields: [
            { name: "memory_type", label: "Memory type", placeholder: "liked_style" },
            { name: "memory_key", label: "Memory key", placeholder: "minimalist neutrals" },
            { name: "memory_value", label: "Memory notes", type: "json", placeholder: "User saves neutral looks" },
            { name: "confidence_score", label: "Confidence score", type: "number", placeholder: "0.8" },
            { name: "source", label: "Source", placeholder: "manual" },
          ],
        },
        { label: "Rebuild fashion memory", method: "POST", path: "/api/fashion-memory/rebuild" },
      ]}
    />
  );
}

