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
import { Plus, Server, Crown, MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	UpdateMemberDialog,
	PromoteMemberDialog,
	MoveLeadershipDialog,
	RemoveMemberDialog,
} from "@/components/MemberDialogs";
import { toast } from "sonner";
import {
	membersQueryOptions,
	clusterInfoQueryOptions,
} from "@/lib/queries/etcd";
import {
	updateMember,
	promoteMember,
	removeMember,
	moveLeader,
} from "@/lib/server/etcd";
import type { EtcdMember } from "@/lib/types/etcd";

export const Route = createFileRoute("/cluster/members")({
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(membersQueryOptions()),
			queryClient.ensureQueryData(clusterInfoQueryOptions()),
		]);
	},
	component: MembersPage,
});

function MembersPage() {
	const queryClient = useQueryClient();
	const { data: members } = useSuspenseQuery(membersQueryOptions());
	const { data: clusterInfo } = useSuspenseQuery(clusterInfoQueryOptions());

	const [selectedMember, setSelectedMember] = useState<EtcdMember | null>(null);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
	const [moveLeaderDialogOpen, setMoveLeaderDialogOpen] = useState(false);
	const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

	const updateMemberMutation = useMutation({
		mutationFn: (data: { memberId: string; peerURLs: string[] }) =>
			updateMember({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
		},
	});

	const promoteMemberMutation = useMutation({
		mutationFn: (memberId: string) => promoteMember({ data: { memberId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: (memberId: string) => removeMember({ data: { memberId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
		},
	});

	const moveLeaderMutation = useMutation({
		mutationFn: (targetMemberId: string) =>
			moveLeader({ data: { targetMemberId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
			queryClient.invalidateQueries({ queryKey: ["clusterInfo"] });
		},
	});

	const handleMemberUpdated = (memberId: string, peerURLs: string[]) => {
		updateMemberMutation.mutate({ memberId, peerURLs });
	};

	const handlePromote = () => {
		if (!selectedMember) return;
		promoteMemberMutation.mutate(selectedMember.id, {
			onSuccess: () => {
				toast.success("Member promoted", {
					description: `"${selectedMember.name}" has been promoted to a voting member.`,
				});
				setPromoteDialogOpen(false);
				setSelectedMember(null);
			},
		});
	};

	const handleMoveLeadership = () => {
		if (!selectedMember) return;
		const otherMembers = members.filter(
			(m) => m.id !== selectedMember.id && !m.isLearner,
		);
		if (otherMembers.length > 0) {
			moveLeaderMutation.mutate(otherMembers[0].id, {
				onSuccess: () => {
					toast.success("Leadership transferred", {
						description: `Leadership moved from "${selectedMember.name}" to "${otherMembers[0].name}".`,
					});
					setMoveLeaderDialogOpen(false);
					setSelectedMember(null);
				},
			});
		}
	};

	const handleRemove = () => {
		if (!selectedMember) return;
		removeMemberMutation.mutate(selectedMember.id, {
			onSuccess: () => {
				toast.success("Member removed", {
					description: `"${selectedMember.name}" has been removed from the cluster.`,
				});
				setRemoveDialogOpen(false);
				setSelectedMember(null);
			},
		});
	};

	const openDialog = (
		member: EtcdMember,
		dialog: "update" | "promote" | "moveLeader" | "remove",
	) => {
		setSelectedMember(member);
		switch (dialog) {
			case "update":
				setUpdateDialogOpen(true);
				break;
			case "promote":
				setPromoteDialogOpen(true);
				break;
			case "moveLeader":
				setMoveLeaderDialogOpen(true);
				break;
			case "remove":
				setRemoveDialogOpen(true);
				break;
		}
	};

	return (
		<EtcdLayout
			title="Members"
			breadcrumbs={[{ label: "Cluster" }, { label: "Members" }]}
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground">
						etcd cluster members. The leader handles all client write requests.
					</p>
					<Button className="gap-2">
						<Plus className="h-4 w-4" />
						Add member
					</Button>
				</div>

				<Card className="etcd-card">
					<CardContent className="p-0">
						<div className="divide-y divide-border">
							{members.map((member) => {
								const isLeader = member.id === clusterInfo.leader;
								return (
									<div
										key={member.id}
										className="px-4 py-4 hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3">
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
														{isLeader && (
															<Badge className="text-xs">Leader</Badge>
														)}
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
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => openDialog(member, "update")}
													>
														Update member
													</DropdownMenuItem>
													{member.isLearner && (
														<DropdownMenuItem
															onClick={() => openDialog(member, "promote")}
														>
															Promote to voter
														</DropdownMenuItem>
													)}
													{isLeader && (
														<DropdownMenuItem
															onClick={() => openDialog(member, "moveLeader")}
														>
															Move leadership
														</DropdownMenuItem>
													)}
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => openDialog(member, "remove")}
													>
														Remove member
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			</div>

			<UpdateMemberDialog
				open={updateDialogOpen}
				onOpenChange={setUpdateDialogOpen}
				member={selectedMember}
				onMemberUpdated={handleMemberUpdated}
			/>
			<PromoteMemberDialog
				open={promoteDialogOpen}
				onOpenChange={setPromoteDialogOpen}
				member={selectedMember}
				onConfirm={handlePromote}
			/>
			<MoveLeadershipDialog
				open={moveLeaderDialogOpen}
				onOpenChange={setMoveLeaderDialogOpen}
				member={selectedMember}
				onConfirm={handleMoveLeadership}
			/>
			<RemoveMemberDialog
				open={removeDialogOpen}
				onOpenChange={setRemoveDialogOpen}
				member={selectedMember}
				onConfirm={handleRemove}
			/>
		</EtcdLayout>
	);
}
