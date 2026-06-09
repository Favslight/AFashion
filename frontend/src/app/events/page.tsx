"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function EventsPage() {
  return (
    <ModulePage
      module={userModule("Events")}
      loads={[
        { title: "Occasions", path: "/api/occasions" },
        { title: "Events", path: "/api/events" },
      ]}
      actions={[
        {
          label: "Create event",
          method: "POST",
          path: "/api/events",
          fields: [
            { name: "title", label: "Title", placeholder: "Client dinner" },
            {
              name: "occasion_slug",
              label: "Occasion",
              source: {
                title: "Occasions",
                collection: "occasions",
                valueKey: "slug",
                labelKeys: ["name"],
                emptyLabel: "Choose an occasion",
              },
            },
            { name: "event_date", label: "Event date", type: "datetime-local" },
            { name: "location", label: "Location", placeholder: "Lagos" },
            { name: "dress_code", label: "Dress code", placeholder: "smart casual" },
            { name: "notes", label: "Notes", type: "textarea", placeholder: "Polished but not too formal" },
            { name: "reminder_enabled", label: "Reminder", type: "checkbox", placeholder: "Enable reminder" },
          ],
        },
        {
          label: "Generate event outfit",
          method: "POST",
          path: "/api/events/:id/generate-outfit",
          fields: [
            {
              name: "id",
              label: "Event",
              source: {
                title: "Events",
                collection: "events",
                labelKeys: ["title", "event_date"],
                emptyLabel: "Choose an event",
              },
            },
          ],
        },
      ]}
    />
  );
}

