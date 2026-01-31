import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
	EtcdKey,
	EtcdClusterInfo,
	EtcdAuthStatus,
	EtcdUser,
	EtcdRole,
	EtcdRolePermission,
	EtcdLease,
	EtcdAlarm,
	EtcdMember,
	EtcdEndpointHealth,
	EtcdEndpointStatus,
	DashboardData,
} from "../types/etcd";
import { getClient } from "./etcd-client";

// ============ Cluster ============

export const getClusterInfo = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdClusterInfo> => {
		return getClient().getClusterInfo();
	},
);

export const getDashboardData = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardData> => {
		// Fetch all dashboard data in parallel
		const [clusterInfo, authStatus, users, roles, leases, alarms, members] =
			await Promise.all([
				getClient().getClusterInfo(),
				getClient().getAuthStatus(),
				getClient().getUsers(),
				getClient().getRoles(),
				getClient().getLeases(),
				getClient().getAlarms(),
				getClient().getMembers(),
			]);

		return {
			clusterInfo,
			authStatus,
			users,
			roles,
			leases,
			alarms,
			members,
		};
	},
);

// ============ Keys ============

export const getKeys = createServerFn({ method: "GET" })
	.inputValidator(z.object({ path: z.string() }))
	.handler(async ({ data }): Promise<EtcdKey[]> => {
		return getClient().getKeys(data.path);
	});

export const getKeyValue = createServerFn({ method: "GET" })
	.inputValidator(z.object({ key: z.string() }))
	.handler(
		async ({ data }): Promise<{ value: string; key: EtcdKey | null }> => {
			return getClient().getKeyValue(data.key);
		},
	);

export const putKey = createServerFn({ method: "POST" })
	.inputValidator(z.object({ key: z.string(), value: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().putKey(data.key, data.value);
	});

export const deleteKey = createServerFn({ method: "POST" })
	.inputValidator(z.object({ key: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().deleteKey(data.key);
	});

// ============ Auth - Users ============

export const getAuthStatus = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdAuthStatus> => {
		return getClient().getAuthStatus();
	},
);

export const getUsers = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdUser[]> => {
		return getClient().getUsers();
	},
);

export const addUser = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			name: z.string().min(1),
			password: z.string().min(1),
			roles: z.array(z.string()).default([]),
		}),
	)
	.handler(async ({ data }): Promise<EtcdUser> => {
		return getClient().addUser(data.name, data.password, data.roles);
	});

export const deleteUser = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().deleteUser(data.name);
	});

export const grantUserRole = createServerFn({ method: "POST" })
	.inputValidator(z.object({ userName: z.string(), role: z.string() }))
	.handler(async ({ data }): Promise<EtcdUser | null> => {
		return getClient().grantUserRole(data.userName, data.role);
	});

export const revokeUserRole = createServerFn({ method: "POST" })
	.inputValidator(z.object({ userName: z.string(), role: z.string() }))
	.handler(async ({ data }): Promise<EtcdUser | null> => {
		return getClient().revokeUserRole(data.userName, data.role);
	});

export const changePassword = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ userName: z.string(), password: z.string().min(1) }),
	)
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().changePassword(data.userName, data.password);
	});

// ============ Auth - Roles ============

export const getRoles = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdRole[]> => {
		return getClient().getRoles();
	},
);

export const addRole = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }): Promise<EtcdRole> => {
		return getClient().addRole(data.name);
	});

export const deleteRole = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().deleteRole(data.name);
	});

export const grantPermission = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			roleName: z.string(),
			permission: z.object({
				permType: z.enum(["read", "write", "readwrite"]),
				key: z.string(),
				rangeEnd: z.string().optional(),
				prefix: z.boolean().optional(),
			}),
		}),
	)
	.handler(async ({ data }): Promise<EtcdRole | null> => {
		return getClient().grantPermission(
			data.roleName,
			data.permission as EtcdRolePermission,
		);
	});

export const revokePermission = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			roleName: z.string(),
			permission: z.object({
				permType: z.enum(["read", "write", "readwrite"]),
				key: z.string(),
			}),
		}),
	)
	.handler(async ({ data }): Promise<EtcdRole | null> => {
		return getClient().revokePermission(data.roleName, data.permission);
	});

// ============ Leases ============

export const getLeases = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdLease[]> => {
		return getClient().getLeases();
	},
);

export const revokeLease = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().revokeLease(data.id);
	});

export const keepAliveLease = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }): Promise<EtcdLease | null> => {
		return getClient().keepAliveLease(data.id);
	});

// ============ Cluster Members ============

export const getMembers = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdMember[]> => {
		return getClient().getMembers();
	},
);

export const updateMember = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ memberId: z.string(), peerURLs: z.array(z.string()) }),
	)
	.handler(async ({ data }): Promise<EtcdMember | null> => {
		return getClient().updateMember(data.memberId, data.peerURLs);
	});

export const promoteMember = createServerFn({ method: "POST" })
	.inputValidator(z.object({ memberId: z.string() }))
	.handler(async ({ data }): Promise<EtcdMember | null> => {
		return getClient().promoteMember(data.memberId);
	});

export const removeMember = createServerFn({ method: "POST" })
	.inputValidator(z.object({ memberId: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().removeMember(data.memberId);
	});

export const moveLeader = createServerFn({ method: "POST" })
	.inputValidator(z.object({ targetMemberId: z.string() }))
	.handler(
		async ({ data }): Promise<{ success: boolean; newLeaderId: string }> => {
			return getClient().moveLeader(data.targetMemberId);
		},
	);

// ============ Alarms ============

export const getAlarms = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdAlarm[]> => {
		return getClient().getAlarms();
	},
);

export const disarmAlarm = createServerFn({ method: "POST" })
	.inputValidator(z.object({ memberID: z.string(), alarm: z.string() }))
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		return getClient().disarmAlarm(data.memberID, data.alarm);
	});

export const disarmAllAlarms = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: boolean }> => {
		return getClient().disarmAllAlarms();
	},
);

// ============ Endpoints ============

export const getEndpointHealth = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdEndpointHealth[]> => {
		return getClient().getEndpointHealth();
	},
);

export const getEndpointStatus = createServerFn({ method: "GET" }).handler(
	async (): Promise<EtcdEndpointStatus[]> => {
		return getClient().getEndpointStatus();
	},
);

// ============ Maintenance ============

export const defragment = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: boolean; message: string }> => {
		return getClient().defragment();
	},
);

export const compact = createServerFn({ method: "POST" })
	.inputValidator(z.object({ revision: z.number().optional() }))
	.handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
		return getClient().compact(data.revision);
	});

export const snapshot = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: boolean; path: string }> => {
		return getClient().snapshot();
	},
);
