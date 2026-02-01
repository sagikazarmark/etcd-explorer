import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, getErrorMessage } from "@/components/ui/error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { alarmsQueryOptions, membersQueryOptions } from "@/lib/queries/etcd";

export const Route = createFileRoute("/cluster/alarms")({
  component: AlarmsPage,
});

function AlarmsPage() {
  const {
    data: alarms,
    isLoading: alarmsLoading,
    error: alarmsError,
    refetch: refetchAlarms,
  } = useQuery(alarmsQueryOptions());
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery(membersQueryOptions());

  const isLoading = alarmsLoading || membersLoading;
  const error = alarmsError || membersError;

  const handleRetry = () => {
    if (alarmsError) refetchAlarms();
    if (membersError) refetchMembers();
  };

  if (isLoading) {
    return (
      <PageLayout title="Alarms">
        <Loading message="Loading alarms..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Alarms">
        <ErrorDisplay
          message={getErrorMessage(error)}
          onRetry={handleRetry}
        />
      </PageLayout>
    );
  }

  if (!alarms || !members) {
    return null;
  }

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member?.name || memberId;
  };

  const getAlarmIcon = (alarm: string) => {
    switch (alarm) {
      case "NOSPACE":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "CORRUPT":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getAlarmDescription = (alarm: string) => {
    switch (alarm) {
      case "NOSPACE":
        return "Storage space exhausted. The cluster is in maintenance mode.";
      case "CORRUPT":
        return "Data corruption detected. Immediate action required.";
      default:
        return "";
    }
  };

  return (
    <PageLayout title="Alarms">
      <div className="space-y-4">
        <Card className="etcd-card">
          <CardContent className="p-0">
            {alarms.length === 0 ? (
              <Empty className="bg-card border border-border rounded-md">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckCircle />
                  </EmptyMedia>
                  <EmptyTitle>No active alarms</EmptyTitle>
                  <EmptyDescription>
                    The cluster is operating normally.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border">
                {alarms.map((alarm, idx) => (
                  <div
                    key={`${alarm.memberID}-${idx}`}
                    className="flex items-center px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      {getAlarmIcon(alarm.alarm)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alarm.alarm}</span>
                          <Badge variant="destructive" className="text-xs">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Member: {getMemberName(alarm.memberID)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getAlarmDescription(alarm.alarm)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
