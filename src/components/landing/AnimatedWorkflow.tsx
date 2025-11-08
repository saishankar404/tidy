import { useEffect, useRef, useState } from "react";
import { Hand, Settings, Plane } from "lucide-react";

const AnimatedWorkflow = () => {
  const ref = useRef<HTMLElement>(null);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger animations in sequence
            [0, 1, 2].forEach((index) => {
              setTimeout(() => {
                setVisibleItems((prev) => [...prev, index]);
              }, index * 300);
            });
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

  const items = [
    { icon: (props: any) => <Hand {...props} className="text-white" />, text: "Review", bgColor: "bg-feature-lime", textColor: "text-feature-lime" },
    { icon: (props: any) => <Settings {...props} className="text-white" />, text: "Automate", bgColor: "bg-feature-navy", textColor: "text-feature-navy" },
    { icon: (props: any) => <Plane {...props} className="text-white" />, text: "Deploy", bgColor: "bg-feature-lavender", textColor: "text-feature-lavender" },
  ];

  return (
    <section ref={ref} className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {items.map((item, index) => (
          <div
            key={item.text}
            className={`flex items-center gap-8 transition-all duration-700 ${
              visibleItems.includes(index)
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-24"
            }`}
          >
            <div className={`w-24 h-24 rounded-3xl ${item.bgColor} flex items-center justify-center`}>
              <item.icon size={48} className="text-foreground" strokeWidth={2} />
            </div>
            <span className={`text-8xl font-mono font-bold ${item.textColor}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AnimatedWorkflow;
