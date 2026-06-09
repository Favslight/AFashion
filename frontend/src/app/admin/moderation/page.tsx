"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminModerationPage() {
  return (
    <ModulePage
      module={adminModule("Moderation")}
      mode="admin"
      loads={[
        { title: "Wardrobe items", path: "/api/admin/wardrobe-items", mode: "admin" },
        { title: "Outfits", path: "/api/admin/outfits", mode: "admin" },
        { title: "Reports", path: "/api/admin/moderation/reports", mode: "admin" },
        { title: "Blocked keywords", path: "/api/admin/moderation/blocked-keywords", mode: "admin" },
      ]}
      actions={[
        {
          label: "Create blocked keyword",
          method: "POST",
          path: "/api/admin/moderation/blocked-keywords",
          fields: [
            { name: "keyword", label: "Keyword", placeholder: "unsafe term" },
            { name: "category", label: "Category", placeholder: "safety" },
            {
              name: "severity",
              label: "Severity",
              type: "select",
              defaultValue: "medium",
              options: [
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
              ],
            },
            { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
          ],
        },
        {
          label: "Update report status",
          method: "PATCH",
          path: "/api/admin/moderation/reports/:id/status",
          fields: [
            {
              name: "id",
              label: "Report",
              source: {
                title: "Reports",
                collection: "reports",
                labelKeys: ["reason", "reporter_email"],
                emptyLabel: "Choose a report",
              },
            },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: [
                { label: "Pending", value: "pending" },
                { label: "Reviewing", value: "reviewing" },
                { label: "Resolved", value: "resolved" },
                { label: "Dismissed", value: "dismissed" },
              ],
            },
            { name: "resolution_note", label: "Resolution note", type: "textarea", placeholder: "Action taken..." },
          ],
        },
      ]}
    />
  );
}

