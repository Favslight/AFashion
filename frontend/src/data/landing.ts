import {
  CalendarHeart,
  Camera,
  CloudSun,
  HeartHandshake,
  MessageCircleHeart,
  Palette,
  ScanLine,
  Shirt,
  Sparkles,
  UsersRound,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  title: string;
  description: string;
  backend: string;
  icon: LucideIcon;
};

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Style Quiz", href: "/style-quiz" },
];

export const stats = [
  { value: "500K+", label: "Active Users" },
  { value: "10M+", label: "Outfits Created" },
  { value: "4.9/5", label: "App Store Rating" },
  { value: "30min", label: "Saved Daily" },
];

export const features: Feature[] = [
  {
    title: "AI Outfit Generator",
    description: "Builds styled looks from your wardrobe, occasion, mood, and personal preferences.",
    backend: "Outfits + AI",
    icon: WandSparkles,
  },
  {
    title: "Digital Wardrobe",
    description: "Upload, scan, organize, favorite, and track the clothes you already own.",
    backend: "Wardrobe",
    icon: Shirt,
  },
  {
    title: "Outfit Photo Review",
    description: "Get tasteful AI critique, score breakdowns, and styling improvements from outfit photos.",
    backend: "AI Vision",
    icon: Camera,
  },
  {
    title: "Weather-Based Styling",
    description: "Plan looks that respect the day, the location, and the heat, rain, or wind outside.",
    backend: "Weather Styling",
    icon: CloudSun,
  },
  {
    title: "Cultural Fashion Styling",
    description: "Receive culturally aware guidance for Nigerian traditional and modern occasions.",
    backend: "Cultural Fashion Context",
    icon: HeartHandshake,
  },
  {
    title: "Event Styling",
    description: "Prepare for church, weddings, office days, dinners, and important events with context.",
    backend: "Event Styling",
    icon: CalendarHeart,
  },
  {
    title: "Fashion Memory",
    description: "Learns the silhouettes, colors, ratings, and outfit history that define your taste.",
    backend: "Fashion Memory",
    icon: Sparkles,
  },
  {
    title: "Community Inspiration",
    description: "Discover creators, saved looks, public boards, and ranked inspiration feeds.",
    backend: "Community + Discovery",
    icon: UsersRound,
  },
  {
    title: "Wardrobe Health",
    description: "Find gaps, repeated categories, climate readiness, and missing occasion essentials.",
    backend: "Wardrobe Health",
    icon: ScanLine,
  },
  {
    title: "AI Stylist Chat",
    description: "Ask for quick styling help with wardrobe, memory, rules, culture, and context included.",
    backend: "AI",
    icon: MessageCircleHeart,
  },
];

export const steps = [
  {
    title: "Upload Your Wardrobe",
    description: "Add pieces manually or scan clothing photos so your closet becomes searchable.",
  },
  {
    title: "AI Understands Your Style",
    description: "The stylist learns your preferences, events, weather needs, and cultural context.",
  },
  {
    title: "Get Perfect Outfits",
    description: "Receive polished recommendations with scores, reasons, and save-ready outfit cards.",
  },
];

export const outfitPreviews = [
  {
    occasion: "Office",
    title: "Corporate Meeting Look",
    score: 96,
    palette: ["#111111", "#f7f1e8", "#c5a46d"],
    why: "Sharp tailoring, muted contrast, and polished accessories keep the look confident without feeling loud.",
  },
  {
    occasion: "Church",
    title: "Church Service Look",
    score: 94,
    palette: ["#ffffff", "#e9b8ce", "#602047"],
    why: "Elegant coverage, soft color, and comfortable structure make it graceful for a long morning.",
  },
  {
    occasion: "Wedding",
    title: "Wedding Guest Look",
    score: 98,
    palette: ["#f20a83", "#f6d365", "#181818"],
    why: "Festive color, refined fabric, and occasion-aware styling create presence without overshadowing the couple.",
  },
  {
    occasion: "Dinner",
    title: "Dinner Date Look",
    score: 93,
    palette: ["#181818", "#b60cff", "#f7d7e8"],
    why: "A sleek base with one expressive accent keeps the outfit romantic, modern, and easy to wear.",
  },
  {
    occasion: "Culture",
    title: "Cultural Event Look",
    score: 97,
    palette: ["#0f766e", "#facc15", "#f20a83"],
    why: "Traditional accents, balanced color, and modern finishing make the outfit respectful and premium.",
  },
];

