import type { ReactNode } from "react";
import { PageTitle } from "./PageTitle";

interface PageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  title?: string;
}

export function PageLayout({ children, header, title }: PageLayoutProps) {
  return (
    <>
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        {header ? header : title && <PageTitle title={title} />}
      </header>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </>
  );
}
