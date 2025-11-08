 import { useEffect, useState } from "react";
import Navigation from "@/components/landing/Navigation";
import Marquee from "@/components/landing/Marquee";
import AnimatedWorkflow from "@/components/landing/AnimatedWorkflow";
import FeaturesOverview from "@/components/landing/FeaturesOverview";
import ParallaxCards from "@/components/landing/ParallaxCards";
import HoverFooter from "@/components/ui/hover-footer";

const LandingPage = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // Trigger hero animation on mount
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="h-screen flex flex-col">
        <Navigation />
        <Marquee />
        
        <div className="flex-1 flex items-center justify-center pb-24">
          <div 
            className={`text-center px-4 max-w-6xl mx-auto transition-all duration-800 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
          >
            <h1 className="text-8xl md:text-9xl font-bold text-foreground leading-tight mb-8 tracking-tight">
              Ship Clean Code.<br />
              Stay Productive.
            </h1>

            <p className="text-3xl md:text-4xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              The modern development platform that keeps your codebase clean while you ship faster than ever.
            </p>

            <a href="/code" className="mt-8">
              <button className="bg-neon text-foreground px-12 py-6 rounded-full font-bold text-xl hover:bg-neon/80 transition-colors duration-300 mx-4">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </section>

       {/* Parallax Cards */}
       <ParallaxCards />

       {/* Animated Workflow */}
       <AnimatedWorkflow />

       {/* Features Overview */}
       <FeaturesOverview />

       {/* Footer */}
       <HoverFooter />

     </div>
  );
};

export default LandingPage;