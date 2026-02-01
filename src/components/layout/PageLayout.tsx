import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  titleSuffix?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageLayout({
  children,
  title,
  titleSuffix,
  breadcrumbs,
}: PageLayoutProps) {
  return (
    <>
      <PageHeader
        title={title}
        titleSuffix={titleSuffix}
        breadcrumbs={breadcrumbs}
      />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </>
  );
}
