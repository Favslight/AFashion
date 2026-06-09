"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { userModule } from "@/lib/modules";

export default function DashboardPage() {
  return <ModulePage module={userModule("Dashboard")} />;
}

