"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminAnalyticsPage() {
  return (
    <ModulePage
      module={adminModule("Analytics")}
      mode="admin"
      loads={[
        { title: "Users", path: "/api/admin/analytics/users", mode: "admin" },
        { title: "Wardrobe", path: "/api/admin/analytics/wardrobe", mode: "admin" },
        { title: "Outfits", path: "/api/admin/analytics/outfits", mode: "admin" },
        { title: "AI usage", path: "/api/admin/analytics/ai-usage", mode: "admin" },
        { title: "Subscriptions", path: "/api/admin/analytics/subscriptions", mode: "admin" },
        { title: "Vision", path: "/api/admin/analytics/vision", mode: "admin" },
        { title: "Fashion memory", path: "/api/admin/analytics/fashion-memory", mode: "admin" },
        { title: "Community", path: "/api/admin/analytics/community", mode: "admin" },
      ]}
    />
  );
}

