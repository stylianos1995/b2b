import { HeroSection } from "../components/home/HeroSection";
import { TrustSection } from "../components/home/TrustSection";
import { HowItWorksSection } from "../components/home/HowItWorksSection";
import { InfoSection } from "../components/home/InfoSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <InfoSection />
    </>
  );
}
