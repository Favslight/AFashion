"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminSettingsPage() {
  return (
    <ModulePage
      module={adminModule("Settings")}
      mode="admin"
      loads={[
        { title: "Settings", path: "/api/admin/settings", mode: "admin" },
        { title: "Policies", path: "/api/admin/policies", mode: "admin" },
      ]}
      actions={[
        {
          label: "Create setting",
          method: "POST",
          path: "/api/admin/settings",
          fields: [
            { name: "setting_key", label: "Setting key", placeholder: "cultural_fashion_enabled" },
            { name: "setting_value", label: "Setting value", type: "json", placeholder: "Enabled, disabled, or a setting value" },
            { name: "description", label: "Description", type: "textarea", placeholder: "Controls cultural fashion features" },
            { name: "is_public", label: "Public", type: "checkbox" },
          ],
        },
        {
          label: "Create policy",
          method: "POST",
          path: "/api/admin/policies",
          fields: [
            {
              name: "policy_type",
              label: "Policy type",
              type: "select",
              options: [
                { label: "Terms of service", value: "terms_of_service" },
                { label: "Privacy policy", value: "privacy_policy" },
                { label: "Community guidelines", value: "community_guidelines" },
                { label: "AI safety rules", value: "ai_safety_rules" },
                { label: "Image upload rules", value: "image_upload_rules" },
                { label: "Subscription refund policy", value: "subscription_refund_policy" },
              ],
            },
            { name: "title", label: "Title", placeholder: "Privacy Policy" },
            { name: "content", label: "Content", type: "textarea", placeholder: "Policy content..." },
            { name: "version", label: "Version", placeholder: "2026.1" },
            {
              name: "status",
              label: "Status",
              type: "select",
              defaultValue: "draft",
              options: [
                { label: "Draft", value: "draft" },
                { label: "Active", value: "active" },
                { label: "Archived", value: "archived" },
              ],
            },
          ],
        },
      ]}
    />
  );
}

