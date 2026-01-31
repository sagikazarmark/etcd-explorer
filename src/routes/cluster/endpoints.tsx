import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EtcdLayout } from "@/components/EtcdLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Crown } from "lucide-react";
import {
	endpointHealthQueryOptions,
	endpointStatusQueryOptions,
	clusterInfoQueryOptions,
} from "@/lib/queries/etcd";

export const Route = createFileRoute("/cluster/endpoints")({
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(endpointHealthQueryOptions()),
			queryClient.ensureQueryData(endpointStatusQueryOptions()),
			queryClient.ensureQueryData(clusterInfoQueryOptions()),
		]);
	},
	component: EndpointsPage,
});

function EndpointsPage() {
	const { data: endpointHealth } = useSuspenseQuery(
		endpointHealthQueryOptions(),
	);
	const { data: endpointStatus } = useSuspenseQuery(
		endpointStatusQueryOptions(),
	);
	const { data: clusterInfo } = useSuspenseQuery(clusterInfoQueryOptions());

	const formatBytes = (bytes: number) => {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	return (
		<EtcdLayout
			title="Endpoints"
			breadcrumbs={[{ label: "Cluster" }, { label: "Endpoints" }]}
		>
			<div className="space-y-6">
				<p className="text-muted-foreground">
					Endpoint health and status for all cluster members.
				</p>

				{/* Health Check Section */}
				<Card className="etcd-card">
					<CardHeader className="pb-4">
						<CardTitle className="text-lg">Health</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="divide-y divide-border">
							{endpointHealth.map((ep) => (
								<div
									key={ep.endpoint}
									className="flex items-center justify-between px-6 py-3"
								>
									<div className="flex items-center gap-3">
										{ep.health ? (
											<CheckCircle className="h-5 w-5 text-success" />
										) : (
											<XCircle className="h-5 w-5 text-destructive" />
										)}
										<span className="font-mono text-sm">{ep.endpoint}</span>
									</div>
									<div className="flex items-center gap-4">
										<Badge
											variant={ep.health ? "default" : "destructive"}
											className="text-xs"
										>
											{ep.health ? "Healthy" : "Unhealthy"}
										</Badge>
										<span className="text-sm text-muted-foreground font-mono">
											{ep.took}
										</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Status Section */}
				<Card className="etcd-card">
					<CardHeader className="pb-4">
						<CardTitle className="text-lg">Status</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border">
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Endpoint
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											DB Size
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											In Use
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Raft Index
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Raft Term
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Version
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{endpointStatus.map((ep) => {
										const isThisLeader = ep.leader === clusterInfo.leader;

										return (
											<tr key={ep.endpoint} className="hover:bg-muted/50">
												<td className="px-6 py-3">
													<div className="flex items-center gap-2">
														<span className="font-mono text-sm">
															{ep.endpoint}
														</span>
														{isThisLeader &&
															ep.endpoint.includes("10.0.1.1") && (
																<Crown className="h-4 w-4 text-primary" />
															)}
													</div>
												</td>
												<td className="px-6 py-3 font-mono text-sm">
													{formatBytes(ep.dbSize)}
												</td>
												<td className="px-6 py-3 font-mono text-sm">
													{formatBytes(ep.dbSizeInUse)}
												</td>
												<td className="px-6 py-3 font-mono text-sm">
													{ep.raftIndex}
												</td>
												<td className="px-6 py-3 font-mono text-sm">
													{ep.raftTerm}
												</td>
												<td className="px-6 py-3 font-mono text-sm">
													{ep.version}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</EtcdLayout>
	);
}
