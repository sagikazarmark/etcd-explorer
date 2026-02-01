import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Container, Row } from "@/components/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageTitle } from "@/components/layout/PageTitle";
import { RolePermissionsDialog } from "@/components/RolePermissionsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { authStatusQueryOptions, rolesQueryOptions } from "@/lib/queries/etcd";
import type { Role } from "@/lib/types/etcd";

export const Route = createFileRoute("/auth/roles")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(rolesQueryOptions()),
      queryClient.ensureQueryData(authStatusQueryOptions()),
    ]);
  },
  component: RolesPage,
});

function RolesPage() {
  const { data: roles } = useSuspenseQuery(rolesQueryOptions());
  const { data: authStatus } = useSuspenseQuery(authStatusQueryOptions());

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  };

  return (
    <PageLayout
      header={
        <PageTitle title="Roles">
          {!authStatus.enabled && (
            <Badge variant="secondary" className="text-xs">
              Auth disabled
            </Badge>
          )}
        </PageTitle>
      }
    >
      <div className="space-y-4">
        {roles.length === 0 ? (
          <Empty className="bg-card border border-border rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Shield />
              </EmptyMedia>
              <EmptyTitle>No roles</EmptyTitle>
              <EmptyDescription>
                No roles have been created yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Container>
            {roles.map((role) => (
              <Row
                key={role.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono">{role.name}</span>
                      {role.name === "root" && (
                        <Badge variant="default" className="text-xs">
                          Built-in
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {role.name === "root"
                        ? "Full cluster access"
                        : role.permissions.length === 0
                          ? "No permissions"
                          : `${role.permissions.length} permission${role.permissions.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPermissionsDialog(role)}
                >
                  View permissions
                </Button>
              </Row>
            ))}
          </Container>
        )}
      </div>

      <RolePermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        role={selectedRole}
      />
    </PageLayout>
  );
}
