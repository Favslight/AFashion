"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminSubscriptionsPage() {
  return (
    <ModulePage
      module={adminModule("Subscriptions")}
      mode="admin"
      loads={[
        { title: "Plans", path: "/api/admin/subscriptions/plans", mode: "admin" },
        { title: "User subscriptions", path: "/api/admin/subscriptions/users", mode: "admin" },
        { title: "Users", path: "/api/admin/users", mode: "admin" },
      ]}
      actions={[
        {
          label: "Create plan",
          method: "POST",
          path: "/api/admin/subscriptions/plans",
          fields: [
            { name: "name", label: "Name", placeholder: "Premium" },
            { name: "price_monthly", label: "Monthly price", type: "number", placeholder: "9999" },
            { name: "price_yearly", label: "Yearly price", type: "number", placeholder: "95990" },
            { name: "max_wardrobe_items", label: "Wardrobe item limit", type: "number", placeholder: "9999" },
            { name: "max_ai_generations_per_month", label: "AI generations monthly", type: "number", placeholder: "1000" },
          ],
        },
        {
          label: "Update user subscription",
          method: "PATCH",
          path: "/api/admin/subscriptions/users/:userId",
          fields: [
            {
              name: "userId",
              label: "User",
              source: {
                title: "Users",
                collection: "users",
                labelKeys: ["full_name", "email"],
                emptyLabel: "Choose a user",
              },
            },
            {
              name: "plan_id",
              label: "Plan",
              source: {
                title: "Plans",
                collection: "plans",
                labelKeys: ["name"],
                emptyLabel: "Choose a plan",
              },
            },
            {
              name: "status",
              label: "Status",
              type: "select",
              defaultValue: "active",
              options: [
                { label: "Active", value: "active" },
                { label: "Trialing", value: "trialing" },
                { label: "Past due", value: "past_due" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Expired", value: "expired" },
              ],
            },
          ],
        },
      ]}
    />
  );
}

