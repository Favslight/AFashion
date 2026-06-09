"use client";

import { ModulePage } from "@/components/app/ModulePage";
import { adminModule } from "@/lib/modules";

export default function AdminDashboardPage() {
  return <ModulePage module={adminModule("Admin Dashboard")} mode="admin" />;
}

