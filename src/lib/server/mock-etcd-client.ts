import type { EtcdClientInterface } from "./etcd-client-interface";
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
} from "../types/etcd";
import {
	mockKeys,
	mockKeyValues,
	mockClusterInfo,
	mockAuthStatus,
	mockUsers,
	mockRoles,
	mockLeases,
	mockAlarms,
	mockMembers,
	mockEndpointHealth,
	mockEndpointStatus,
} from "./mock-data";

/**
 * Mock etcd client implementation using in-memory data.
 * Used when ETCD_MOCK_MODE is enabled.
 */
export class MockEtcdClient implements EtcdClientInterface {
	// In-memory mutable state
	private users: EtcdUser[] = [...mockUsers];
	private roles: EtcdRole[] = [...mockRoles];
	private leases: EtcdLease[] = [...mockLeases];
	private alarms: EtcdAlarm[] = [...mockAlarms];
	private members: EtcdMember[] = [...mockMembers];
	private leaderId: string = mockClusterInfo.leader;

	// ============ Cluster ============

	async getClusterInfo(): Promise<EtcdClusterInfo> {
		return { ...mockClusterInfo, leader: this.leaderId };
	}

	// ============ Keys ============

	async getKeys(path: string): Promise<EtcdKey[]> {
		const lookupPath = path ? path.replace(/\/$/, "") + "/" : "/";
		return mockKeys[lookupPath] || [];
	}

	async getKeyValue(
		key: string,
	): Promise<{ value: string; key: EtcdKey | null }> {
		const keyPath = key.replace(/\/$/, "");
		const value = mockKeyValues[keyPath] || "";

		// Find the key metadata
		const parts = keyPath.split("/");
		const keyName = parts.pop() || "";
		const parentPath = parts.length > 0 ? parts.join("/") + "/" : "/";
		const keysInParent = mockKeys[parentPath] || [];
		const keyMeta = keysInParent.find((k) => k.key === keyName) || null;

		return { value, key: keyMeta };
	}

	async putKey(_key: string, _value: string): Promise<{ success: boolean }> {
		return { success: true };
	}

	async deleteKey(_key: string): Promise<{ success: boolean }> {
		return { success: true };
	}

	// ============ Auth - Users ============

	async getAuthStatus(): Promise<EtcdAuthStatus> {
		return mockAuthStatus;
	}

	async getUsers(): Promise<EtcdUser[]> {
		return this.users;
	}

	async addUser(
		name: string,
		_password: string,
		roles: string[],
	): Promise<EtcdUser> {
		const newUser: EtcdUser = { name, roles };
		this.users = [...this.users, newUser];
		return newUser;
	}

	async deleteUser(name: string): Promise<{ success: boolean }> {
		this.users = this.users.filter((u) => u.name !== name);
		return { success: true };
	}

	async grantUserRole(userName: string, role: string): Promise<EtcdUser | null> {
		const userIndex = this.users.findIndex((u) => u.name === userName);
		if (userIndex === -1) return null;

		this.users = this.users.map((u, i) =>
			i === userIndex ? { ...u, roles: [...u.roles, role] } : u,
		);
		return this.users[userIndex];
	}

	async revokeUserRole(
		userName: string,
		role: string,
	): Promise<EtcdUser | null> {
		const userIndex = this.users.findIndex((u) => u.name === userName);
		if (userIndex === -1) return null;

		this.users = this.users.map((u, i) =>
			i === userIndex ? { ...u, roles: u.roles.filter((r) => r !== role) } : u,
		);
		return this.users[userIndex];
	}

	async changePassword(
		_userName: string,
		_password: string,
	): Promise<{ success: boolean }> {
		return { success: true };
	}

	// ============ Auth - Roles ============

	async getRoles(): Promise<EtcdRole[]> {
		return this.roles;
	}

	async addRole(name: string): Promise<EtcdRole> {
		const newRole: EtcdRole = { name, permissions: [] };
		this.roles = [...this.roles, newRole];
		return newRole;
	}

	async deleteRole(name: string): Promise<{ success: boolean }> {
		this.roles = this.roles.filter((r) => r.name !== name);
		return { success: true };
	}

