import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { EtcdRole, EtcdRolePermission } from "@/lib/types/etcd";

interface GrantPermissionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	role: EtcdRole | null;
	onPermissionGranted: (
		roleName: string,
		permission: EtcdRolePermission,
	) => void;
}

export function GrantPermissionDialog({
	open,
	onOpenChange,
	role,
	onPermissionGranted,
}: GrantPermissionDialogProps) {
	const [key, setKey] = useState("");
	const [isRange, setIsRange] = useState(false);
	const [rangeEnd, setRangeEnd] = useState("");
	const [permType, setPermType] = useState<"read" | "write" | "readwrite">(
		"read",
	);

	if (!role) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!key) return;

		const permission: EtcdRolePermission = {
			key,
			permType,
			...(isRange && rangeEnd ? { rangeEnd } : {}),
		};

		onPermissionGranted(role.name, permission);
		toast.success("Permission granted", {
			description: `Permission on "${key}" added to role "${role.name}".`,
		});

		setKey("");
		setRangeEnd("");
		setIsRange(false);
		setPermType("read");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Grant Permission to {role.name}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="key">Key</Label>
						<Input
							id="key"
							value={key}
							onChange={(e) => setKey(e.target.value)}
							placeholder="/config/"
							className="font-mono"
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="isRange"
							checked={isRange}
							onCheckedChange={(checked) => setIsRange(checked === true)}
						/>
						<Label htmlFor="isRange" className="text-sm font-normal">
							Key range (prefix)
						</Label>
					</div>

					{isRange && (
						<div className="space-y-2">
							<Label htmlFor="rangeEnd">Range End</Label>
							<Input
								id="rangeEnd"
								value={rangeEnd}
								onChange={(e) => setRangeEnd(e.target.value)}
								placeholder="/config0"
								className="font-mono"
							/>
							<p className="text-xs text-muted-foreground">
								Use key + "0" for prefix match (e.g., /config/ → /config0)
							</p>
						</div>
					)}

					<div className="space-y-2">
						<Label>Permission Type</Label>
						<Select
							value={permType}
							onValueChange={(v) => setPermType(v as typeof permType)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="read">Read</SelectItem>
								<SelectItem value="write">Write</SelectItem>
								<SelectItem value="readwrite">Read & Write</SelectItem>
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
						<Button type="submit" disabled={!key}>
							Grant Permission
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
