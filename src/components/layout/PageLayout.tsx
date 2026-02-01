import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { PageTitle } from "./PageTitle";

interface PageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageLayout({
  children,
  header,
  title,
  breadcrumbs,
}: PageLayoutProps) {
  return (
    <>
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm mb-2">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-primary hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Header/Title */}
        {header ? header : title && <PageTitle title={title} />}
      </header>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </>
  );
}
