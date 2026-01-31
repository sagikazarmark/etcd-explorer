import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  DashboardData,
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

// In-memory state for mutable operations
let users = [...mockUsers];
let roles = [...mockRoles];
let leases = [...mockLeases];
let alarms = [...mockAlarms];
let members = [...mockMembers];
let leaderId = mockClusterInfo.leader;

// ============ Cluster ============

export const getClusterInfo = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdClusterInfo> => {
    return { ...mockClusterInfo, leader: leaderId };
  }
);

export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    return {
      clusterInfo: { ...mockClusterInfo, leader: leaderId },
      authStatus: mockAuthStatus,
      users,
      roles,
      leases,
      alarms,
      members,
    };
  }
);

// ============ Keys ============

export const getKeys = createServerFn({ method: "GET" })
  .inputValidator(z.object({ path: z.string() }))
  .handler(async ({ data }): Promise<EtcdKey[]> => {
    const lookupPath = data.path ? data.path.replace(/\/$/, "") + "/" : "/";
    return mockKeys[lookupPath] || [];
  });

export const getKeyValue = createServerFn({ method: "GET" })
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }): Promise<{ value: string; key: EtcdKey | null }> => {
    const keyPath = data.key.replace(/\/$/, "");
    const value = mockKeyValues[keyPath] || "";

    // Find the key metadata
    const parts = keyPath.split("/");
    const keyName = parts.pop() || "";
    const parentPath = parts.length > 0 ? parts.join("/") + "/" : "/";
    const keysInParent = mockKeys[parentPath] || [];
    const keyMeta = keysInParent.find((k) => k.key === keyName) || null;

    return { value, key: keyMeta };
  });

export const putKey = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: z.string(), value: z.string() }))
  .handler(async (): Promise<{ success: boolean }> => {
    // Mock implementation - in reality would update etcd
    return { success: true };
  });

export const deleteKey = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: z.string() }))
  .handler(async (): Promise<{ success: boolean }> => {
    // Mock implementation - in reality would delete from etcd
    return { success: true };
  });

// ============ Auth - Users ============

export const getAuthStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdAuthStatus> => {
    return mockAuthStatus;
  }
);

export const getUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdUser[]> => {
    return users;
  }
);

export const addUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().min(1),
    password: z.string().min(1),
    roles: z.array(z.string()).default([])
  }))
  .handler(async ({ data }): Promise<EtcdUser> => {
    const newUser: EtcdUser = { name: data.name, roles: data.roles };
    users = [...users, newUser];
    return newUser;
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    users = users.filter((u) => u.name !== data.name);
    return { success: true };
  });

export const grantUserRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userName: z.string(), role: z.string() }))
  .handler(async ({ data }): Promise<EtcdUser | null> => {
    const userIndex = users.findIndex((u) => u.name === data.userName);
    if (userIndex === -1) return null;

    users = users.map((u, i) =>
      i === userIndex ? { ...u, roles: [...u.roles, data.role] } : u
    );
    return users[userIndex];
  });

export const revokeUserRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userName: z.string(), role: z.string() }))
  .handler(async ({ data }): Promise<EtcdUser | null> => {
    const userIndex = users.findIndex((u) => u.name === data.userName);
    if (userIndex === -1) return null;

    users = users.map((u, i) =>
      i === userIndex ? { ...u, roles: u.roles.filter((r) => r !== data.role) } : u
    );
    return users[userIndex];
  });

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userName: z.string(), password: z.string().min(1) }))
  .handler(async (): Promise<{ success: boolean }> => {
    // Mock implementation - in reality would update password in etcd
    return { success: true };
  });

// ============ Auth - Roles ============

export const getRoles = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdRole[]> => {
    return roles;
  }
);

export const addRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }): Promise<EtcdRole> => {
    const newRole: EtcdRole = { name: data.name, permissions: [] };
    roles = [...roles, newRole];
    return newRole;
  });

export const deleteRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    roles = roles.filter((r) => r.name !== data.name);
    return { success: true };
  });

