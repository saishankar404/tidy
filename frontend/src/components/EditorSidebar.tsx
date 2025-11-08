import { useState, useMemo, useRef, useEffect } from "react";
import { Search, FileCode, Plus, MoreHorizontal, Pencil, Trash2, Folder, FolderOpen, ChevronRight, ChevronDown, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSettings } from "@/lib/SettingsContext";

export interface FileItem {
  name: string;
  type: "file" | "folder";
  language?: string;
  path: string;
  children?: FileItem[];
}

interface EditorSidebarProps {
  files: FileItem[];
  openFiles: string[];
  activeIndex: number;
  fileContents: Record<string, string>;
  onFileSelect: (filePath: string) => void;
  onFileAdd: (fileName: string, folderPath?: string) => void;
  onFolderAdd: (folderName: string, parentPath?: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
  onFileDelete: (filePath: string) => void;
  onFileMove: (fromPath: string, toPath: string) => void;
}

interface HoverPreview {
  content: string;
  position: { x: number; y: number };
  fileName: string;
}

export function EditorSidebar({
  files,
  openFiles = [],
  activeIndex = 0,
  fileContents,
  onFileSelect,
  onFileAdd,
  onFolderAdd,
  onFileRename,
  onFileDelete,
  onFileMove,
}: EditorSidebarProps) {
  const currentFile = openFiles[activeIndex] || "";
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemInput, setNewItemInput] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    
    const filterRecursive = (items: FileItem[]): FileItem[] => {
      return items.reduce((acc: FileItem[], item) => {
        if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          acc.push(item);
        } else if (item.type === "folder" && item.children) {
          const filteredChildren = filterRecursive(item.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren });
          }
        }
        return acc;
      }, []);
    };
    
    return filterRecursive(files);
  }, [files, searchQuery]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleRename = (oldPath: string) => {
    if (newItemName.trim() && newItemName !== oldPath.split('/').pop()) {
      const parentPath = oldPath.split('/').slice(0, -1).join('/');
      const newPath = parentPath ? `${parentPath}/${newItemName.trim()}` : newItemName.trim();
      onFileRename(oldPath, newPath);
      toast.success(`Renamed to ${newItemName.trim()}`);
    }
    setRenamingItem(null);
    setNewItemName("");
  };

  const handleDelete = () => {
    if (deletingItem) {
      onFileDelete(deletingItem);
      toast.success(`Deleted ${deletingItem.split('/').pop()}`);
      setDeletingItem(null);
    }
  };

  const handleCreate = (folderPath?: string) => {
    if (newItemInput.trim()) {
      onFileAdd(newItemInput.trim(), folderPath);
      toast.success(`Created ${newItemInput.trim()}`);
      setNewItemInput("");
      setIsCreating(false);
    }
  };

  const handleCreateFolder = (parentPath?: string) => {
    if (newItemInput.trim()) {
      onFolderAdd(newItemInput.trim(), parentPath);
      toast.success(`Created folder ${newItemInput.trim()}`);
      setNewItemInput("");
      setIsCreatingFolder(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemPath: string) => {
    setDraggedItem(itemPath);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemPath);
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (itemPath: string, isFolder: boolean) => {
    if (isFolder && draggedItem && draggedItem !== itemPath) {
      setDropTarget(itemPath);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string, isFolder: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    const sourcePath = e.dataTransfer.getData("text/plain");
    
    if (sourcePath && sourcePath !== targetPath && isFolder) {
      onFileMove(sourcePath, targetPath);
      toast.success("Moved successfully");
    }
    
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleMouseEnter = (e: React.MouseEvent, item: FileItem) => {
    if (item.type !== "file") return;

    console.log('Hover enter', item.name);

    const content = fileContents[item.path] || "";
    const targetElement = e.currentTarget; // Capture immediately

    // Clear any existing timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Set new timeout for hover delay (200ms for smooth experience)
    hoverTimeoutRef.current = setTimeout(() => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHoverPreview({
          content: content.slice(0, 300), // First 300 chars
          position: { x: rect.right + 12, y: rect.top },
          fileName: item.name,
        });
        console.log('Show preview', item.name);
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    // Clear hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Delay hiding preview slightly for smoother experience
    previewTimeoutRef.current = setTimeout(() => {
      setHoverPreview(null);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  const renderFileTree = (items: FileItem[], depth = 0, parentPath = "", visitedPaths = new Set<string>()): React.ReactNode => {
    // Prevent infinite recursion with depth limit and circular reference check
    if (depth > 20) {
      console.warn('Maximum folder depth exceeded, stopping recursion');
      return null;
    }

    return items.map((item, index) => {
      // Check for circular references
      if (visitedPaths.has(item.path)) {
        console.warn(`Circular reference detected for path: ${item.path}`);
        return null;
      }
      const newVisitedPaths = new Set(visitedPaths);
      newVisitedPaths.add(item.path);
      // Check for circular references
      if (visitedPaths.has(item.path)) {
        console.warn(`Circular reference detected for path: ${item.path}`);
        return null;
      }
      const isExpanded = expandedFolders.has(item.path);
      const isSelected = currentFile === item.path;
      const isDraggedOver = dropTarget === item.path;
      const isBeingDragged = draggedItem === item.path;

      return (
        <div
          key={item.path}
          className="animate-slide-in"
          style={{ 
            animationDelay: `${index * 15}ms`,
            paddingLeft: `${depth * 12}px`
          }}
        >
          {renamingItem === item.path ? (
            <Input
              autoFocus
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename(item.path);
                if (e.key === "Escape") setRenamingItem(null);
              }}
              onBlur={() => handleRename(item.path)}
              className="h-7 text-xs font-mono mx-2 my-0.5"
            />
          ) : (
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, item.path)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(item.path, item.type === "folder")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.path, item.type === "folder")}
              onMouseEnter={(e) => handleMouseEnter(e, item)}
              onMouseLeave={handleMouseLeave}
              className={`
                group relative flex items-center gap-2 px-2 py-1.5 rounded-lg mx-1
                text-sm transition-all duration-200 cursor-pointer
                ${isBeingDragged ? "opacity-50" : ""}
                ${isDraggedOver ? "bg-primary/10 border border-primary/30" : ""}
                ${
                  isSelected && item.type === "file"
                    ? "bg-muted text-foreground"
                    : "text-foreground/80 hover:bg-muted/50"
                }
              `}
              onClick={() => {
                if (item.type === "folder") {
                  toggleFolder(item.path);
                } else {
                  onFileSelect(item.path);
                }
              }}
            >
              {item.type === "folder" ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0 transition-transform duration-150" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 transition-transform duration-150" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <div className="w-3" />
                  <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </>
              )}
              
              <span className="font-mono text-xs flex-1 truncate">
                {item.name}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-background"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 animate-fade-in"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingItem(item.path);
                      setNewItemName(item.name);
                    }}
                    className="text-xs cursor-pointer"
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingItem(item.path);
                    }}
                    className="text-xs cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {item.type === "folder" && isExpanded && item.children && (
            <div className="overflow-hidden transition-all duration-200">
              {renderFileTree(item.children, depth + 1, item.path, newVisitedPaths)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className="h-full bg-sidebar-bg border-r border-border flex flex-col relative">
        {/* Search */}
        <div className="p-4 border-b border-border animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-150" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border h-9 text-sm transition-all duration-150 focus:border-primary/50"
            />
            {searchQuery && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {filteredFiles.length}
              </kbd>
            )}
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                Files
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 transition-all duration-150 hover:bg-muted"
                  onClick={() => setIsCreatingFolder(true)}
                  title="New folder"
                >
                  <FolderPlus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 transition-all duration-150 hover:bg-muted"
                  onClick={() => setIsCreating(true)}
                  title="New file"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* New file/folder input */}
            {(isCreating || isCreatingFolder) && (
              <div className="px-2 mb-1 animate-slide-in">
                <Input
                  autoFocus
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter") {
                       void (isCreatingFolder ? handleCreateFolder() : handleCreate());
                     }
                     if (e.key === "Escape") {
                       setIsCreating(false);
                       setIsCreatingFolder(false);
                       setNewItemInput("");
                     }
                   }}
                   onBlur={() => {
                     if (newItemInput.trim()) {
                       void (isCreatingFolder ? handleCreateFolder() : handleCreate());
                     } else {
                       setIsCreating(false);
                       setIsCreatingFolder(false);
                     }
                   }}
                  placeholder={isCreatingFolder ? "folder-name" : "filename.tsx"}
                  className="h-7 text-xs font-mono"
                />
              </div>
            )}

            {/* Files list */}
            <div className="space-y-0.5">
              {filteredFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center animate-fade-in">
                  {searchQuery ? "No files found" : "No files yet"}
                </p>
              ) : (
                renderFileTree(filteredFiles)
              )}
            </div>
          </div>
        </div>

        {/* Hover Preview */}
        {hoverPreview && (
          <div
            className="fixed z-50 bg-popover border border-border shadow-lg rounded-lg p-4 w-80 animate-preview-in pointer-events-none"
            style={{
              left: `${hoverPreview.position.x - 280}px`,
              top: `${hoverPreview.position.y}px`,
            }}
          >
            <div className="text-sm font-mono text-foreground mb-2 font-medium">
              {hoverPreview.fileName}
            </div>
            <div className="text-xs text-muted-foreground mb-3 space-y-1">
              <div>Size: {hoverPreview.content.length} chars</div>
              <div>Modified: Just now</div>
            </div>
            <pre className="text-[11px] font-mono text-foreground/90 overflow-hidden whitespace-pre-wrap leading-relaxed bg-muted/50 p-2 rounded">
              {hoverPreview.content.slice(0, 200)}
              {hoverPreview.content.length >= 200 && "..."}
            </pre>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent className="animate-fade-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingItem?.includes('/') ? 'item' : 'file'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-mono text-foreground">{deletingItem?.split('/').pop()}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}