import { Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSheet } from "@/components/SettingsSheet";

interface EditorHeaderProps {
  fileName: string;
  onOpenCodeReviewer: () => void;
}

export function EditorHeader({ fileName, onOpenCodeReviewer }: EditorHeaderProps) {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-medium text-foreground">
          {fileName || "Untitled"}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">Saved</span>
      </div>

       <div className="flex items-center gap-2">
         <Button
           variant="ghost"
           size="icon"
           onClick={onOpenCodeReviewer}
           className="h-8 w-8 transition-all duration-200 hover:bg-muted"
         >
           <Bot className="h-4 w-4" />
         </Button>
         <SettingsSheet />
       </div>
    </header>
  );
}
