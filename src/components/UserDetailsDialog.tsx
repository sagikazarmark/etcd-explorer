import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { EtcdUser } from "@/lib/types/etcd";

interface UserDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: EtcdUser | null;
}

export function UserDetailsDialog({
	open,
	onOpenChange,
	user,
}: UserDetailsDialogProps) {
	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						User Details
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<p className="text-sm text-muted-foreground">Username</p>
						<p className="font-mono font-medium">{user.name}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground mb-2">Assigned Roles</p>
						<div className="flex flex-wrap gap-2">
							{user.roles.length > 0 ? (
								user.roles.map((role) => (
									<Badge
										key={role}
										variant={role === "root" ? "default" : "secondary"}
									>
										{role}
									</Badge>
								))
							) : (
								<p className="text-sm text-muted-foreground italic">
									No roles assigned
								</p>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
