"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function CommunityPage() {
  return (
    <ModulePage
      module={userModule("Community")}
      loads={[
        { title: "Community posts", path: "/api/community/posts" },
        { title: "Outfits", path: "/api/outfits" },
        { title: "Discovery feed", path: "/api/discovery/feed" },
        { title: "Trending", path: "/api/discovery/trending" },
        { title: "For you", path: "/api/discovery/for-you" },
      ]}
      actions={[
        {
          label: "Create community post",
          method: "POST",
          path: "/api/community/posts",
          fields: [
            { name: "title", label: "Title", placeholder: "Office neutrals" },
            { name: "description", label: "Description", type: "textarea", placeholder: "Simple blazer outfit for work." },
            {
              name: "source_type",
              label: "Post type",
              type: "select",
              defaultValue: "inspiration_post",
              options: [
                { label: "Inspiration post", value: "inspiration_post" },
                { label: "AI generated outfit", value: "ai_generated_outfit" },
                { label: "Wardrobe outfit", value: "wardrobe_outfit" },
                { label: "Outfit photo", value: "outfit_photo" },
              ],
            },
            { name: "occasion_slug", label: "Occasion", placeholder: "office, wedding, dinner" },
            { name: "aesthetic_slug", label: "Aesthetic", placeholder: "minimalist" },
            { name: "tags", label: "Tags", type: "tags", placeholder: "office, neutral, blazer" },
            {
              name: "visibility",
              label: "Visibility",
              type: "select",
              defaultValue: "public",
              options: [
                { label: "Public", value: "public" },
                { label: "Private", value: "private" },
              ],
            },
          ],
        },
        {
          label: "Share outfit",
          method: "POST",
          path: "/api/community/share-outfit/:outfitId",
          fields: [
            {
              name: "outfitId",
              label: "Outfit",
              source: {
                title: "Outfits",
                collection: "outfits",
                labelKeys: ["title", "occasion_name"],
                emptyLabel: "Choose an outfit",
              },
            },
          ],
        },
      ]}
    />
  );
}

