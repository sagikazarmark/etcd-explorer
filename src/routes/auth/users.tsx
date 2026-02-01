import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddUserDialog } from "@/components/AddUserDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { Container, Row } from "@/components/Container";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PageLayout } from "@/components/layout/PageLayout";
import { GrantRoleDialog } from "@/components/GrantRoleDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  authStatusQueryOptions,
  rolesQueryOptions,
  usersQueryOptions,
} from "@/lib/queries/etcd";
import { addUser, deleteUser, grantUserRole } from "@/lib/server/etcd";
import type { EtcdUser } from "@/lib/types/etcd";

export const Route = createFileRoute("/auth/users")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(usersQueryOptions()),
      queryClient.ensureQueryData(rolesQueryOptions()),
      queryClient.ensureQueryData(authStatusQueryOptions()),
    ]);
  },
  component: UsersPage,
});

function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users } = useSuspenseQuery(usersQueryOptions());
  const { data: roles } = useSuspenseQuery(rolesQueryOptions());
  const { data: authStatus } = useSuspenseQuery(authStatusQueryOptions());

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EtcdUser | null>(null);
  const [grantRoleDialogOpen, setGrantRoleDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const addUserMutation = useMutation({
    mutationFn: (data: { name: string; password: string; roles: string[] }) =>
      addUser({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const grantRoleMutation = useMutation({
    mutationFn: (data: { userName: string; role: string }) =>
      grantUserRole({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (name: string) => deleteUser({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleUserAdded = (newUser: {
    name: string;
    password: string;
    roles: string[];
  }) => {
    addUserMutation.mutate(newUser);
  };

  const handleRoleGranted = (userName: string, role: string) => {
    grantRoleMutation.mutate({ userName, role });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.name, {
      onSuccess: () => {
        toast.success("User deleted", {
          description: `User "${selectedUser.name}" has been deleted.`,
        });
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
    });
  };

  const openDialog = (
    user: EtcdUser,
    dialog: "grantRole" | "changePassword" | "delete",
  ) => {
    setSelectedUser(user);
    switch (dialog) {
      case "grantRole":
        setGrantRoleDialogOpen(true);
        break;
      case "changePassword":
        setChangePasswordDialogOpen(true);
        break;
      case "delete":
        setDeleteDialogOpen(true);
        break;
    }
  };

  return (
    <PageLayout
      title="Users"
      titleSuffix={
        !authStatus.enabled && (
          <Badge variant="secondary" className="text-xs">
            Auth disabled
          </Badge>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        </div>

        {users.length === 0 ? (
          <Empty className="bg-card border border-border rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No users</EmptyTitle>
              <EmptyDescription>
                Add a user to manage authentication and access control.
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => openDialog(user, "grantRole")}
                    >
                      Grant role
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDialog(user, "changePassword")}
                    >
                      Change password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => openDialog(user, "delete")}
                    >
                      Delete user
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Row>
            ))}
          </Container>
        )}
      </div>

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onUserAdded={handleUserAdded}
        roles={roles}
      />
      <GrantRoleDialog
        open={grantRoleDialogOpen}
        onOpenChange={setGrantRoleDialogOpen}
        user={selectedUser}
        onRoleGranted={handleRoleGranted}
        roles={roles}
      />
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen}
        user={selectedUser}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete user "${selectedUser?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
      />
    </PageLayout>
  );
}
