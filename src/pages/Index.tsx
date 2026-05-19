import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DecisionDNASection from "@/components/DecisionDNASection";
import Features from "@/components/Features";
import VideoLegacy from "@/components/VideoLegacy";
import Security from "@/components/Security";
import FamilyAccess from "@/components/FamilyAccess";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <DecisionDNASection />
      <Features />
      <VideoLegacy />
      <Security />
      <FamilyAccess />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
