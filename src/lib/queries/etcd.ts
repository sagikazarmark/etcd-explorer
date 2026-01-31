import { queryOptions } from "@tanstack/react-query";
import {
	getClusterInfo,
	getDashboardData,
	getKeys,
	getKeyValue,
	getAuthStatus,
	getUsers,
	getRoles,
	getLeases,
	getMembers,
	getAlarms,
	getEndpointHealth,
	getEndpointStatus,
} from "../server/etcd";

export const clusterInfoQueryOptions = () =>
	queryOptions({
		queryKey: ["clusterInfo"],
		queryFn: () => getClusterInfo(),
	});

export const dashboardQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard"],
		queryFn: () => getDashboardData(),
	});

export const keysQueryOptions = (path: string) =>
	queryOptions({
		queryKey: ["keys", path],
		queryFn: () => getKeys({ data: { path } }),
	});

export const keyValueQueryOptions = (key: string) =>
	queryOptions({
		queryKey: ["keyValue", key],
		queryFn: () => getKeyValue({ data: { key } }),
	});

export const authStatusQueryOptions = () =>
	queryOptions({
		queryKey: ["authStatus"],
		queryFn: () => getAuthStatus(),
	});

export const usersQueryOptions = () =>
	queryOptions({
		queryKey: ["users"],
		queryFn: () => getUsers(),
	});

export const rolesQueryOptions = () =>
	queryOptions({
		queryKey: ["roles"],
		queryFn: () => getRoles(),
	});

export const leasesQueryOptions = () =>
	queryOptions({
		queryKey: ["leases"],
		queryFn: () => getLeases(),
	});

export const membersQueryOptions = () =>
	queryOptions({
		queryKey: ["members"],
		queryFn: () => getMembers(),
	});

export const alarmsQueryOptions = () =>
	queryOptions({
		queryKey: ["alarms"],
		queryFn: () => getAlarms(),
	});

export const endpointHealthQueryOptions = () =>
	queryOptions({
		queryKey: ["endpointHealth"],
		queryFn: () => getEndpointHealth(),
	});

export const endpointStatusQueryOptions = () =>
	queryOptions({
		queryKey: ["endpointStatus"],
		queryFn: () => getEndpointStatus(),
	});
