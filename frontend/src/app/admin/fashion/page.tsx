"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

const resourceOptions = [
  "colors",
  "style-rules",
  "occasion-rules",
  "body-type-rules",
  "climate-rules",
  "aesthetics",
].map((value) => ({ label: value, value }));

export default function AdminFashionPage() {
  return (
    <ModulePage
      module={adminModule("Fashion Intelligence")}
      mode="admin"
      loads={[{ title: "Aesthetics", path: "/api/admin/fashion/aesthetics", mode: "admin" }]}
      actions={[
        {
          label: "List resource",
          method: "GET",
          path: "/api/admin/fashion/:resource",
          fields: [{ name: "resource", label: "Resource", type: "select", options: resourceOptions }],
        },
        {
          label: "Create resource item",
          method: "POST",
          path: "/api/admin/fashion/:resource",
          fields: [
            { name: "resource", label: "Resource", type: "select", options: resourceOptions },
            { name: "payload", label: "Resource details", type: "json", placeholder: "Name, rules, and styling notes" },
          ],
        },
      ]}
    />
  );
}