export const communityTiles = [
  { title: "Trending aesthetics", label: "Clean girl, afro-modern, old money", tone: "from-pink-200 to-fuchsia-100" },
  { title: "Saved looks", label: "Office neutrals and dinner polish", tone: "from-stone-200 to-pink-100" },
  { title: "Creator inspiration", label: "Fashionista boards and style notes", tone: "from-fuchsia-200 to-purple-100" },
  { title: "Style boards", label: "Wedding Looks, Church Fits, Date Night", tone: "from-rose-100 to-zinc-100" },
  { title: "For You feed", label: "Ranked by memory, likes, saves", tone: "from-white to-pink-100" },
  { title: "Cultural ideas", label: "Yoruba, Igbo, Hausa/Fulani context", tone: "from-emerald-100 to-pink-100" },
];

export const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Manager",
    quote:
      "It feels like having a stylist who actually remembers my wardrobe. I save time every weekday and still look more intentional.",
  },
  {
    name: "Alex Morgan",
    role: "Creative Director",
    quote:
      "The photo reviews are precise without being harsh. It catches the small details that make an outfit feel premium.",
  },
  {
    name: "Emma Johnson",
    role: "Entrepreneur",
    quote:
      "The event styling is brilliant. Office, dinner, wedding, church - it gives me confidence before I leave home.",
  },
];

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    period: "forever",
    description: "A simple start for building your digital wardrobe.",
    features: [
      "Upload up to 10 wardrobe items",
      "Limited AI outfit generations",
      "Basic style recommendations",
      "Basic community discovery",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 4999,
    period: "month",
    badge: "Most Popular",
    description: "For weekly styling, events, weather, and smarter memory.",
    features: [
      "Up to 150 wardrobe items",
      "More AI outfit generations",
      "Outfit photo reviews",
      "Weather-based styling",
      "Event styling",
      "Fashion memory insights",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 9999,
    period: "month",
    description: "Full wardrobe intelligence for power users and creators.",
    features: [
      "Unlimited wardrobe items",
      "Advanced AI outfit generation",
      "Bulk wardrobe scan",
      "Advanced wardrobe health",
      "Cultural fashion styling",
      "Premium community discovery",
      "Priority AI styling",
    ],
  },
];

export const faqs = [
  {
    question: "How does the AI understand my style?",
    answer:
      "It combines your onboarding answers, wardrobe metadata, saved outfits, ratings, fashion memory, event history, and feedback to form a living style profile.",
  },
  {
    question: "Can I use clothes I already own?",
    answer:
      "Yes. The wardrobe module is built around your existing closet, including manual uploads, AI scans, favorites, categories, and worn history.",
  },
  {
    question: "Is my wardrobe data private?",
    answer:
      "Private wardrobe data stays scoped to your authenticated account. Community sharing is separate and only happens when you intentionally share a look.",
  },
  {
    question: "Can it style me for weddings, church, office, and cultural events?",
    answer:
      "Yes. Event styling, occasion rules, weather context, and cultural fashion guidance help tailor recommendations for those scenarios.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "The subscription flow is designed around plan management, and payment can be connected to the existing subscription module when billing is enabled.",
  },
  {
    question: "Does it support Nigerian cultural fashion?",
    answer:
      "Yes. The backend includes Nigerian cultural fashion profiles and AI styling context for groups including Yoruba, Igbo, Hausa/Fulani, Tiv, Edo, and more.",
  },
];

export const routeCards = [
  { title: "Login", href: "/login", icon: Zap },
  { title: "Sign up", href: "/signup", icon: Sparkles },
  { title: "Onboarding", href: "/onboarding", icon: Palette },
  { title: "Dashboard", href: "/dashboard", icon: Shirt },
  { title: "Pricing", href: "/pricing", icon: WandSparkles },
  { title: "Style Quiz", href: "/style-quiz", icon: MessageCircleHeart },
];
