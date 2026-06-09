"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

const resourceOptions = ["profiles", "occasion-rules", "components"].map((value) => ({ label: value, value }));

export default function AdminCulturalFashionPage() {
  return (
    <ModulePage
      module={adminModule("Cultural Fashion")}
      mode="admin"
      loads={[{ title: "Profiles", path: "/api/admin/cultural-fashion/profiles", mode: "admin" }]}
      actions={[
        {
          label: "List cultural resource",
          method: "GET",
          path: "/api/admin/cultural-fashion/:resource",
          fields: [{ name: "resource", label: "Resource", type: "select", options: resourceOptions }],
        },
        {
          label: "Create cultural resource",
          method: "POST",
          path: "/api/admin/cultural-fashion/:resource",
          fields: [
            { name: "resource", label: "Resource", type: "select", options: resourceOptions },
            { name: "payload", label: "Resource details", type: "json", placeholder: "Name, culture, occasion rules, and styling notes" },
          ],
        },
      ]}
    />
  );
}

