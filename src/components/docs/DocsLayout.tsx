import { DocsSidebar } from "./DocsSidebar";
import { TableOfContents } from "./TableOfContents";

interface DocsLayoutProps {
  children: React.ReactNode;
  showTOC?: boolean;
}

export function DocsLayout({ children, showTOC = true }: DocsLayoutProps) {
  return (
    <div className="min-h-screen">
      <DocsSidebar />

      <main className={`ml-64 ${showTOC ? 'mr-64' : ''}`}>
        <div className="mx-auto max-w-4xl px-8 py-12">
          <article className="prose">
            {children}
          </article>
        </div>
      </main>

      {showTOC && <TableOfContents />}
    </div>
  );
}