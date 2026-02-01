export interface Key {
  key: string;
  isDirectory: boolean;
  revision?: number;
  createRevision?: number;
  modRevision?: number;
  value?: string;
}

export interface ClusterInfo {
  version: string;
  clusterName: string;
  endpoints: string[];
  leader: string;
  revision: number;
  raftTerm: number;
}

export interface AuthStatus {
  enabled: boolean;
}

export interface User {
  name: string;
  roles: string[];
}

export interface RolePermission {
  permType: "read" | "write" | "readwrite";
  key: string;
  rangeEnd?: string;
  prefix?: boolean;
}

export interface Role {
  name: string;
  permissions: RolePermission[];
}

export interface Lease {
  id: string;
  ttl: number;
  grantedTtl: number;
  keys: string[];
}

export type AlarmType = "NOSPACE" | "CORRUPT" | "NONE";

export interface Alarm {
  memberID: string;
  alarm: AlarmType;
}

export interface ClusterMember {
  id: string;
  name: string;
  peerURLs: string[];
  clientURLs: string[];
  isLearner: boolean;
}

export interface EndpointHealth {
  endpoint: string;
  health: boolean;
  took: string;
}

export interface EndpointStatus {
  endpoint: string;
  dbSize: number;
  dbSizeInUse: number;
  leader: string;
  raftIndex: number;
  raftTerm: number;
  raftAppliedIndex: number;
  version: string;
}

export interface DashboardData {
  clusterInfo: ClusterInfo;
  authStatus: AuthStatus;
  users: User[];
  roles: Role[];
  leases: Lease[];
  alarms: Alarm[];
  members: ClusterMember[];
}