	async grantPermission(
		roleName: string,
		permission: EtcdRolePermission,
	): Promise<EtcdRole | null> {
		const roleIndex = this.roles.findIndex((r) => r.name === roleName);
		if (roleIndex === -1) return null;

		this.roles = this.roles.map((r, i) =>
			i === roleIndex
				? {
						...r,
						permissions: [...r.permissions, permission],
					}
				: r,
		);
		return this.roles[roleIndex];
	}

	async revokePermission(
		roleName: string,
		permission: { permType: string; key: string },
	): Promise<EtcdRole | null> {
		const roleIndex = this.roles.findIndex((r) => r.name === roleName);
		if (roleIndex === -1) return null;

		this.roles = this.roles.map((r, i) =>
			i === roleIndex
				? {
						...r,
						permissions: r.permissions.filter(
							(p) =>
								!(
									p.key === permission.key && p.permType === permission.permType
								),
						),
					}
				: r,
		);
		return this.roles[roleIndex];
	}

	// ============ Leases ============

	async getLeases(): Promise<EtcdLease[]> {
		return this.leases;
	}

	async revokeLease(id: string): Promise<{ success: boolean }> {
		this.leases = this.leases.filter((l) => l.id !== id);
		return { success: true };
	}

	async keepAliveLease(id: string): Promise<EtcdLease | null> {
		const leaseIndex = this.leases.findIndex((l) => l.id === id);
		if (leaseIndex === -1) return null;

		this.leases = this.leases.map((l, i) =>
			i === leaseIndex ? { ...l, ttl: l.grantedTtl } : l,
		);
		return this.leases[leaseIndex];
	}

	// ============ Members ============

	async getMembers(): Promise<EtcdMember[]> {
		return this.members;
	}

	async updateMember(
		memberId: string,
		peerURLs: string[],
	): Promise<EtcdMember | null> {
		const memberIndex = this.members.findIndex((m) => m.id === memberId);
		if (memberIndex === -1) return null;

		this.members = this.members.map((m, i) =>
			i === memberIndex ? { ...m, peerURLs } : m,
		);
		return this.members[memberIndex];
	}

	async promoteMember(memberId: string): Promise<EtcdMember | null> {
		const memberIndex = this.members.findIndex((m) => m.id === memberId);
		if (memberIndex === -1) return null;

		this.members = this.members.map((m, i) =>
			i === memberIndex ? { ...m, isLearner: false } : m,
		);
		return this.members[memberIndex];
	}

	async removeMember(memberId: string): Promise<{ success: boolean }> {
		this.members = this.members.filter((m) => m.id !== memberId);
		return { success: true };
	}

	async moveLeader(
		targetMemberId: string,
	): Promise<{ success: boolean; newLeaderId: string }> {
		this.leaderId = targetMemberId;
		return { success: true, newLeaderId: this.leaderId };
	}

	// ============ Alarms ============

	async getAlarms(): Promise<EtcdAlarm[]> {
		return this.alarms;
	}

	async disarmAlarm(
		memberID: string,
		alarm: string,
	): Promise<{ success: boolean }> {
		this.alarms = this.alarms.filter(
			(a) => !(a.memberID === memberID && a.alarm === alarm),
		);
		return { success: true };
	}

	async disarmAllAlarms(): Promise<{ success: boolean }> {
		this.alarms = [];
		return { success: true };
	}

	// ============ Endpoints ============

	async getEndpointHealth(): Promise<EtcdEndpointHealth[]> {
		return mockEndpointHealth;
	}

	async getEndpointStatus(): Promise<EtcdEndpointStatus[]> {
		return mockEndpointStatus;
	}

	// ============ Maintenance ============

	async defragment(): Promise<{ success: boolean; message: string }> {
		return { success: true, message: "Defragmentation completed" };
	}

	async compact(
		_revision?: number,
	): Promise<{ success: boolean; message: string }> {
		return { success: true, message: "Compaction completed" };
	}

	async snapshot(): Promise<{ success: boolean; path: string }> {
		return { success: true, path: "/tmp/etcd-snapshot.db" };
	}
}
