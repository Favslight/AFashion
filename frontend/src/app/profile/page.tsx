"use client";

import { UserRound } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

const profileModule = {
  title: "Profile",
  href: "/profile",
  description: "Manage account profile data connected to /api/users/me.",
  icon: UserRound,
  endpoints: [
    { method: "GET" as const, path: "/api/users/me", auth: "user" as const, purpose: "Current profile" },
    { method: "PATCH" as const, path: "/api/users/me", auth: "user" as const, purpose: "Update profile" },
  ],
};

export default function ProfilePage() {
  return (
    <ModulePage
      module={profileModule}
      actions={[
        {
          label: "Update profile",
          method: "PATCH",
          path: "/api/users/me",
          fields: [
            { name: "full_name", label: "Full name", placeholder: "Your name" },
            { name: "avatar_url", label: "Avatar URL", placeholder: "https://..." },
          ],
        },
      ]}
    />
  );
}

