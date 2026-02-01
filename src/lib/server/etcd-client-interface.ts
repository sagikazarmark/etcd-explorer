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

/**
 * Unified interface for etcd client operations.
 * Implemented by both RealEtcdClient (using etcd3 library) and MockEtcdClient (using in-memory data).
 */
export interface EtcdClientInterface {
  // ============ Cluster ============
  getClusterInfo(): Promise<EtcdClusterInfo>;

  // ============ Keys ============
  getKeys(path: string): Promise<EtcdKey[]>;
  getKeyValue(key: string): Promise<{ value: string; key: EtcdKey | null }>;
  putKey(key: string, value: string): Promise<{ success: boolean }>;
  deleteKey(key: string): Promise<{ success: boolean }>;

  // ============ Auth - Users ============
  getAuthStatus(): Promise<EtcdAuthStatus>;
  getUsers(): Promise<EtcdUser[]>;

  // ============ Auth - Roles ============
  getRoles(): Promise<EtcdRole[]>;

  // ============ Leases ============
  getLeases(): Promise<EtcdLease[]>;

  // ============ Members ============
  getMembers(): Promise<EtcdMember[]>;
  updateMember(
    memberId: string,
    peerURLs: string[],
  ): Promise<EtcdMember | null>;
  promoteMember(memberId: string): Promise<EtcdMember | null>;
  removeMember(memberId: string): Promise<{ success: boolean }>;
  moveLeader(
    targetMemberId: string,
  ): Promise<{ success: boolean; newLeaderId: string }>;

  // ============ Alarms ============
  getAlarms(): Promise<EtcdAlarm[]>;

  // ============ Endpoints ============
  getEndpointHealth(): Promise<EtcdEndpointHealth[]>;
  getEndpointStatus(): Promise<EtcdEndpointStatus[]>;
}
