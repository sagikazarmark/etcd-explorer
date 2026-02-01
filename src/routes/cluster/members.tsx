import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Server } from "lucide-react";
import { Container, Row } from "@/components/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import {
  clusterInfoQueryOptions,
  membersQueryOptions,
} from "@/lib/queries/etcd";

export const Route = createFileRoute("/cluster/members")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(membersQueryOptions()),
      queryClient.ensureQueryData(clusterInfoQueryOptions()),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: members } = useSuspenseQuery(membersQueryOptions());
  const { data: clusterInfo } = useSuspenseQuery(clusterInfoQueryOptions());

  return (
    <PageLayout title="Members">
      <div className="space-y-4">
        <Container>
          {members.map((member) => {
            const isLeader = member.id === clusterInfo.leader;
            return (
              <Row key={member.id} className="flex items-start gap-3">
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
                    {isLeader && <Badge className="text-xs">Leader</Badge>}
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
              </Row>
            );
          })}
        </Container>
      </div>
    </PageLayout>
  );
}
