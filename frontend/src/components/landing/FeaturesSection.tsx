import { useState, useEffect, useRef } from "react";
import FeatureCard from "./FeatureCard";

const FeaturesSection = () => {
  const ref = useRef<HTMLElement>(null);
  const [symbolsVisible, setSymbolsVisible] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate symbols in sequence
            [0, 1, 2, 3, 4, 5, 6].forEach((index) => {
              setTimeout(() => {
                setSymbolsVisible((prev) => [...prev, index]);
              }, index * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const symbols = [
    { char: "<", style: { top: "5%", left: "2%", transform: "rotate(-15deg)" }, color: "text-symbol-black", opacity: "opacity-15", index: 0 },
    { char: ">", style: { top: "10%", right: "5%", transform: "rotate(25deg)" }, color: "text-neon-bright", opacity: "opacity-20", index: 1 },
    { char: "/", style: { top: "55%", left: "3%", transform: "rotate(10deg)" }, color: "text-symbol-black", opacity: "opacity-15", index: 2 },
    { char: ":", style: { bottom: "15%", right: "10%", transform: "rotate(-20deg)" }, color: "text-neon-bright", opacity: "opacity-20", index: 3 },
    { char: ";", style: { top: "35%", right: "2%", transform: "rotate(15deg)" }, color: "text-symbol-black", opacity: "opacity-15", index: 4 },
    { char: "~", style: { bottom: "5%", left: "15%", transform: "rotate(-10deg)" }, color: "text-neon-bright", opacity: "opacity-20", index: 5 },
    { char: "$", style: { top: "25%", left: "35%", transform: "rotate(5deg)" }, color: "text-symbol-black", opacity: "opacity-15", index: 6 },
  ];

  return (
    <section ref={ref} className="h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Coding Symbols - Larger and with colors */}
      <div className="absolute inset-0 pointer-events-none">
        {symbols.map((symbol) => (
          <span
            key={symbol.index}
            className={`absolute text-[380px] font-bold ${symbol.color} ${symbol.opacity} transition-all duration-1000 ${
              symbolsVisible.includes(symbol.index)
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
            style={symbol.style}
          >
            {symbol.char}
          </span>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10">
        <FeatureCard
          title="Lightning Fast"
          description="Built for speed. Deploy your projects in seconds, not hours. Hot reload keeps you in the flow."
          angle="-1deg"
        />
        <FeatureCard
          title="Type Safe"
          description="Catch errors before they ship. Full TypeScript support with intelligent auto-completion."
          angle="1deg"
        />
        <FeatureCard
          title="Developer First"
          description="Designed by developers, for developers. Beautiful DX with powerful CLI tools and intuitive APIs."
          angle="0.5deg"
        />
        <FeatureCard
          title="Zero Config"
          description="Start building immediately. Smart defaults that just work, with full customization when you need it."
          angle="-0.5deg"
        />
      </div>
    </section>
  );
};

export default FeaturesSection;
