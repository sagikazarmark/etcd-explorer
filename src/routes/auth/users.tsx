import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { User, Users } from "lucide-react";

import { Container, Row } from "@/components/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageTitle } from "@/components/layout/PageTitle";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { authStatusQueryOptions, usersQueryOptions } from "@/lib/queries/etcd";

export const Route = createFileRoute("/auth/users")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(usersQueryOptions()),
      queryClient.ensureQueryData(authStatusQueryOptions()),
    ]);
  },
  component: UsersPage,
});

function UsersPage() {
  const { data: users } = useSuspenseQuery(usersQueryOptions());
  const { data: authStatus } = useSuspenseQuery(authStatusQueryOptions());

  return (
    <PageLayout
      title={
        <PageTitle title="Users">
          {!authStatus.enabled && (
            <Badge variant="secondary" className="text-xs">
              Auth disabled
            </Badge>
          )}
        </PageTitle>
      }
    >
      <div className="space-y-4">
        {users.length === 0 ? (
          <Empty className="bg-card border border-border rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No users</EmptyTitle>
              <EmptyDescription>
                No users have been created yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Container>
            {users.map((user) => (
              <Row
                key={user.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium font-mono">{user.name}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={role === "root" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Row>
            ))}
          </Container>
        )}
      </div>
    </PageLayout>
  );
}
