import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Crown } from "lucide-react";
import {
  membersQueryOptions,
  clusterInfoQueryOptions,
} from "@/lib/queries/etcd";

export const Route = createFileRoute("/cluster/members")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(membersQueryOptions()),
      queryClient.ensureQueryData(clusterInfoQueryOptions()),
    ]);
  },
  component: MembersPage,
});

function MembersPage() {
  const { data: members } = useSuspenseQuery(membersQueryOptions());
  const { data: clusterInfo } = useSuspenseQuery(clusterInfoQueryOptions());

  return (
    <PageLayout title="Members">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          etcd cluster members. The leader handles all client write requests.
        </p>

        <Card className="etcd-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {members.map((member) => {
                const isLeader = member.id === clusterInfo.leader;
                return (
                  <div
                    key={member.id}
                    className="px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isLeader
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isLeader ? (
                          <Crown className="h-5 w-5" />
                        ) : (
                          <Server className="h-5 w-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {isLeader && (
                            <Badge className="text-xs">Leader</Badge>
                          )}
                          {member.isLearner && (
                            <Badge variant="secondary" className="text-xs">
                              Learner
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">
                          ID: {member.id}
                        </p>
                        <div className="flex gap-6 mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Client URLs
                            </p>
                            {member.clientURLs.map((url) => (
                              <p key={url} className="text-sm font-mono">
                                {url}
                              </p>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Peer URLs
                            </p>
                            {member.peerURLs.map((url) => (
                              <p key={url} className="text-sm font-mono">
                                {url}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
