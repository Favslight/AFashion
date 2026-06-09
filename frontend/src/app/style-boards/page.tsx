"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function StyleBoardsPage() {
  return (
    <ModulePage
      module={userModule("Style Boards")}
      loads={[
        { title: "Style boards", path: "/api/style-boards" },
        { title: "Community posts", path: "/api/community/posts" },
      ]}
      actions={[
        {
          label: "Create style board",
          method: "POST",
          path: "/api/style-boards",
          fields: [
            { name: "title", label: "Title", placeholder: "Wedding Looks" },
            { name: "description", label: "Description", type: "textarea", placeholder: "Saved wedding guest ideas" },
            {
              name: "visibility",
              label: "Visibility",
              type: "select",
              defaultValue: "private",
              options: [
                { label: "Private", value: "private" },
                { label: "Public", value: "public" },
              ],
            },
          ],
        },
        {
          label: "Add board item",
          method: "POST",
          path: "/api/style-boards/:id/items",
          fields: [
            {
              name: "id",
              label: "Style board",
              source: {
                title: "Style boards",
                collection: "boards",
                labelKeys: ["title", "visibility"],
                emptyLabel: "Choose a board",
              },
            },
            {
              name: "post_id",
              label: "Community post",
              source: {
                title: "Community posts",
                collection: "posts",
                labelKeys: ["title", "display_name"],
                emptyLabel: "Choose a post",
              },
            },
          ],
        },
      ]}
    />
  );
}

