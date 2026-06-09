import {
  BarChart3,
  Bot,
  CalendarHeart,
  Camera,
  CloudSun,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  MessageCircleHeart,
  Palette,
  Route,
  ScanLine,
  Settings,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  UsersRound,
  WalletCards,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type BackendEndpoint = {
  method: HttpMethod;
  path: string;
  auth?: "public" | "user" | "admin" | "super-admin";
  purpose: string;
};

export type AppModule = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  endpoints: BackendEndpoint[];
};

export const publicRoutes: BackendEndpoint[] = [
  { method: "GET", path: "/health", auth: "public", purpose: "API health check" },
  { method: "POST", path: "/api/auth/signup", auth: "public", purpose: "Create user account" },
  { method: "POST", path: "/api/auth/login", auth: "public", purpose: "Login user" },
  { method: "POST", path: "/api/auth/verify-email", auth: "public", purpose: "Verify email token" },
  { method: "POST", path: "/api/auth/forgot-password", auth: "public", purpose: "Request reset token" },
  { method: "POST", path: "/api/auth/reset-password", auth: "public", purpose: "Reset password" },
  { method: "GET", path: "/api/settings/public", auth: "public", purpose: "Public site settings" },
  { method: "GET", path: "/api/subscriptions/plans", auth: "public", purpose: "Subscription plans" },
  { method: "GET", path: "/api/fashion/colors/combinations", auth: "public", purpose: "Color combinations" },
  { method: "GET", path: "/api/fashion/aesthetics", auth: "public", purpose: "Fashion aesthetics" },
  { method: "GET", path: "/api/cultural-fashion/profiles", auth: "public", purpose: "Cultural profiles" },
  { method: "GET", path: "/api/cultural-fashion/search", auth: "public", purpose: "Search cultural profiles" },
];

