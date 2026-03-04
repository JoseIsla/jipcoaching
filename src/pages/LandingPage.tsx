import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import PlansSection from "@/components/landing/PlansSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import LandingFooter from "@/components/landing/LandingFooter";
import CookieBanner from "@/components/CookieBanner";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <HeroSection />
      <AboutSection />
      <PlansSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <LandingFooter />
      <CookieBanner />
    </div>
  );
};

export default LandingPage;
