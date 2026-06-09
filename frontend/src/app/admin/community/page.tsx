"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminCommunityPage() {
  return (
    <ModulePage
      module={adminModule("Community Admin")}
      mode="admin"
      loads={[
        { title: "Community posts", path: "/api/admin/community/posts", mode: "admin" },
        { title: "Community reports", path: "/api/admin/community/reports", mode: "admin" },
      ]}
      actions={[
        {
          label: "Update community report",
          method: "PATCH",
          path: "/api/admin/community/reports/:id",
          fields: [
            {
              name: "id",
              label: "Report",
              source: {
                title: "Community reports",
                collection: "reports",
                labelKeys: ["reason", "post_title", "reporter_email"],
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
            { name: "hide_post", label: "Hide post", type: "checkbox" },
          ],
        },
        {
          label: "Delete community post",
          method: "DELETE",
          path: "/api/admin/community/posts/:id",
          fields: [
            {
              name: "id",
              label: "Post",
              source: {
                title: "Community posts",
                collection: "posts",
                labelKeys: ["title", "user_id"],
                emptyLabel: "Choose a post",
              },
            },
          ],
        },
      ]}
    />
  );
}

