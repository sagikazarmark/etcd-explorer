import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Crown, XCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, getErrorMessage } from "@/components/ui/error";
import {
  clusterInfoQueryOptions,
  endpointHealthQueryOptions,
  endpointStatusQueryOptions,
} from "@/lib/queries/etcd";

export const Route = createFileRoute("/cluster/endpoints")({
  component: EndpointsPage,
});

function EndpointsPage() {
  const {
    data: endpointHealth,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery(endpointHealthQueryOptions());
  const {
    data: endpointStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery(endpointStatusQueryOptions());
  const {
    data: clusterInfo,
    isLoading: clusterInfoLoading,
    error: clusterInfoError,
    refetch: refetchClusterInfo,
  } = useQuery(clusterInfoQueryOptions());

  const isLoading = healthLoading || statusLoading || clusterInfoLoading;
  const error = healthError || statusError || clusterInfoError;

  const handleRetry = () => {
    if (healthError) refetchHealth();
    if (statusError) refetchStatus();
    if (clusterInfoError) refetchClusterInfo();
  };

  if (isLoading) {
    return (
      <PageLayout title="Endpoints">
        <Loading message="Loading endpoints..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Endpoints">
        <ErrorDisplay
          message={getErrorMessage(error)}
          onRetry={handleRetry}
        />
      </PageLayout>
    );
  }

  if (!endpointHealth || !endpointStatus || !clusterInfo) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <PageLayout title="Endpoints">
      <div className="space-y-6">
        {/* Health Check Section */}
        <Card className="etcd-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Health</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {endpointHealth.map((ep) => (
                <div
                  key={ep.endpoint}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    {ep.health ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-mono text-sm">{ep.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={ep.health ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {ep.health ? "Healthy" : "Unhealthy"}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-mono">
                      {ep.took}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Section */}
        <Card className="etcd-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      DB Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      In Use
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Raft Index
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Raft Term
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Version
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {endpointStatus.map((ep) => {
                    const isThisLeader = ep.leader === clusterInfo.leader;

                    return (
                      <tr key={ep.endpoint} className="hover:bg-muted/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {ep.endpoint}
                            </span>
                            {isThisLeader &&
                              ep.endpoint.includes("10.0.1.1") && (
                                <Crown className="h-4 w-4 text-primary" />
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-mono text-sm">
                          {formatBytes(ep.dbSize)}
                        </td>
                        <td className="px-6 py-3 font-mono text-sm">
                          {formatBytes(ep.dbSizeInUse)}
                        </td>
                        <td className="px-6 py-3 font-mono text-sm">
                          {ep.raftIndex}
                        </td>
                        <td className="px-6 py-3 font-mono text-sm">
                          {ep.raftTerm}
                        </td>
                        <td className="px-6 py-3 font-mono text-sm">
                          {ep.version}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
