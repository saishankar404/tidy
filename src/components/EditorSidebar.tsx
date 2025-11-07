import { useState, useMemo } from "react";
import { Search, FileCode, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

interface FileItem {
  name: string;
  type: "file";
  language: string;
}

interface EditorSidebarProps {
  files: FileItem[];
  currentFile: string;
  onFileSelect: (fileName: string) => void;
  onFileAdd: (fileName: string) => void;
  onFileRename: (oldName: string, newName: string) => void;
  onFileDelete: (fileName: string) => void;
}

export function EditorSidebar({
  files,
  currentFile,
  onFileSelect,
  onFileAdd,
  onFileRename,
  onFileDelete,
}: EditorSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileInput, setNewFileInput] = useState("");

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    return files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const handleRename = (oldName: string) => {
    if (newFileName.trim() && newFileName !== oldName) {
      onFileRename(oldName, newFileName.trim());
      toast.success(`Renamed to ${newFileName.trim()}`);
    }
    setRenamingFile(null);
    setNewFileName("");
  };

  const handleDelete = () => {
    if (deletingFile) {
      onFileDelete(deletingFile);
      toast.success(`Deleted ${deletingFile}`);
      setDeletingFile(null);
    }
  };

  const handleCreate = () => {
    if (newFileInput.trim()) {
      onFileAdd(newFileInput.trim());
      toast.success(`Created ${newFileInput.trim()}`);
      setNewFileInput("");
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="h-full bg-sidebar-bg border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-border animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border h-9 text-sm transition-all duration-200 focus:border-primary/50"
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
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 transition-all duration-200 hover:bg-muted"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* New file input */}
            {isCreating && (
              <div className="px-2 mb-1 animate-slide-in">
                <Input
                  autoFocus
                  value={newFileInput}
                  onChange={(e) => setNewFileInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewFileInput("");
                    }
                  }}
                  onBlur={handleCreate}
                  placeholder="filename.tsx"
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
                filteredFiles.map((file, index) => (
                  <div
                    key={file.name}
                    className="group relative animate-slide-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {renamingFile === file.name ? (
                      <Input
                        autoFocus
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(file.name);
                          if (e.key === "Escape") setRenamingFile(null);
                        }}
                        onBlur={() => handleRename(file.name)}
                        className="h-7 text-xs font-mono mx-2"
                      />
                    ) : (
                      <div
                        className={`
                          flex items-center gap-2 px-2 py-1.5 rounded-md 
                          text-sm transition-all duration-200 cursor-pointer
                          ${
                            currentFile === file.name
                              ? "bg-muted text-foreground"
                              : "text-foreground/80 hover:bg-muted/60"
                          }
                        `}
                        onClick={() => onFileSelect(file.name)}
                      >
                        <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-xs flex-1 truncate">
                          {file.name}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
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
                                setRenamingFile(file.name);
                                setNewFileName(file.name);
                              }}
                              className="text-xs cursor-pointer"
                            >
                              <Pencil className="mr-2 h-3 w-3" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFile(file.name);
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingFile} onOpenChange={() => setDeletingFile(null)}>
        <AlertDialogContent className="animate-fade-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-mono text-foreground">{deletingFile}</span>? This
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