export const userModules: AppModule[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Overview of your wardrobe, outfits, subscription, memory, events, and recommendations.",
    icon: LayoutDashboard,
    endpoints: [
      { method: "GET", path: "/api/auth/me", auth: "user", purpose: "Current user" },
      { method: "GET", path: "/api/subscriptions/me", auth: "user", purpose: "Current subscription" },
      { method: "GET", path: "/api/wardrobe", auth: "user", purpose: "Wardrobe summary" },
      { method: "GET", path: "/api/outfits", auth: "user", purpose: "Saved outfit summary" },
    ],
  },
  {
    title: "Onboarding",
    href: "/onboarding",
    description: "Style profile, goals, preferences, cultural context, and climate location.",
    icon: Palette,
    endpoints: [
      { method: "POST", path: "/api/onboarding/profile", auth: "user", purpose: "Create style profile" },
      { method: "GET", path: "/api/onboarding/profile", auth: "user", purpose: "Load style profile" },
      { method: "PATCH", path: "/api/onboarding/profile", auth: "user", purpose: "Update style profile" },
    ],
  },
  {
    title: "Wardrobe",
    href: "/wardrobe",
    description: "Upload, scan, update, analyze, rescan, favorite, and delete wardrobe items.",
    icon: Shirt,
    endpoints: [
      { method: "POST", path: "/api/wardrobe/upload", auth: "user", purpose: "Upload wardrobe item" },
      { method: "POST", path: "/api/wardrobe/bulk-scan", auth: "user", purpose: "Bulk scan images" },
      { method: "GET", path: "/api/wardrobe", auth: "user", purpose: "List wardrobe items" },
      { method: "GET", path: "/api/wardrobe/scan-jobs", auth: "user", purpose: "List scan jobs" },
      { method: "PATCH", path: "/api/wardrobe/:id", auth: "user", purpose: "Update wardrobe item" },
      { method: "DELETE", path: "/api/wardrobe/:id", auth: "user", purpose: "Delete wardrobe item" },
    ],
  },
  {
    title: "AI Outfits",
    href: "/outfits",
    description: "Generate outfits, list occasions, save looks, and manage recommendation history.",
    icon: WandSparkles,
    endpoints: [
      { method: "GET", path: "/api/occasions", auth: "user", purpose: "List occasions" },
      { method: "POST", path: "/api/outfits/generate", auth: "user", purpose: "Generate outfit" },
      { method: "GET", path: "/api/outfits", auth: "user", purpose: "List outfits" },
      { method: "POST", path: "/api/outfits/:id/save", auth: "user", purpose: "Save outfit" },
      { method: "DELETE", path: "/api/outfits/:id", auth: "user", purpose: "Delete outfit" },
    ],
  },
  {
    title: "AI Stylist",
    href: "/ai-stylist",
    description: "Chat, event recommendations, outfit photo AI, and realtime session tokens.",
    icon: MessageCircleHeart,
    endpoints: [
      { method: "POST", path: "/api/ai/style-chat", auth: "user", purpose: "Stylist chat" },
      { method: "POST", path: "/api/ai/analyze-outfit-photo", auth: "user", purpose: "Analyze outfit photo" },
      { method: "POST", path: "/api/ai/recommend-for-event", auth: "user", purpose: "Event recommendation" },
      { method: "POST", path: "/api/ai/realtime-session-token", auth: "user", purpose: "Realtime session token" },
    ],
  },
  {
    title: "AI Vision",
    href: "/vision",
    description: "Analyze wardrobe photos, review outfit photos, and manage saved visual reviews.",
    icon: Camera,
    endpoints: [
      { method: "POST", path: "/api/vision/analyze-wardrobe-item", auth: "user", purpose: "Analyze clothing photo" },
      { method: "POST", path: "/api/vision/review-outfit-photo", auth: "user", purpose: "Review outfit photo" },
      { method: "GET", path: "/api/vision/reviews", auth: "user", purpose: "List outfit reviews" },
      { method: "DELETE", path: "/api/vision/reviews/:id", auth: "user", purpose: "Delete review" },
    ],
  },
  {
    title: "Weather Styling",
    href: "/weather",
    description: "Current weather and weather-aware styling advice.",
    icon: CloudSun,
    endpoints: [
      { method: "GET", path: "/api/weather/current", auth: "user", purpose: "Current weather by location" },
      { method: "POST", path: "/api/weather/style-advice", auth: "user", purpose: "Weather styling advice" },
    ],
  },
  {
    title: "Wardrobe Health",
    href: "/wardrobe-health",
    description: "Wardrobe balance, gaps, climate readiness, and health reports.",
    icon: ScanLine,
    endpoints: [
      { method: "POST", path: "/api/wardrobe-health/analyze", auth: "user", purpose: "Analyze wardrobe health" },
      { method: "GET", path: "/api/wardrobe-health/latest", auth: "user", purpose: "Latest report" },
      { method: "GET", path: "/api/wardrobe-health/reports", auth: "user", purpose: "List reports" },
    ],
  },
  {
    title: "Fashion Memory",
    href: "/fashion-memory",
    description: "Learned style preferences, insights, memory rebuild, and memory edits.",
    icon: Sparkles,
    endpoints: [
      { method: "GET", path: "/api/fashion-memory", auth: "user", purpose: "List memories" },
      { method: "POST", path: "/api/fashion-memory", auth: "user", purpose: "Create memory" },
      { method: "GET", path: "/api/fashion-memory/insights", auth: "user", purpose: "Memory insights" },
      { method: "POST", path: "/api/fashion-memory/rebuild", auth: "user", purpose: "Rebuild memory" },
    ],
  },
  {
    title: "Outfit History",
    href: "/outfit-history",
    description: "Track worn outfits, calendar history, recent looks, and repetition prevention.",
    icon: ListChecks,
    endpoints: [
      { method: "POST", path: "/api/outfit-history/worn", auth: "user", purpose: "Mark worn" },
      { method: "GET", path: "/api/outfit-history", auth: "user", purpose: "List history" },
      { method: "GET", path: "/api/outfit-history/recent", auth: "user", purpose: "Recent history" },
      { method: "GET", path: "/api/outfit-history/calendar", auth: "user", purpose: "Calendar history" },
    ],
  },
  {
    title: "Events",
    href: "/events",
    description: "Create events, generate event outfits, select looks, and send reminders.",
    icon: CalendarHeart,
    endpoints: [
      { method: "POST", path: "/api/events", auth: "user", purpose: "Create event" },
      { method: "GET", path: "/api/events", auth: "user", purpose: "List events" },
      { method: "GET", path: "/api/events/upcoming", auth: "user", purpose: "Upcoming events" },
      { method: "POST", path: "/api/events/:id/generate-outfit", auth: "user", purpose: "Generate event outfit" },
      { method: "POST", path: "/api/events/:id/send-reminder", auth: "user", purpose: "Send reminder" },
    ],
  },
  {
    title: "Community",
    href: "/community",
    description: "Posts, outfit sharing, likes, saves, comments, reports, and discovery.",
    icon: UsersRound,
    endpoints: [
      { method: "GET", path: "/api/community/posts", auth: "user", purpose: "List posts" },
      { method: "POST", path: "/api/community/posts", auth: "user", purpose: "Create post" },
      { method: "POST", path: "/api/community/share-outfit/:outfitId", auth: "user", purpose: "Share outfit" },
      { method: "GET", path: "/api/discovery/feed", auth: "user", purpose: "Discovery feed" },
      { method: "GET", path: "/api/discovery/trending", auth: "user", purpose: "Trending feed" },
      { method: "GET", path: "/api/discovery/for-you", auth: "user", purpose: "For You feed" },
    ],
  },
  {
    title: "Style Boards",
    href: "/style-boards",
    description: "Create boards, manage board items, and organize inspiration.",
    icon: Star,
    endpoints: [
      { method: "POST", path: "/api/style-boards", auth: "user", purpose: "Create board" },
      { method: "GET", path: "/api/style-boards", auth: "user", purpose: "List boards" },
      { method: "POST", path: "/api/style-boards/:id/items", auth: "user", purpose: "Add board item" },
      { method: "DELETE", path: "/api/style-boards/:id/items/:itemId", auth: "user", purpose: "Remove board item" },
    ],
  },
  {
    title: "Creators",
    href: "/creators",
    description: "Creator profiles, follows, followers, and creator posts.",
    icon: Bot,
    endpoints: [
      { method: "POST", path: "/api/creators/profile", auth: "user", purpose: "Create creator profile" },
      { method: "GET", path: "/api/creators/profile/me", auth: "user", purpose: "My creator profile" },
      { method: "PATCH", path: "/api/creators/profile", auth: "user", purpose: "Update creator profile" },
      { method: "POST", path: "/api/creators/:id/follow", auth: "user", purpose: "Follow creator" },
    ],
  },
  {
    title: "Cultural Fashion",
    href: "/cultural-fashion",
    description: "Nigerian cultural profiles, preferences, and culturally aware AI styling.",
    icon: HeartHandshake,
    endpoints: [
      { method: "GET", path: "/api/cultural-fashion/profiles", auth: "public", purpose: "List profiles" },
      { method: "GET", path: "/api/cultural-fashion/preferences", auth: "user", purpose: "Get preferences" },
      { method: "PATCH", path: "/api/cultural-fashion/preferences", auth: "user", purpose: "Update preferences" },
      { method: "POST", path: "/api/cultural-fashion/style", auth: "user", purpose: "Generate cultural look" },
    ],
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    description: "Plans, current subscription, and plan changes.",
    icon: WalletCards,
    endpoints: [
      { method: "GET", path: "/api/subscriptions/plans", auth: "public", purpose: "List plans" },
      { method: "GET", path: "/api/subscriptions/me", auth: "user", purpose: "Current subscription" },
      { method: "POST", path: "/api/subscriptions/change-plan", auth: "user", purpose: "Change plan" },
    ],
  },
];

