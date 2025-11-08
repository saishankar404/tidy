import { useRef, useState, useEffect } from "react";

const FeaturesOverview = () => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    { label: "Code Review", bgColor: "bg-feature-purple" },
    { label: "Vulnerability detection", bgColor: "bg-feature-lavender" },
    { label: "Inline Completion", bgColor: "bg-feature-lime" },
    { label: "GitHub Integration", bgColor: "bg-feature-navy" },
  ];

  return (
    <section ref={ref} className="h-screen flex flex-col items-center justify-center bg-background px-4">
      <div
        className={`flex items-center gap-6 mb-12 transition-all duration-600 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {features.map((feature, index) => (
          <div
            key={feature.label}
            className={`flex items-center gap-3 transition-all duration-500 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className={`w-4 h-4 rounded-full ${feature.bgColor}`} />
            <span className="font-mono text-sm">{feature.label}</span>
          </div>
        ))}
      </div>

      <div
        className={`w-[1080px] h-[600px] bg-muted rounded-[32px] shadow-2xl transition-all duration-800 delay-400 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      />
    </section>
  );
};

export default FeaturesOverview;
