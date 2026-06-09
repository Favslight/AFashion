"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function CreatorsPage() {
  return (
    <ModulePage
      module={userModule("Creators")}
      actions={[
        {
          label: "Create creator profile",
          method: "POST",
          path: "/api/creators/profile",
          fields: [
            { name: "display_name", label: "Display name", placeholder: "Fashionista" },
            { name: "bio", label: "Bio", type: "textarea", placeholder: "Clean corporate and afro-modern outfit ideas." },
            {
              name: "creator_type",
              label: "Profile type",
              type: "select",
              defaultValue: "creator",
              options: [
                { label: "Creator", value: "creator" },
                { label: "Stylist", value: "stylist" },
                { label: "Public user", value: "public_user" },
              ],
            },
            { name: "instagram_handle", label: "Instagram handle", placeholder: "fashionista" },
          ],
        },
      ]}
    />
  );
}

