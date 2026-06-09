import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
