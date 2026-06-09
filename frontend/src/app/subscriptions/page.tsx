"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function SubscriptionsPage() {
  return (
    <ModulePage
      module={userModule("Subscriptions")}
      loads={[
        { title: "Plans", path: "/api/subscriptions/plans", mode: "public" },
        { title: "My subscription", path: "/api/subscriptions/me" },
      ]}
      actions={[
        {
          label: "Change plan",
          method: "POST",
          path: "/api/subscriptions/change-plan",
          fields: [
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
          ],
        },
      ]}
    />
  );
}