export const adminModules: AppModule[] = [
  {
    title: "Admin Dashboard",
    href: "/admin/dashboard",
    description: "Operational overview and admin KPIs.",
    icon: ShieldCheck,
    endpoints: [{ method: "GET", path: "/api/admin/dashboard", auth: "admin", purpose: "Admin dashboard" }],
  },
  {
    title: "Users",
    href: "/admin/users",
    description: "Manage users, status, roles, and deletions.",
    icon: UsersRound,
    endpoints: [
      { method: "GET", path: "/api/admin/users", auth: "admin", purpose: "List users" },
      { method: "PATCH", path: "/api/admin/users/:id/status", auth: "admin", purpose: "Update status" },
      { method: "PATCH", path: "/api/admin/users/:id/role", auth: "super-admin", purpose: "Update role" },
      { method: "DELETE", path: "/api/admin/users/:id", auth: "admin", purpose: "Delete user" },
    ],
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    description: "Manage plans and user subscriptions.",
    icon: WalletCards,
    endpoints: [
      { method: "GET", path: "/api/admin/subscriptions/plans", auth: "admin", purpose: "List plans" },
      { method: "POST", path: "/api/admin/subscriptions/plans", auth: "admin", purpose: "Create plan" },
      { method: "GET", path: "/api/admin/subscriptions/users", auth: "admin", purpose: "List user subscriptions" },
      { method: "PATCH", path: "/api/admin/subscriptions/users/:userId", auth: "admin", purpose: "Update user subscription" },
    ],
  },
  {
    title: "Moderation",
    href: "/admin/moderation",
    description: "Wardrobe/outfit moderation, reports, and blocked keywords.",
    icon: ShieldCheck,
    endpoints: [
      { method: "GET", path: "/api/admin/wardrobe-items", auth: "admin", purpose: "Moderate wardrobe items" },
      { method: "GET", path: "/api/admin/outfits", auth: "admin", purpose: "Moderate outfits" },
      { method: "GET", path: "/api/admin/moderation/reports", auth: "admin", purpose: "List reports" },
      { method: "GET", path: "/api/admin/moderation/blocked-keywords", auth: "admin", purpose: "Blocked keywords" },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    description: "Site settings, public settings, policies, privacy, and safety controls.",
    icon: Settings,
    endpoints: [
      { method: "GET", path: "/api/admin/settings", auth: "admin", purpose: "List settings" },
      { method: "POST", path: "/api/admin/settings", auth: "super-admin", purpose: "Create setting" },
      { method: "GET", path: "/api/admin/policies", auth: "admin", purpose: "List policies" },
      { method: "POST", path: "/api/admin/policies", auth: "admin", purpose: "Create policy" },
    ],
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    description: "Users, wardrobe, outfits, AI, subscriptions, vision, memory, and community analytics.",
    icon: BarChart3,
    endpoints: [
      { method: "GET", path: "/api/admin/analytics/users", auth: "admin", purpose: "User analytics" },
      { method: "GET", path: "/api/admin/analytics/wardrobe", auth: "admin", purpose: "Wardrobe analytics" },
      { method: "GET", path: "/api/admin/analytics/outfits", auth: "admin", purpose: "Outfit analytics" },
      { method: "GET", path: "/api/admin/analytics/ai-usage", auth: "admin", purpose: "AI usage analytics" },
      { method: "GET", path: "/api/admin/analytics/subscriptions", auth: "admin", purpose: "Subscription analytics" },
      { method: "GET", path: "/api/admin/analytics/vision", auth: "admin", purpose: "Vision analytics" },
      { method: "GET", path: "/api/admin/analytics/fashion-memory", auth: "admin", purpose: "Memory analytics" },
      { method: "GET", path: "/api/admin/analytics/community", auth: "admin", purpose: "Community analytics" },
    ],
  },
  {
    title: "Fashion Intelligence",
    href: "/admin/fashion",
    description: "Color rules, style rules, occasions, body type guidance, climate rules, and aesthetics.",
    icon: WandSparkles,
    endpoints: [
      { method: "GET", path: "/api/admin/fashion/:resource", auth: "admin", purpose: "List fashion resource" },
      { method: "POST", path: "/api/admin/fashion/:resource", auth: "admin", purpose: "Create fashion resource" },
      { method: "PATCH", path: "/api/admin/fashion/:resource/:id", auth: "admin", purpose: "Update fashion resource" },
      { method: "DELETE", path: "/api/admin/fashion/:resource/:id", auth: "admin", purpose: "Delete fashion resource" },
    ],
  },
  {
    title: "Cultural Fashion",
    href: "/admin/cultural-fashion",
    description: "Cultural profiles, occasion rules, components, and cultural settings.",
    icon: HeartHandshake,
    endpoints: [
      { method: "GET", path: "/api/admin/cultural-fashion/:resource", auth: "admin", purpose: "List cultural resource" },
      { method: "POST", path: "/api/admin/cultural-fashion/:resource", auth: "admin", purpose: "Create cultural resource" },
      { method: "PATCH", path: "/api/admin/cultural-fashion/:resource/:id", auth: "admin", purpose: "Update cultural resource" },
      { method: "DELETE", path: "/api/admin/cultural-fashion/:resource/:id", auth: "admin", purpose: "Delete cultural resource" },
    ],
  },
  {
    title: "Community Admin",
    href: "/admin/community",
    description: "Community posts, community reports, and post deletion.",
    icon: Route,
    endpoints: [
      { method: "GET", path: "/api/admin/community/posts", auth: "admin", purpose: "List community posts" },
      { method: "GET", path: "/api/admin/community/reports", auth: "admin", purpose: "List community reports" },
      { method: "PATCH", path: "/api/admin/community/reports/:id", auth: "admin", purpose: "Update report" },
      { method: "DELETE", path: "/api/admin/community/posts/:id", auth: "admin", purpose: "Delete post" },
    ],
  },
];

export const allConfirmedRoutes = [...publicRoutes, ...userModules.flatMap((module) => module.endpoints), ...adminModules.flatMap((module) => module.endpoints)];
