export interface EtcdKey {
	key: string;
	isDirectory: boolean;
	revision?: number;
	createRevision?: number;
	modRevision?: number;
	value?: string;
}

export interface EtcdClusterInfo {
	version: string;
	clusterName: string;
	endpoints: string[];
	leader: string;
	revision: number;
	raftTerm: number;
}

export interface EtcdAuthStatus {
	enabled: boolean;
}

export interface EtcdUser {
	name: string;
	roles: string[];
}

export interface EtcdRolePermission {
	permType: "read" | "write" | "readwrite";
	key: string;
	rangeEnd?: string;
	prefix?: boolean;
}

export interface EtcdRole {
	name: string;
	permissions: EtcdRolePermission[];
}

export interface EtcdLease {
	id: string;
	ttl: number;
	grantedTtl: number;
	keys: string[];
}

export type EtcdAlarmType = "NOSPACE" | "CORRUPT" | "NONE";

export interface EtcdAlarm {
	memberID: string;
	alarm: EtcdAlarmType;
}

export interface EtcdMember {
	id: string;
	name: string;
	peerURLs: string[];
	clientURLs: string[];
	isLearner: boolean;
}

export interface EtcdEndpointHealth {
	endpoint: string;
	health: boolean;
	took: string;
}

export interface EtcdEndpointStatus {
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
	clusterInfo: EtcdClusterInfo;
	authStatus: EtcdAuthStatus;
	users: EtcdUser[];
	roles: EtcdRole[];
	leases: EtcdLease[];
	alarms: EtcdAlarm[];
	members: EtcdMember[];
}
