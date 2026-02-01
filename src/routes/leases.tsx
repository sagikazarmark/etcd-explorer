import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Container, Row } from "@/components/Container";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, getErrorMessage } from "@/components/ui/error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Clock } from "lucide-react";
import { leasesQueryOptions } from "@/lib/queries/etcd";

export const Route = createFileRoute("/leases")({
  component: LeasesPage,
});

function LeasesPage() {
  const { data: leases, isLoading, error, refetch } = useQuery(leasesQueryOptions());

  const formatTtl = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  const getTtlPercentage = (ttl: number, grantedTtl: number) => {
    return (ttl / grantedTtl) * 100;
  };

  const getTtlColor = (percentage: number) => {
    if (percentage > 50) return "bg-success";
    if (percentage > 20) return "bg-warning";
    return "bg-destructive";
  };

  if (isLoading) {
    return (
      <PageLayout title="Leases">
        <Loading message="Loading leases..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Leases">
        <ErrorDisplay
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  if (!leases) {
    return null;
  }

  return (
    <PageLayout title="Leases">
      <div className="space-y-4">
        {leases.length === 0 ? (
          <Empty className="bg-card border border-border rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>No active leases</EmptyTitle>
              <EmptyDescription>
                Leases provide time-to-live behavior for keys.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Container>
            {leases.map((lease) => {
              const percentage = getTtlPercentage(lease.ttl, lease.grantedTtl);
              return (
                <Row key={lease.id} className="flex items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{lease.id}</span>
                      <Badge variant="secondary" className="text-xs">
                        TTL: {formatTtl(lease.ttl)} /{" "}
                        {formatTtl(lease.grantedTtl)}
                      </Badge>
                    </div>

                    {/* TTL progress bar */}
                    <div className="ml-7">
                      <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getTtlColor(percentage)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Associated keys */}
                    {lease.keys.length > 0 && (
                      <div className="ml-7 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          Keys:
                        </span>
                        {lease.keys.map((key) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {lease.keys.length === 0 && (
                      <p className="ml-7 text-xs text-muted-foreground">
                        No keys attached
                      </p>
                    )}
                  </div>
                </Row>
              );
            })}
          </Container>
        )}
      </div>
    </PageLayout>
  );
}
