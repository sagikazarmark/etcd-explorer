import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  Alarm,
  AuthStatus,
  ClusterInfo,
  ClusterMember,
  DashboardData,
  EndpointHealth,
  EndpointStatus,
  Key,
  Lease,
  Role,
  User,
} from "../types/etcd";
import { getClient } from "./etcd-client";

// ============ Cluster ============

export const getClusterInfo = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClusterInfo> => {
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
  .handler(async ({ data }): Promise<Key[]> => {
    return getClient().getKeys(data.path);
  });

export const getKeyValue = createServerFn({ method: "GET" })
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }): Promise<{ value: string; key: Key | null }> => {
    return getClient().getKeyValue(data.key);
  });

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
  async (): Promise<AuthStatus> => {
    return getClient().getAuthStatus();
  },
);

export const getUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<User[]> => {
    return getClient().getUsers();
  },
);

// ============ Auth - Roles ============

export const getRoles = createServerFn({ method: "GET" }).handler(
  async (): Promise<Role[]> => {
    return getClient().getRoles();
  },
);

// ============ Leases ============

export const getLeases = createServerFn({ method: "GET" }).handler(
  async (): Promise<Lease[]> => {
    return getClient().getLeases();
  },
);

// ============ Cluster Members ============

export const getMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClusterMember[]> => {
    return getClient().getMembers();
  },
);

// ============ Alarms ============

export const getAlarms = createServerFn({ method: "GET" }).handler(
  async (): Promise<Alarm[]> => {
    return getClient().getAlarms();
  },
);

// ============ Endpoints ============

export const getEndpointHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<EndpointHealth[]> => {
    return getClient().getEndpointHealth();
  },
);

export const getEndpointStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<EndpointStatus[]> => {
    return getClient().getEndpointStatus();
  },
);
