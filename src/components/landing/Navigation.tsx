import { Button } from "@/components/landing/ui/button";

const Navigation = () => {
  return (
    <nav className="w-full flex justify-center pt-8">
      <div className="w-[1080px] bg-menu-bar rounded-lg px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="#" className="text-background font-bold text-sm tracking-wide hover:text-neon transition-colors">
            FEATURES
          </a>
          <a href="#" className="text-background font-bold text-sm tracking-wide hover:text-neon transition-colors">
            PRICING
          </a>
        </div>
        
        <div className="w-12 h-8 bg-background/10 rounded" />
        
        <div className="flex items-center gap-6">
          <a href="/docs" className="text-background font-bold text-sm tracking-wide hover:text-neon transition-colors">
            DOCS
          </a>
            <a href="/code">
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-dark-gray text-background hover:bg-dark-gray/80 rounded-md px-5 py-2 font-bold text-xs tracking-wide"
            >
              CODE NOW
            </Button>
            </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
