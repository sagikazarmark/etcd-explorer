import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, getErrorMessage } from "@/components/ui/error";
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { dashboardQueryOptions } from "@/lib/queries/etcd";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery(dashboardQueryOptions());

  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <Loading message="Loading dashboard..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Dashboard">
        <ErrorDisplay
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  if (!data) {
    return null;
  }

  const { clusterInfo, authStatus, users, roles, leases, alarms, members } =
    data;

  const healthyMembers = members.length;

  return (
    <PageLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Key prefixes and Learn more */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="etcd-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="etcd-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{roles.length}</p>
                    <p className="text-xs text-muted-foreground">Roles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="etcd-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{leases.length}</p>
                    <p className="text-xs text-muted-foreground">Leases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="etcd-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{alarms.length}</p>
                    <p className="text-xs text-muted-foreground">Alarms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learn more card */}
          <Card className="etcd-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">
                Learn more
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Explore the features of etcd and learn best practices with the
                following documentation.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="https://etcd.io/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 etcd-link text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                etcd Documentation
              </a>
              <a
                href="https://etcd.io/docs/latest/op-guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 etcd-link text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Operations Guide
              </a>
              <a
                href="https://etcd.io/docs/latest/tutorials/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 etcd-link text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Tutorials
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Cluster info and Auth status */}
        <div className="space-y-6">
          {/* Authentication Status */}
          <Card className="etcd-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Authentication
                </CardTitle>
                <Badge
                  variant={authStatus.enabled ? "default" : "secondary"}
                  className="gap-1"
                >
                  {authStatus.enabled ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Disabled
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border">
              <ConfigRow
                label="Users"
                value={users.length.toString()}
                link="/auth/users"
              />
              <ConfigRow
                label="Roles"
                value={roles.length.toString()}
                link="/auth/roles"
              />
            </CardContent>
          </Card>

          {/* Cluster details card */}
          <Card className="etcd-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Cluster</CardTitle>
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {healthyMembers} healthy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border">
              <ConfigRow label="Cluster Name" value={clusterInfo.clusterName} />
              <ConfigRow label="Leader ID" value={clusterInfo.leader} />
              <ConfigRow label="Version" value={clusterInfo.version} />
              <ConfigRow
                label="Revision"
                value={clusterInfo.revision.toString()}
              />
              <ConfigRow
                label="Raft Term"
                value={clusterInfo.raftTerm.toString()}
              />
              <ConfigRow
                label="Members"
                value={members.length.toString()}
                link="/cluster/members"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

function ConfigRow({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {link ? (
        <Link to={link} className="text-sm font-mono etcd-link">
          {value}
        </Link>
      ) : (
        <span className="text-sm font-mono">{value}</span>
      )}
    </div>
  );
}
