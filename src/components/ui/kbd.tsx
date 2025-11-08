import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono font-medium",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}