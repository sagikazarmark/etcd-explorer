import { useState } from "react";
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
import { Plus, Shield, MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddRoleDialog } from "@/components/AddRoleDialog";
import { RolePermissionsDialog } from "@/components/RolePermissionsDialog";
import { GrantPermissionDialog } from "@/components/GrantPermissionDialog";
import { RevokePermissionDialog } from "@/components/RevokePermissionDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { rolesQueryOptions, authStatusQueryOptions } from "@/lib/queries/etcd";
import {
	addRole,
	deleteRole,
	grantPermission,
	revokePermission,
} from "@/lib/server/etcd";
import type { EtcdRole, EtcdRolePermission } from "@/lib/types/etcd";

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
	const queryClient = useQueryClient();
	const { data: roles } = useSuspenseQuery(rolesQueryOptions());
	const { data: authStatus } = useSuspenseQuery(authStatusQueryOptions());

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<EtcdRole | null>(null);
	const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
	const [grantPermDialogOpen, setGrantPermDialogOpen] = useState(false);
	const [revokePermDialogOpen, setRevokePermDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const addRoleMutation = useMutation({
		mutationFn: (data: { name: string }) => addRole({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
		},
	});

	const grantPermissionMutation = useMutation({
		mutationFn: (data: { roleName: string; permission: EtcdRolePermission }) =>
			grantPermission({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
		},
	});

	const revokePermissionMutation = useMutation({
		mutationFn: (data: { roleName: string; permission: EtcdRolePermission }) =>
			revokePermission({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
		},
	});

	const deleteRoleMutation = useMutation({
		mutationFn: (name: string) => deleteRole({ data: { name } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
		},
	});

	const handleRoleAdded = (newRole: { name: string }) => {
		addRoleMutation.mutate(newRole);
	};

	const handlePermissionGranted = (
		roleName: string,
		permission: EtcdRolePermission,
	) => {
		grantPermissionMutation.mutate({ roleName, permission });
		// Update selected role for the dialog
		setSelectedRole((prev) =>
			prev && prev.name === roleName
				? { ...prev, permissions: [...prev.permissions, permission] }
				: prev,
		);
	};

	const handlePermissionRevoked = (
		roleName: string,
		permission: EtcdRolePermission,
	) => {
		revokePermissionMutation.mutate({ roleName, permission });
		// Update selected role for the dialog
		setSelectedRole((prev) =>
			prev && prev.name === roleName
				? {
						...prev,
						permissions: prev.permissions.filter(
							(p) =>
								p.key !== permission.key || p.permType !== permission.permType,
						),
					}
				: prev,
		);
	};

	const handleDeleteRole = () => {
		if (!selectedRole) return;
		deleteRoleMutation.mutate(selectedRole.name, {
			onSuccess: () => {
				toast.success("Role deleted", {
					description: `Role "${selectedRole.name}" has been deleted.`,
				});
				setDeleteDialogOpen(false);
				setSelectedRole(null);
			},
		});
	};

	const openDialog = (
		role: EtcdRole,
		dialog: "permissions" | "grantPerm" | "revokePerm" | "delete",
	) => {
		setSelectedRole(role);
		switch (dialog) {
			case "permissions":
				setPermissionsDialogOpen(true);
				break;
			case "grantPerm":
				setGrantPermDialogOpen(true);
				break;
			case "revokePerm":
				setRevokePermDialogOpen(true);
				break;
			case "delete":
				setDeleteDialogOpen(true);
				break;
		}
	};

	return (
		<EtcdLayout
			title="Roles"
			breadcrumbs={[{ label: "Auth" }, { label: "Roles" }]}
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<p className="text-muted-foreground">
							Manage roles and their key permissions.
						</p>
						{!authStatus.enabled && (
							<Badge variant="secondary" className="text-xs">
								Auth disabled
							</Badge>
						)}
					</div>
					<Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
						<Plus className="h-4 w-4" />
						Add role
					</Button>
				</div>

				<Card className="etcd-card">
					<CardContent className="p-0">
						<div className="divide-y divide-border">
							{roles.map((role) => (
								<div
									key={role.name}
									className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
											<Shield className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-medium font-mono">
													{role.name}
												</span>
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
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => openDialog(role, "permissions")}
											>
												View permissions
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => openDialog(role, "grantPerm")}
											>
												Grant permission
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => openDialog(role, "revokePerm")}
											>
												Revoke permission
											</DropdownMenuItem>
											{role.name !== "root" && (
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => openDialog(role, "delete")}
												>
													Delete role
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<AddRoleDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				onRoleAdded={handleRoleAdded}
			/>
			<RolePermissionsDialog
				open={permissionsDialogOpen}
				onOpenChange={setPermissionsDialogOpen}
				role={selectedRole}
			/>
			<GrantPermissionDialog
				open={grantPermDialogOpen}
				onOpenChange={setGrantPermDialogOpen}
				role={selectedRole}
				onPermissionGranted={handlePermissionGranted}
			/>
			<RevokePermissionDialog
				open={revokePermDialogOpen}
				onOpenChange={setRevokePermDialogOpen}
				role={selectedRole}
				onPermissionRevoked={handlePermissionRevoked}
			/>
			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Delete Role"
				description={`Are you sure you want to delete role "${selectedRole?.name}"? This action cannot be undone.`}
				onConfirm={handleDeleteRole}
			/>
		</EtcdLayout>
	);
}
