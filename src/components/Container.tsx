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
    <div
      key={key}
      className={cn("px-4 py-3 hover:bg-muted/50 transition-colors", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
