import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HardDrive,
  Trash2,
  Download,
  ArrowDownToLine,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { endpointStatusQueryOptions } from "@/lib/queries/etcd";
import { defragment, compact, snapshot } from "@/lib/server/etcd";

export const Route = createFileRoute("/maintenance")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(endpointStatusQueryOptions()),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { data: endpointStatus } = useSuspenseQuery(
    endpointStatusQueryOptions(),
  );

  const defragMutation = useMutation({
    mutationFn: () => defragment(),
    onSuccess: () => {
      toast.success("Defragmentation complete");
    },
  });

  const compactMutation = useMutation({
    mutationFn: () => compact({ data: {} }),
    onSuccess: () => {
      toast.success("Compaction complete");
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: () => snapshot(),
    onSuccess: () => {
      toast.success("Snapshot saved");
    },
  });

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const totalDbSize = endpointStatus[0]?.dbSize || 0;
  const totalDbSizeInUse = endpointStatus[0]?.dbSizeInUse || 0;
  const fragmentation = totalDbSize - totalDbSizeInUse;
  const fragmentationPercent =
    totalDbSize > 0 ? ((fragmentation / totalDbSize) * 100).toFixed(1) : "0";

  return (
    <PageLayout title="Maintenance">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Periodic maintenance operations to keep the cluster healthy and
          performant.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Defragmentation */}
          <Card className="etcd-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <HardDrive className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Defragmentation</CardTitle>
                  <CardDescription>
                    Reclaim storage space from internal fragmentation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DB Size</span>
                <span className="font-mono">{formatBytes(totalDbSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In Use</span>
                <span className="font-mono">
                  {formatBytes(totalDbSizeInUse)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fragmentation</span>
                <span className="font-mono">
                  {formatBytes(fragmentation)} ({fragmentationPercent}%)
                </span>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => defragMutation.mutate()}
                disabled={defragMutation.isPending}
              >
                <HardDrive className="h-4 w-4" />
                Run Defrag
              </Button>
              <p className="text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                This operation blocks reads and writes during execution.
              </p>
            </CardContent>
          </Card>

          {/* Compaction */}
          <Card className="etcd-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Trash2 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Compaction</CardTitle>
                  <CardDescription>
                    Discard superseded key revisions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Compaction frees up storage by removing old key revisions. After
                compaction, historical revisions become inaccessible.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => compactMutation.mutate()}
                  disabled={compactMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Compact
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Snapshot */}
          <Card className="etcd-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Download className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Snapshot</CardTitle>
                  <CardDescription>
                    Create a backup of the current state
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Save a point-in-time snapshot of the etcd backend database for
                backup and disaster recovery purposes.
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => snapshotMutation.mutate()}
                disabled={snapshotMutation.isPending}
              >
                <Download className="h-4 w-4" />
                Save Snapshot
              </Button>
            </CardContent>
          </Card>

          {/* Move Leader */}
          <Card className="etcd-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <ArrowDownToLine className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Move Leader</CardTitle>
                  <CardDescription>
                    Transfer leadership to another member
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Transfer Raft leadership to a different cluster member. Useful
                for maintenance operations on the current leader.
              </p>
              <Button variant="outline" className="w-full gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Move Leader
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
