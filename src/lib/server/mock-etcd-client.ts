import type { EtcdClientInterface } from "./etcd-client-interface";
import type {
  EtcdKey,
  EtcdClusterInfo,
  EtcdAuthStatus,
  EtcdUser,
  EtcdRole,
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

  // ============ Auth - Roles ============

  async getRoles(): Promise<EtcdRole[]> {
    return this.roles;
  }

  // ============ Leases ============

  async getLeases(): Promise<EtcdLease[]> {
    return this.leases;
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

  // ============ Endpoints ============

  async getEndpointHealth(): Promise<EtcdEndpointHealth[]> {
    return mockEndpointHealth;
  }

  async getEndpointStatus(): Promise<EtcdEndpointStatus[]> {
    return mockEndpointStatus;
  }
}