export const grantPermission = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    roleName: z.string(),
    permission: z.object({
      permType: z.enum(["read", "write", "readwrite"]),
      key: z.string(),
      rangeEnd: z.string().optional(),
      prefix: z.boolean().optional(),
    })
  }))
  .handler(async ({ data }): Promise<EtcdRole | null> => {
    const roleIndex = roles.findIndex((r) => r.name === data.roleName);
    if (roleIndex === -1) return null;

    roles = roles.map((r, i) =>
      i === roleIndex
        ? { ...r, permissions: [...r.permissions, data.permission as EtcdRolePermission] }
        : r
    );
    return roles[roleIndex];
  });

export const revokePermission = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    roleName: z.string(),
    permission: z.object({
      permType: z.enum(["read", "write", "readwrite"]),
      key: z.string(),
    })
  }))
  .handler(async ({ data }): Promise<EtcdRole | null> => {
    const roleIndex = roles.findIndex((r) => r.name === data.roleName);
    if (roleIndex === -1) return null;

    roles = roles.map((r, i) =>
      i === roleIndex
        ? {
            ...r,
            permissions: r.permissions.filter(
              (p) => !(p.key === data.permission.key && p.permType === data.permission.permType)
            )
          }
        : r
    );
    return roles[roleIndex];
  });

// ============ Leases ============

export const getLeases = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdLease[]> => {
    return leases;
  }
);

export const revokeLease = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    leases = leases.filter((l) => l.id !== data.id);
    return { success: true };
  });

export const keepAliveLease = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<EtcdLease | null> => {
    const leaseIndex = leases.findIndex((l) => l.id === data.id);
    if (leaseIndex === -1) return null;

    // Reset TTL to granted TTL
    leases = leases.map((l, i) =>
      i === leaseIndex ? { ...l, ttl: l.grantedTtl } : l
    );
    return leases[leaseIndex];
  });

// ============ Cluster Members ============

export const getMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdMember[]> => {
    return members;
  }
);

export const updateMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberId: z.string(), peerURLs: z.array(z.string()) }))
  .handler(async ({ data }): Promise<EtcdMember | null> => {
    const memberIndex = members.findIndex((m) => m.id === data.memberId);
    if (memberIndex === -1) return null;

    members = members.map((m, i) =>
      i === memberIndex ? { ...m, peerURLs: data.peerURLs } : m
    );
    return members[memberIndex];
  });

export const promoteMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberId: z.string() }))
  .handler(async ({ data }): Promise<EtcdMember | null> => {
    const memberIndex = members.findIndex((m) => m.id === data.memberId);
    if (memberIndex === -1) return null;

    members = members.map((m, i) =>
      i === memberIndex ? { ...m, isLearner: false } : m
    );
    return members[memberIndex];
  });

export const removeMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberId: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    members = members.filter((m) => m.id !== data.memberId);
    return { success: true };
  });

export const moveLeader = createServerFn({ method: "POST" })
  .inputValidator(z.object({ targetMemberId: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean; newLeaderId: string }> => {
    leaderId = data.targetMemberId;
    return { success: true, newLeaderId: leaderId };
  });

// ============ Alarms ============

export const getAlarms = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdAlarm[]> => {
    return alarms;
  }
);

export const disarmAlarm = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberID: z.string(), alarm: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    alarms = alarms.filter(
      (a) => !(a.memberID === data.memberID && a.alarm === data.alarm)
    );
    return { success: true };
  });

export const disarmAllAlarms = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean }> => {
    alarms = [];
    return { success: true };
  }
);

// ============ Endpoints ============

export const getEndpointHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdEndpointHealth[]> => {
    return mockEndpointHealth;
  }
);

export const getEndpointStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdEndpointStatus[]> => {
    return mockEndpointStatus;
  }
);

// ============ Maintenance ============

export const defragment = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean; message: string }> => {
    // Mock implementation
    return { success: true, message: "Defragmentation completed" };
  }
);

export const compact = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean; message: string }> => {
    // Mock implementation
    return { success: true, message: "Compaction completed" };
  }
);

export const snapshot = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean; path: string }> => {
    // Mock implementation
    return { success: true, path: "/tmp/etcd-snapshot.db" };
  }
);
