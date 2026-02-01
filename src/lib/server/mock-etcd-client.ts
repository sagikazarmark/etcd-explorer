import type {
  Alarm,
  AuthStatus,
  ClusterInfo,
  ClusterMember,
  EndpointHealth,
  EndpointStatus,
  Key,
  Lease,
  Role,
  User,
} from "../types/etcd";
import type { EtcdClientInterface } from "./etcd-client-interface";
import {
  mockAlarms,
  mockAuthStatus,
  mockClusterInfo,
  mockEndpointHealth,
  mockEndpointStatus,
  mockKeys,
  mockKeyValues,
  mockLeases,
  mockMembers,
  mockRoles,
  mockUsers,
} from "./mock-data";

/**
 * Mock etcd client implementation using in-memory data.
 * Used when ETCD_MOCK_MODE is enabled.
 */
export class MockEtcdClient implements EtcdClientInterface {
  // In-memory mutable state
  private users: User[] = [...mockUsers];
  private roles: Role[] = [...mockRoles];
  private leases: Lease[] = [...mockLeases];
  private alarms: Alarm[] = [...mockAlarms];
  private members: ClusterMember[] = [...mockMembers];
  private leaderId: string = mockClusterInfo.leader;

  // ============ Cluster ============

  async getClusterInfo(): Promise<ClusterInfo> {
    return { ...mockClusterInfo, leader: this.leaderId };
  }

  // ============ Keys ============

  async getKeys(path: string): Promise<Key[]> {
    const lookupPath = path ? path.replace(/\/$/, "") + "/" : "/";
    return mockKeys[lookupPath] || [];
  }

  async getKeyValue(key: string): Promise<{ value: string; key: Key | null }> {
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

  async getAuthStatus(): Promise<AuthStatus> {
    return mockAuthStatus;
  }

  async getUsers(): Promise<User[]> {
    return this.users;
  }

  // ============ Auth - Roles ============

  async getRoles(): Promise<Role[]> {
    return this.roles;
  }

  // ============ Leases ============

  async getLeases(): Promise<Lease[]> {
    return this.leases;
  }

  // ============ Members ============

  async getMembers(): Promise<ClusterMember[]> {
    return this.members;
  }

  async updateMember(
    memberId: string,
    peerURLs: string[],
  ): Promise<ClusterMember | null> {
    const memberIndex = this.members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) return null;

    this.members = this.members.map((m, i) =>
      i === memberIndex ? { ...m, peerURLs } : m,
    );
    return this.members[memberIndex];
  }

  async promoteMember(memberId: string): Promise<ClusterMember | null> {
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

  async getAlarms(): Promise<Alarm[]> {
    return this.alarms;
  }

  // ============ Endpoints ============

  async getEndpointHealth(): Promise<EndpointHealth[]> {
    return mockEndpointHealth;
  }

  async getEndpointStatus(): Promise<EndpointStatus[]> {
    return mockEndpointStatus;
  }
}
