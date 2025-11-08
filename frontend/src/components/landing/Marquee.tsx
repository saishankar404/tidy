const Marquee = () => {
  return (
    <div className="w-full flex justify-center mt-4">
      <div className="w-[1080px] h-8 bg-neon rounded-full overflow-hidden flex items-center">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="inline-block font-bold text-sm tracking-widest text-foreground">
            SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY •
          </span>
          <span className="inline-block font-bold text-sm tracking-widest text-foreground">
            SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY • SHIP WITH TIDY •
          </span>
        </div>
      </div>
    </div>
  );
};

export default Marquee;
