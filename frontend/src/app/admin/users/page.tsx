"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminUsersPage() {
  return (
    <ModulePage
      module={adminModule("Users")}
      mode="admin"
      loads={[{ title: "Users", path: "/api/admin/users", mode: "admin" }]}
      actions={[
        {
          label: "Update user status",
          method: "PATCH",
          path: "/api/admin/users/:id/status",
          fields: [
            {
              name: "id",
              label: "User",
              source: {
                title: "Users",
                collection: "users",
                labelKeys: ["full_name", "email"],
                emptyLabel: "Choose a user",
              },
            },
            {
              name: "account_status",
              label: "Status",
              type: "select",
              options: [
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
                { label: "Deactivated", value: "deactivated" },
              ],
            },
            { name: "suspension_reason", label: "Reason", type: "textarea", placeholder: "Optional reason for suspension" },
          ],
        },
        {
          label: "Update user role",
          method: "PATCH",
          path: "/api/admin/users/:id/role",
          fields: [
            {
              name: "id",
              label: "User",
              source: {
                title: "Users",
                collection: "users",
                labelKeys: ["full_name", "email"],
                emptyLabel: "Choose a user",
              },
            },
            {
              name: "role",
              label: "Role",
              type: "select",
              options: [
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
                { label: "Super admin", value: "super_admin" },
              ],
            },
          ],
        },
      ]}
    />
  );
}

