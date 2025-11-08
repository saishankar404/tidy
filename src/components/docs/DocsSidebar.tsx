import { NavLink } from "@/components/docs/NavLink";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Rocket, Zap, Code, Settings, BookOpen } from "lucide-react";

const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Overview", href: "/docs", icon: FileText },
      { title: "Installation", href: "/docs/getting-started", icon: Rocket },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "AI Code Analysis", href: "/docs/features/ai-analysis", icon: Zap },
      { title: "Code Editor", href: "/docs/features/editor", icon: Code },
      { title: "Chat Assistant", href: "/docs/features/chat", icon: BookOpen },
      { title: "Snippet Library", href: "/docs/features/snippets", icon: FileText },
    ],
  },
  {
    title: "Technical",
    items: [
      { title: "Architecture", href: "/docs/technical/architecture", icon: Code },
      { title: "API Reference", href: "/docs/technical/api", icon: Settings },
      { title: "Configuration", href: "/docs/technical/configuration", icon: Settings },
    ],
  },
  {
    title: "Developer",
    items: [
      { title: "Project Structure", href: "/docs/developer/structure", icon: FileText },
      { title: "Development", href: "/docs/developer/development", icon: Code },
    ],
  },
];

export function DocsSidebar() {
  return (
    <aside className="fixed top-0 left-0 z-30 h-screen w-64 border-r border-doc-sidebar-border bg-doc-sidebar-bg">
      <div className="flex h-16 items-center border-b border-doc-sidebar-border px-6">
        <h2 className="text-lg font-semibold">TIDY Editor</h2>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)] py-6 px-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        end={item.href === "/docs"}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-doc-nav-hover"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 border-t border-doc-sidebar-border pt-6 px-2">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://replit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Replit
            </a>
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}