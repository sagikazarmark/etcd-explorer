import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { EtcdRole } from "@/lib/types/etcd";

interface AddUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roles: EtcdRole[];
	onUserAdded?: (user: {
		name: string;
		password: string;
		roles: string[];
	}) => void;
}

export function AddUserDialog({
	open,
	onOpenChange,
	roles,
	onUserAdded,
}: AddUserDialogProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!username.trim()) {
			toast.error("Username is required");
			return;
		}

		if (!password) {
			toast.error("Password is required");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		onUserAdded?.({ name: username.trim(), password, roles: selectedRoles });
		toast.success(`User "${username}" created successfully`);

		// Reset form
		setUsername("");
		setPassword("");
		setConfirmPassword("");
		setSelectedRoles([]);
		onOpenChange(false);
	};

	const toggleRole = (role: string) => {
		setSelectedRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add User</DialogTitle>
					<DialogDescription>
						Create a new etcd user with optional role assignments.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter username"
								autoComplete="off"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter password"
								autoComplete="new-password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm password"
								autoComplete="new-password"
							/>
						</div>
						<div className="space-y-2">
							<Label>Roles (optional)</Label>
							<div className="grid grid-cols-2 gap-2 pt-1">
								{roles.map((role) => (
									<div key={role.name} className="flex items-center space-x-2">
										<Checkbox
											id={`role-${role.name}`}
											checked={selectedRoles.includes(role.name)}
											onCheckedChange={() => toggleRole(role.name)}
										/>
										<label
											htmlFor={`role-${role.name}`}
											className="text-sm font-mono cursor-pointer"
										>
											{role.name}
										</label>
									</div>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Create User</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
