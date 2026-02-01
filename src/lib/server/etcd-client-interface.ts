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

/**
 * Unified interface for etcd client operations.
 * Implemented by both RealEtcdClient (using etcd3 library) and MockEtcdClient (using in-memory data).
 */
export interface EtcdClientInterface {
  // ============ Cluster ============
  getClusterInfo(): Promise<ClusterInfo>;

  // ============ Keys ============
  getKeys(path: string): Promise<Key[]>;
  getKeyValue(key: string): Promise<{ value: string; key: Key | null }>;
  putKey(key: string, value: string): Promise<{ success: boolean }>;
  deleteKey(key: string): Promise<{ success: boolean }>;

  // ============ Auth - Users ============
  getAuthStatus(): Promise<AuthStatus>;
  getUsers(): Promise<User[]>;

  // ============ Auth - Roles ============
  getRoles(): Promise<Role[]>;

  // ============ Leases ============
  getLeases(): Promise<Lease[]>;

  // ============ Members ============
  getMembers(): Promise<ClusterMember[]>;
  updateMember(
    memberId: string,
    peerURLs: string[],
  ): Promise<ClusterMember | null>;
  promoteMember(memberId: string): Promise<ClusterMember | null>;
  removeMember(memberId: string): Promise<{ success: boolean }>;
  moveLeader(
    targetMemberId: string,
  ): Promise<{ success: boolean; newLeaderId: string }>;

  // ============ Alarms ============
  getAlarms(): Promise<Alarm[]>;

  // ============ Endpoints ============
  getEndpointHealth(): Promise<EndpointHealth[]>;
  getEndpointStatus(): Promise<EndpointStatus[]>;
}
