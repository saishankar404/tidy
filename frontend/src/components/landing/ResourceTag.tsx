interface ResourceTagProps {
  children: React.ReactNode;
  variant?: "default" | "accent";
}

const ResourceTag = ({ children, variant = "default" }: ResourceTagProps) => {
  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium tracking-wide ${
      variant === "accent" 
        ? "bg-neon text-foreground font-mono font-semibold" 
        : "bg-tag-bg text-muted-foreground"
    }`}>
      {children}
    </span>
  );
};

export default ResourceTag;
