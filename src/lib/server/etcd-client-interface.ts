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
  addUser(name: string, password: string, roles: string[]): Promise<EtcdUser>;
  deleteUser(name: string): Promise<{ success: boolean }>;
  grantUserRole(userName: string, role: string): Promise<EtcdUser | null>;
  revokeUserRole(userName: string, role: string): Promise<EtcdUser | null>;
  changePassword(
    userName: string,
    password: string,
  ): Promise<{ success: boolean }>;

  // ============ Auth - Roles ============
  getRoles(): Promise<EtcdRole[]>;
  addRole(name: string): Promise<EtcdRole>;
  deleteRole(name: string): Promise<{ success: boolean }>;
  grantPermission(
    roleName: string,
    permission: EtcdRolePermission,
  ): Promise<EtcdRole | null>;
  revokePermission(
    roleName: string,
    permission: { permType: string; key: string },
  ): Promise<EtcdRole | null>;

  // ============ Leases ============
  getLeases(): Promise<EtcdLease[]>;
  revokeLease(id: string): Promise<{ success: boolean }>;
  keepAliveLease(id: string): Promise<EtcdLease | null>;

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
  disarmAlarm(memberID: string, alarm: string): Promise<{ success: boolean }>;
  disarmAllAlarms(): Promise<{ success: boolean }>;

  // ============ Endpoints ============
  getEndpointHealth(): Promise<EtcdEndpointHealth[]>;
  getEndpointStatus(): Promise<EtcdEndpointStatus[]>;

  // ============ Maintenance ============
  defragment(): Promise<{ success: boolean; message: string }>;
  compact(revision?: number): Promise<{ success: boolean; message: string }>;
  snapshot(): Promise<{ success: boolean; path: string }>;
}
