import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { EtcdLayout } from "@/components/EtcdLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { alarmsQueryOptions, membersQueryOptions } from "@/lib/queries/etcd";
import { disarmAlarm, disarmAllAlarms } from "@/lib/server/etcd";

export const Route = createFileRoute("/cluster/alarms")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(alarmsQueryOptions()),
      queryClient.ensureQueryData(membersQueryOptions()),
    ]);
  },
  component: AlarmsPage,
});

function AlarmsPage() {
  const queryClient = useQueryClient();
  const { data: alarms } = useSuspenseQuery(alarmsQueryOptions());
  const { data: members } = useSuspenseQuery(membersQueryOptions());

  const disarmMutation = useMutation({
    mutationFn: (data: { memberID: string; alarm: string }) =>
      disarmAlarm({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast.success("Alarm disarmed");
    },
  });

  const disarmAllMutation = useMutation({
    mutationFn: () => disarmAllAlarms(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast.success("All alarms disarmed");
    },
  });

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
    <EtcdLayout
      title="Alarms"
      breadcrumbs={[{ label: "Cluster" }, { label: "Alarms" }]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Cluster alarms indicate conditions requiring operator intervention.
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => disarmAllMutation.mutate()}
            disabled={disarmAllMutation.isPending || alarms.length === 0}
          >
            Disarm all
          </Button>
        </div>

        <Card className="etcd-card">
          <CardContent className="p-0">
            {alarms.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-success mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">No active alarms</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The cluster is operating normally.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alarms.map((alarm, idx) => (
                  <div
                    key={`${alarm.memberID}-${idx}`}
                    className="flex items-center justify-between px-4 py-4"
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        disarmMutation.mutate({
                          memberID: alarm.memberID,
                          alarm: alarm.alarm,
                        })
                      }
                      disabled={disarmMutation.isPending}
                    >
                      Disarm
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EtcdLayout>
  );
}
