import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { EtcdUser, EtcdRole } from "@/lib/types/etcd";

interface GrantRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: EtcdUser | null;
	roles: EtcdRole[];
	onRoleGranted: (userName: string, role: string) => void;
}

export function GrantRoleDialog({
	open,
	onOpenChange,
	user,
	roles,
	onRoleGranted,
}: GrantRoleDialogProps) {
	const [selectedRole, setSelectedRole] = useState<string>("");

	if (!user) return null;

	const availableRoles = roles.filter(
		(role) => !user.roles.includes(role.name),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedRole) return;

		onRoleGranted(user.name, selectedRole);
		toast.success("Role granted", {
			description: `Role "${selectedRole}" has been granted to user "${user.name}".`,
		});
		setSelectedRole("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Grant Role to {user.name}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Select Role</label>
						<Select value={selectedRole} onValueChange={setSelectedRole}>
							<SelectTrigger>
								<SelectValue placeholder="Choose a role..." />
							</SelectTrigger>
							<SelectContent>
								{availableRoles.length > 0 ? (
									availableRoles.map((role) => (
										<SelectItem key={role.name} value={role.name}>
											{role.name}
										</SelectItem>
									))
								) : (
									<SelectItem value="_none" disabled>
										No available roles
									</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!selectedRole}>
							Grant Role
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
