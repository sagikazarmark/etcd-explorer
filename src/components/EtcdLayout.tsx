import type { ReactNode } from "react";
import { EtcdSidebar } from "./EtcdSidebar";
import { EtcdHeader } from "./EtcdHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface EtcdLayoutProps {
	children: ReactNode;
	title?: string;
	breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function EtcdLayout({ children, title, breadcrumbs }: EtcdLayoutProps) {
	return (
		<SidebarProvider>
			<EtcdSidebar />
			<SidebarInset>
				<EtcdHeader title={title} breadcrumbs={breadcrumbs} />
				<main className="flex-1 overflow-auto p-6">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
