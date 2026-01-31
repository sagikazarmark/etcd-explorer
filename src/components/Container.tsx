import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <Card className="bg-card border border-border rounded-md">
      <CardContent className="p-0">
        <div className="divide-y divide-border">{children}</div>
      </CardContent>
    </Card>
  );
}

export function Row({
  children,
  key = "",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  key?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: because
    // biome-ignore lint/a11y/noStaticElementInteractions: because
    <div
      key={key}
      className={cn("px-4 py-4 hover:bg-muted/50 transition-colors", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
