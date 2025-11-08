import { useState } from "react";
import { X, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TabBarProps {
  openFiles: string[];
  activeIndex: number;
  modifiedFiles: Set<string>;
  onTabClick: (index: number) => void;
  onTabClose: (index: number) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
}

export function TabBar({
  openFiles,
  activeIndex,
  modifiedFiles,
  onTabClick,
  onTabClose,
  onTabReorder,
}: TabBarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onTabReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="h-10 bg-card border-b border-border flex items-center overflow-x-auto animate-fade-in">
      {openFiles.map((filePath, index) => {
        const isActive = index === activeIndex;
        const isModified = modifiedFiles.has(filePath);
        const isDragged = draggedIndex === index;
        const isDragOver = dragOverIndex === index;
        const fileName = filePath.split('/').pop() || filePath;

        return (
          <div
            key={filePath}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2 min-w-0 max-w-48 border-r border-border cursor-pointer transition-all duration-200 hover:bg-muted/50",
              isActive && "bg-muted text-foreground",
              isDragged && "opacity-50",
              isDragOver && "bg-primary/10"
            )}
            onClick={() => onTabClick(index)}
          >
            <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-sm truncate flex-1">
              {fileName}
            </span>
            {isModified && (
              <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0" />
            )}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(index);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}