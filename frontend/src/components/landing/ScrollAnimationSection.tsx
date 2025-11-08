import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ScrollAnimationSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Transform scroll progress to animation values with longer dwell times
  const firstTextOpacity = useTransform(scrollYProgress, [0, 0.1, 0.4, 0.55], [0, 1, 1, 0]);
  const firstTextY = useTransform(scrollYProgress, [0, 0.1], [50, 0]);
  const firstTextX = useTransform(scrollYProgress, [0.4, 0.55], [0, -100]);

  const imageOpacity = useTransform(scrollYProgress, [0.45, 0.55, 0.85, 0.95], [0, 1, 1, 0]);
  const imageY = useTransform(scrollYProgress, [0.45, 0.55], [100, 0]);

  const secondTextOpacity = useTransform(scrollYProgress, [0.8, 0.9, 0.95, 1.0], [0, 1, 1, 0]);
  const secondTextY = useTransform(scrollYProgress, [0.8, 0.9], [50, 0]);
  const secondTextX = useTransform(scrollYProgress, [0.95, 1.0], [0, 100]);

  return (
    <section ref={containerRef} className="h-[250vh] relative -mt-32 -mb-32">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* First Text */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: firstTextOpacity,
            y: firstTextY,
            x: firstTextX,
          }}
        >
          <h2 className="text-5xl md:text-7xl font-bold text-foreground text-center px-4 leading-tight">
            still doing the boring stuff?
          </h2>
        </motion.div>

        {/* Image Container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            y: imageY,
            opacity: imageOpacity,
          }}
        >
          <img
            src="/tidy-preview.jpeg"
            alt="Tidy Preview"
            className="w-[800px] md:w-[1200px] h-auto rounded-3xl shadow-2xl object-cover"
          />
        </motion.div>

        {/* Second Text - positioned below the image */}
        <motion.div
          className="absolute inset-0 flex items-end justify-center pb-4"
          style={{
            opacity: secondTextOpacity,
            y: secondTextY,
            x: secondTextX,
          }}
        >
          <h3 className="text-6xl md:text-8xl font-black text-foreground text-center px-4 leading-tight mt-24" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Meet Tidy.
          </h3>
        </motion.div>
      </div>
    </section>
  );
};

export default ScrollAnimationSection;