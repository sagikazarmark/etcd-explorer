import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Server } from "lucide-react";
import { Container, Row } from "@/components/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, getErrorMessage } from "@/components/ui/error";
import {
  clusterInfoQueryOptions,
  membersQueryOptions,
} from "@/lib/queries/etcd";

export const Route = createFileRoute("/cluster/members")({
  component: MembersPage,
});

function MembersPage() {
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery(membersQueryOptions());
  const {
    data: clusterInfo,
    isLoading: clusterInfoLoading,
    error: clusterInfoError,
    refetch: refetchClusterInfo,
  } = useQuery(clusterInfoQueryOptions());

  const isLoading = membersLoading || clusterInfoLoading;
  const error = membersError || clusterInfoError;

  const handleRetry = () => {
    if (membersError) refetchMembers();
    if (clusterInfoError) refetchClusterInfo();
  };

  if (isLoading) {
    return (
      <PageLayout title="Members">
        <Loading message="Loading members..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Members">
        <ErrorDisplay
          message={getErrorMessage(error)}
          onRetry={handleRetry}
        />
      </PageLayout>
    );
  }

  if (!members || !clusterInfo) {
    return null;
  }

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
