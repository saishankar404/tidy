import { Sparkles, Settings, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorHeaderProps {
  fileName: string;
}

export function EditorHeader({ fileName }: EditorHeaderProps) {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-medium text-foreground">
          {fileName || "Untitled"}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">Saved</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs">Publish</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
