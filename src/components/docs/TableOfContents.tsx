import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const headingElements = article.querySelectorAll("h2, h3");
    const items: TOCItem[] = Array.from(headingElements).map((heading) => ({
      id: heading.id,
      title: heading.textContent || "",
      level: parseInt(heading.tagName[1]),
    }));

    setHeadings(items);

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    headingElements.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className="fixed top-16 right-0 z-20 h-[calc(100vh-4rem)] w-64 border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ScrollArea className="h-full py-6 px-4">
        <div className="space-y-2">
          <h4 className="mb-4 text-sm font-semibold">On This Page</h4>
          <ul className="space-y-2 text-sm">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={heading.level === 3 ? "ml-4" : ""}
              >
                <a
                  href={`#${heading.id}`}
                  className={`block py-1 transition-colors hover:text-primary ${
                    activeId === heading.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  {heading.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </aside>
  );
}