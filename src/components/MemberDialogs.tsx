import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { EtcdMember } from "@/lib/types/etcd";

interface UpdateMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: EtcdMember | null;
	onMemberUpdated: (memberId: string, peerURLs: string[]) => void;
}

export function UpdateMemberDialog({
	open,
	onOpenChange,
	member,
	onMemberUpdated,
}: UpdateMemberDialogProps) {
	const [peerURLs, setPeerURLs] = useState("");

	if (!member) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const urls = peerURLs
			.split(",")
			.map((u) => u.trim())
			.filter(Boolean);

		if (urls.length === 0) {
			toast.error("Invalid URLs", {
				description: "Please provide at least one peer URL.",
			});
			return;
		}

		onMemberUpdated(member.id, urls);
		toast.success("Member updated", {
			description: `Peer URLs for "${member.name}" have been updated.`,
		});
		setPeerURLs("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Member: {member.name}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="peerURLs">Peer URLs</Label>
						<Input
							id="peerURLs"
							value={peerURLs}
							onChange={(e) => setPeerURLs(e.target.value)}
							placeholder={member.peerURLs.join(", ")}
							className="font-mono"
						/>
						<p className="text-xs text-muted-foreground">
							Comma-separated list of peer URLs
						</p>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Update Member</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface PromoteMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: EtcdMember | null;
	onConfirm: () => void;
}

export function PromoteMemberDialog({
	open,
	onOpenChange,
	member,
	onConfirm,
}: PromoteMemberDialogProps) {
	if (!member) return null;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Promote to Voter</AlertDialogTitle>
					<AlertDialogDescription>
						Promote learner "{member.name}" to a voting member? This will allow
						it to participate in leader elections.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>Promote</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

interface MoveLeadershipDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: EtcdMember | null;
	onConfirm: () => void;
}

export function MoveLeadershipDialog({
	open,
	onOpenChange,
	member,
	onConfirm,
}: MoveLeadershipDialogProps) {
	if (!member) return null;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Transfer Leadership</AlertDialogTitle>
					<AlertDialogDescription>
						Transfer cluster leadership from "{member.name}" to another member?
						The new leader will be selected automatically.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>Transfer</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

interface RemoveMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: EtcdMember | null;
	onConfirm: () => void;
}

export function RemoveMemberDialog({
	open,
	onOpenChange,
	member,
	onConfirm,
}: RemoveMemberDialogProps) {
	if (!member) return null;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove Member</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to remove "{member.name}" from the cluster?
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Remove
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
