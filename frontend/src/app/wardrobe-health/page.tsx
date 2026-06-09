"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function WardrobeHealthPage() {
  return (
    <ModulePage
      module={userModule("Wardrobe Health")}
      actions={[{ label: "Analyze wardrobe health", method: "POST", path: "/api/wardrobe-health/analyze" }]}
    />
  );
}

