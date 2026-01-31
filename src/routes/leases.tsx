import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { EtcdLayout } from "@/components/EtcdLayout";
import { Container, Row } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Plus, Clock, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { leasesQueryOptions } from "@/lib/queries/etcd";
import { revokeLease, keepAliveLease } from "@/lib/server/etcd";

export const Route = createFileRoute("/leases")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(leasesQueryOptions()),
  component: LeasesPage,
});

function LeasesPage() {
  const queryClient = useQueryClient();
  const { data: leases } = useSuspenseQuery(leasesQueryOptions());

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeLease({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast.success("Lease revoked");
    },
  });

  const keepAliveMutation = useMutation({
    mutationFn: (id: string) => keepAliveLease({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast.success("Lease refreshed");
    },
  });

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

  return (
    <EtcdLayout title="Leases">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Grant lease
          </Button>
        </div>

        {leases.length === 0 ? (
          <Empty className="bg-card border border-border rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>No active leases</EmptyTitle>
              <EmptyDescription>
                Grant a lease to attach time-to-live behavior to keys.
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => keepAliveMutation.mutate(lease.id)}
                      disabled={keepAliveMutation.isPending}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Keep-alive
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => revokeMutation.mutate(lease.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Row>
              );
            })}
          </Container>
        )}
      </div>
    </EtcdLayout>
  );
}
