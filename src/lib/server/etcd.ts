import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Permission } from "etcd3";
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
import { getEtcdClient, isMockMode, getEndpoints } from "./etcd-client";
import { withErrorHandling } from "./etcd-errors";

// In-memory state for mutable operations (mock mode only)
let users = [...mockUsers];
let roles = [...mockRoles];
let leases = [...mockLeases];
let alarms = [...mockAlarms];
let members = [...mockMembers];
let leaderId = mockClusterInfo.leader;

// ============ Helper Functions ============

function memberIdToHex(id: string | number | bigint): string {
  if (typeof id === "bigint") {
    return id.toString(16);
  }
  if (typeof id === "number") {
    return id.toString(16);
  }
  // Already a string (possibly hex or decimal)
  if (id.startsWith("0x")) {
    return id.slice(2);
  }
  // Try to parse as decimal and convert to hex
  try {
    return BigInt(id).toString(16);
  } catch {
    return id;
  }
}

// ============ Cluster ============

export const getClusterInfo = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdClusterInfo> => {
    if (isMockMode()) {
      return { ...mockClusterInfo, leader: leaderId };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const endpoints = getEndpoints();

      // Get status from the first available endpoint
      const status = await client.maintenance.status();

      return {
        version: status.version,
        clusterName: "etcd-cluster", // etcd3 doesn't expose cluster name directly
        endpoints,
        leader: memberIdToHex(status.leader),
        revision: Number(status.header.revision),
        raftTerm: Number(status.raftTerm),
      };
    });
  }
);

export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    if (isMockMode()) {
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

    // Fetch all dashboard data from real etcd
    const [clusterInfo, authStatus, usersData, rolesData, leasesData, alarmsData, membersData] =
      await Promise.all([
        getClusterInfo(),
        getAuthStatus(),
        getUsers(),
        getRoles(),
        getLeases(),
        getAlarms(),
        getMembers(),
      ]);

    return {
      clusterInfo,
      authStatus,
      users: usersData,
      roles: rolesData,
      leases: leasesData,
      alarms: alarmsData,
      members: membersData,
    };
  }
);

// ============ Keys ============

export const getKeys = createServerFn({ method: "GET" })
  .inputValidator(z.object({ path: z.string() }))
  .handler(async ({ data }): Promise<EtcdKey[]> => {
    if (isMockMode()) {
      const lookupPath = data.path ? data.path.replace(/\/$/, "") + "/" : "/";
      return mockKeys[lookupPath] || [];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const prefix = data.path === "/" || data.path === "" ? "" : data.path.replace(/\/$/, "") + "/";

      // Get all keys with the prefix
      const response = await client.getAll().prefix(prefix).keys();

      // Build a map of direct children
      const childrenMap = new Map<string, EtcdKey>();

      for (const fullKey of response) {
        // Remove the prefix to get the relative path
        const relativePath = prefix ? fullKey.slice(prefix.length) : fullKey;
        if (!relativePath) continue;

        // Get the first segment (direct child)
        const segments = relativePath.split("/");
        const childName = segments[0];

        if (!childName) continue;

        const isDirectory = segments.length > 1 || relativePath.endsWith("/");
        const displayKey = isDirectory ? childName + "/" : childName;

        if (!childrenMap.has(displayKey)) {
          childrenMap.set(displayKey, {
            key: isDirectory ? childName : childName,
            isDirectory,
          });
        }
      }

      // Get metadata for non-directory keys
      const keys: EtcdKey[] = [];
      for (const child of childrenMap.values()) {
        if (!child.isDirectory) {
          const fullKeyPath = prefix + child.key;
          try {
            const kvResponse = await client.get(fullKeyPath);
            if (kvResponse) {
              // The response is the value directly, we need to use a different method to get metadata
              const allResponse = await client.getAll().prefix(fullKeyPath).limit(1).exec();
              if (allResponse.kvs && allResponse.kvs.length > 0) {
                const kv = allResponse.kvs[0];
                keys.push({
                  key: child.key,
                  isDirectory: false,
                  revision: Number(kv.mod_revision),
                  createRevision: Number(kv.create_revision),
                  modRevision: Number(kv.mod_revision),
                });
                continue;
              }
            }
          } catch {
            // Key might have been deleted, skip
          }
        }
        keys.push(child);
      }

      return keys;
    }, []);
  });

export const getKeyValue = createServerFn({ method: "GET" })
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }): Promise<{ value: string; key: EtcdKey | null }> => {
    if (isMockMode()) {
      const keyPath = data.key.replace(/\/$/, "");
      const value = mockKeyValues[keyPath] || "";

      // Find the key metadata
      const parts = keyPath.split("/");
      const keyName = parts.pop() || "";
      const parentPath = parts.length > 0 ? parts.join("/") + "/" : "/";
      const keysInParent = mockKeys[parentPath] || [];
      const keyMeta = keysInParent.find((k) => k.key === keyName) || null;

      return { value, key: keyMeta };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const keyPath = data.key.replace(/\/$/, "");

      const response = await client.getAll().prefix(keyPath).limit(1).exec();

      if (!response.kvs || response.kvs.length === 0) {
        return { value: "", key: null };
      }

      const kv = response.kvs[0];
      const value = kv.value?.toString() || "";
      const keyName = keyPath.split("/").pop() || keyPath;

      return {
        value,
        key: {
          key: keyName,
          isDirectory: false,
          revision: Number(kv.mod_revision),
          createRevision: Number(kv.create_revision),
          modRevision: Number(kv.mod_revision),
        },
      };
    }, { value: "", key: null });
  });

export const putKey = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: z.string(), value: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      await client.put(data.key).value(data.value);
      return { success: true };
    });
  });

export const deleteKey = createServerFn({ method: "POST" })
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      await client.delete().key(data.key);
      return { success: true };
    });
  });

// ============ Auth - Users ============

export const getAuthStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdAuthStatus> => {
    if (isMockMode()) {
      return mockAuthStatus;
    }

    try {
      const client = getEtcdClient();
      // Try to get auth status
      const status = await client.auth.authStatus();
      return { enabled: status.enabled };
    } catch (error) {
      // If we get "authentication is not enabled", auth is disabled
      if (error instanceof Error && error.message.includes("authentication is not enabled")) {
        return { enabled: false };
      }
      // For other errors (like permission denied), auth is enabled but we might not have access
      return { enabled: true };
    }
  }
);

export const getUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdUser[]> => {
    if (isMockMode()) {
      return users;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();

      // Use high-level API
      const userList = await client.getUsers();

      // Get roles for each user
      const usersWithRoles: EtcdUser[] = await Promise.all(
        userList.map(async (user) => {
          try {
            const userRoles = await user.roles();
            return {
              name: user.name,
              roles: userRoles.map((r) => r.name),
            };
          } catch {
            return { name: user.name, roles: [] };
          }
        })
      );

      return usersWithRoles;
    }, []);
  }
);

export const addUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().min(1),
    password: z.string().min(1),
    roles: z.array(z.string()).default([])
  }))
  .handler(async ({ data }): Promise<EtcdUser> => {
    if (isMockMode()) {
      const newUser: EtcdUser = { name: data.name, roles: data.roles };
      users = [...users, newUser];
      return newUser;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();

      // Create user using high-level API
      const user = client.user(data.name);
      await user.create(data.password);

      // Grant roles
      for (const roleName of data.roles) {
        await user.addRole(roleName);
      }

      return { name: data.name, roles: data.roles };
    });
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      users = users.filter((u) => u.name !== data.name);
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const user = client.user(data.name);
      await user.delete();
      return { success: true };
    });
  });

export const grantUserRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userName: z.string(), role: z.string() }))
  .handler(async ({ data }): Promise<EtcdUser | null> => {
    if (isMockMode()) {
      const userIndex = users.findIndex((u) => u.name === data.userName);
      if (userIndex === -1) return null;

      users = users.map((u, i) =>
        i === userIndex ? { ...u, roles: [...u.roles, data.role] } : u
      );
      return users[userIndex];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const user = client.user(data.userName);
      await user.addRole(data.role);

      // Fetch updated user info
      const userRoles = await user.roles();
      return {
        name: data.userName,
        roles: userRoles.map((r) => r.name),
      };
    });
  });

export const revokeUserRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userName: z.string(), role: z.string() }))
  .handler(async ({ data }): Promise<EtcdUser | null> => {
    if (isMockMode()) {
      const userIndex = users.findIndex((u) => u.name === data.userName);
      if (userIndex === -1) return null;

      users = users.map((u, i) =>
        i === userIndex ? { ...u, roles: u.roles.filter((r) => r !== data.role) } : u
      );
      return users[userIndex];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const user = client.user(data.userName);
      await user.removeRole(data.role);

      // Fetch updated user info
      const userRoles = await user.roles();
      return {
        name: data.userName,
        roles: userRoles.map((r) => r.name),
      };
    });
  });

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userName: z.string(), password: z.string().min(1) }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const user = client.user(data.userName);
      await user.setPassword(data.password);
      return { success: true };
    });
  });

// ============ Auth - Roles ============

export const getRoles = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdRole[]> => {
    if (isMockMode()) {
      return roles;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();

      // Use high-level API
      const roleList = await client.getRoles();

      // Get permissions for each role
      const rolesWithPermissions: EtcdRole[] = await Promise.all(
        roleList.map(async (role) => {
          try {
            const perms = await role.permissions();
            const permissions: EtcdRolePermission[] = perms.map((p) => {
              let permType: "read" | "write" | "readwrite" = "read";
              if (p.permission === "Readwrite") {
                permType = "readwrite";
              } else if (p.permission === "Write") {
                permType = "write";
              }

              const keyStart = p.range.start.toString();
              const keyEnd = p.range.end.toString();

              return {
                permType,
                key: keyStart,
                rangeEnd: keyEnd && keyEnd !== "\x00" ? keyEnd : undefined,
                prefix: p.range.end.length === 1 && p.range.end[0] === 0 ? true : undefined,
              };
            });

            return { name: role.name, permissions };
          } catch {
            return { name: role.name, permissions: [] };
          }
        })
      );

      return rolesWithPermissions;
    }, []);
  }
);

export const addRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }): Promise<EtcdRole> => {
    if (isMockMode()) {
      const newRole: EtcdRole = { name: data.name, permissions: [] };
      roles = [...roles, newRole];
      return newRole;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const role = client.role(data.name);
      await role.create();
      return { name: data.name, permissions: [] };
    });
  });

export const deleteRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      roles = roles.filter((r) => r.name !== data.name);
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const role = client.role(data.name);
      await role.delete();
      return { success: true };
    });
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
    if (isMockMode()) {
      const roleIndex = roles.findIndex((r) => r.name === data.roleName);
      if (roleIndex === -1) return null;

      roles = roles.map((r, i) =>
        i === roleIndex
          ? { ...r, permissions: [...r.permissions, data.permission as EtcdRolePermission] }
          : r
      );
      return roles[roleIndex];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const role = client.role(data.roleName);

      let permType: keyof typeof Permission;
      switch (data.permission.permType) {
        case "write":
          permType = "Write";
          break;
        case "readwrite":
          permType = "Readwrite";
          break;
        default:
          permType = "Read";
      }

      if (data.permission.prefix) {
        await role.grant({
          permission: permType,
          range: client.range({ prefix: data.permission.key }),
        });
      } else if (data.permission.rangeEnd) {
        await role.grant({
          permission: permType,
          range: client.range({ start: data.permission.key, end: data.permission.rangeEnd }),
        });
      } else {
        await role.grant({
          permission: permType,
          key: data.permission.key,
        });
      }

      // Fetch updated role info
      const perms = await role.permissions();
      const permissions: EtcdRolePermission[] = perms.map((p) => {
        let pType: "read" | "write" | "readwrite" = "read";
        if (p.permission === "Readwrite") {
          pType = "readwrite";
        } else if (p.permission === "Write") {
          pType = "write";
        }

        return {
          permType: pType,
          key: p.range.start.toString(),
          rangeEnd: p.range.end.toString() || undefined,
        };
      });

      return { name: data.roleName, permissions };
    });
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
    if (isMockMode()) {
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
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const role = client.role(data.roleName);

      await role.revoke({
        permission: "Read", // Permission type doesn't matter for revoke
        key: data.permission.key,
      });

      // Fetch updated role info
      const perms = await role.permissions();
      const permissions: EtcdRolePermission[] = perms.map((p) => {
        let pType: "read" | "write" | "readwrite" = "read";
        if (p.permission === "Readwrite") {
          pType = "readwrite";
        } else if (p.permission === "Write") {
          pType = "write";
        }

        return {
          permType: pType,
          key: p.range.start.toString(),
          rangeEnd: p.range.end.toString() || undefined,
        };
      });

      return { name: data.roleName, permissions };
    });
  });

// ============ Leases ============

export const getLeases = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdLease[]> => {
    if (isMockMode()) {
      return leases;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const leaseList = await client.leaseClient.leaseLeases();

      // Get details for each lease
      const leasesWithDetails: EtcdLease[] = await Promise.all(
        (leaseList.leases || []).map(async (lease) => {
          const leaseId = lease.ID;
          try {
            const ttlInfo = await client.leaseClient.leaseTimeToLive({ ID: leaseId, keys: true });
            return {
              id: memberIdToHex(leaseId),
              ttl: Number(ttlInfo.TTL),
              grantedTtl: Number(ttlInfo.grantedTTL),
              keys: (ttlInfo.keys || []).map((k) => k.toString()),
            };
          } catch {
            return {
              id: memberIdToHex(leaseId),
              ttl: 0,
              grantedTtl: 0,
              keys: [],
            };
          }
        })
      );

      return leasesWithDetails;
    }, []);
  }
);

export const revokeLease = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      leases = leases.filter((l) => l.id !== data.id);
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const leaseId = BigInt(`0x${data.id}`).toString();
      await client.leaseClient.leaseRevoke({ ID: leaseId });
      return { success: true };
    });
  });

export const keepAliveLease = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<EtcdLease | null> => {
    if (isMockMode()) {
      const leaseIndex = leases.findIndex((l) => l.id === data.id);
      if (leaseIndex === -1) return null;

      leases = leases.map((l, i) =>
        i === leaseIndex ? { ...l, ttl: l.grantedTtl } : l
      );
      return leases[leaseIndex];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const leaseId = BigInt(`0x${data.id}`).toString();

      // Send a keep-alive using the stream API
      const stream = await client.leaseClient.leaseKeepAlive();
      stream.write({ ID: leaseId });

      // Wait briefly for response then close
      await new Promise((resolve) => setTimeout(resolve, 100));
      stream.end();

      // Fetch updated lease info
      const ttlInfo = await client.leaseClient.leaseTimeToLive({ ID: leaseId, keys: true });

      return {
        id: data.id,
        ttl: Number(ttlInfo.TTL),
        grantedTtl: Number(ttlInfo.grantedTTL),
        keys: (ttlInfo.keys || []).map((k) => k.toString()),
      };
    });
  });

// ============ Cluster Members ============

export const getMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdMember[]> => {
    if (isMockMode()) {
      return members;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const memberList = await client.cluster.memberList({});

      return (memberList.members || []).map((m) => ({
        id: memberIdToHex(m.ID),
        name: m.name || "",
        peerURLs: m.peerURLs || [],
        clientURLs: m.clientURLs || [],
        isLearner: m.isLearner || false,
      }));
    }, []);
  }
);

export const updateMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberId: z.string(), peerURLs: z.array(z.string()) }))
  .handler(async ({ data }): Promise<EtcdMember | null> => {
    if (isMockMode()) {
      const memberIndex = members.findIndex((m) => m.id === data.memberId);
      if (memberIndex === -1) return null;

      members = members.map((m, i) =>
        i === memberIndex ? { ...m, peerURLs: data.peerURLs } : m
      );
      return members[memberIndex];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const memberId = BigInt(`0x${data.memberId}`).toString();

      await client.cluster.memberUpdate({ ID: memberId, peerURLs: data.peerURLs });

      // Fetch updated member list to get the member
      const memberList = await client.cluster.memberList({});
      const member = (memberList.members || []).find(
        (m) => memberIdToHex(m.ID) === data.memberId
      );

      if (!member) return null;

      return {
        id: data.memberId,
        name: member.name || "",
        peerURLs: member.peerURLs || [],
        clientURLs: member.clientURLs || [],
        isLearner: member.isLearner || false,
      };
    });
  });

export const promoteMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberId: z.string() }))
  .handler(async ({ data }): Promise<EtcdMember | null> => {
    if (isMockMode()) {
      const memberIndex = members.findIndex((m) => m.id === data.memberId);
      if (memberIndex === -1) return null;

      members = members.map((m, i) =>
        i === memberIndex ? { ...m, isLearner: false } : m
      );
      return members[memberIndex];
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const memberId = BigInt(`0x${data.memberId}`).toString();

      await client.cluster.memberPromote({ ID: memberId });

      // Fetch updated member list
      const memberList = await client.cluster.memberList({});
      const member = (memberList.members || []).find(
        (m) => memberIdToHex(m.ID) === data.memberId
      );

      if (!member) return null;

      return {
        id: data.memberId,
        name: member.name || "",
        peerURLs: member.peerURLs || [],
        clientURLs: member.clientURLs || [],
        isLearner: member.isLearner || false,
      };
    });
  });

export const removeMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberId: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      members = members.filter((m) => m.id !== data.memberId);
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const memberId = BigInt(`0x${data.memberId}`).toString();
      await client.cluster.memberRemove({ ID: memberId });
      return { success: true };
    });
  });

export const moveLeader = createServerFn({ method: "POST" })
  .inputValidator(z.object({ targetMemberId: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean; newLeaderId: string }> => {
    if (isMockMode()) {
      leaderId = data.targetMemberId;
      return { success: true, newLeaderId: leaderId };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const targetMemberId = BigInt(`0x${data.targetMemberId}`).toString();

      await client.maintenance.moveLeader({ targetID: targetMemberId });

      return { success: true, newLeaderId: data.targetMemberId };
    });
  });

// ============ Alarms ============

export const getAlarms = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdAlarm[]> => {
    if (isMockMode()) {
      return alarms;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const response = await client.maintenance.alarm({ action: "Get" });

      return (response.alarms || []).map((a) => {
        let alarmType: "NOSPACE" | "CORRUPT" | "NONE" = "NONE";
        if (a.alarm === "Nospace") alarmType = "NOSPACE";
        else if (a.alarm === "Corrupt") alarmType = "CORRUPT";

        return {
          memberID: memberIdToHex(a.memberID),
          alarm: alarmType,
        };
      });
    }, []);
  }
);

export const disarmAlarm = createServerFn({ method: "POST" })
  .inputValidator(z.object({ memberID: z.string(), alarm: z.string() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      alarms = alarms.filter(
        (a) => !(a.memberID === data.memberID && a.alarm === data.alarm)
      );
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const memberId = BigInt(`0x${data.memberID}`).toString();

      let alarmType: "None" | "Nospace" | "Corrupt" = "None";
      if (data.alarm === "NOSPACE") alarmType = "Nospace";
      else if (data.alarm === "CORRUPT") alarmType = "Corrupt";

      await client.maintenance.alarm({
        action: "Deactivate",
        memberID: memberId,
        alarm: alarmType,
      });

      return { success: true };
    });
  });

export const disarmAllAlarms = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean }> => {
    if (isMockMode()) {
      alarms = [];
      return { success: true };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();

      // First get all alarms
      const response = await client.maintenance.alarm({ action: "Get" });

      // Deactivate each alarm
      for (const alarm of response.alarms || []) {
        await client.maintenance.alarm({
          action: "Deactivate",
          memberID: alarm.memberID,
          alarm: alarm.alarm,
        });
      }

      return { success: true };
    });
  }
);

// ============ Endpoints ============

export const getEndpointHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdEndpointHealth[]> => {
    if (isMockMode()) {
      return mockEndpointHealth;
    }

    return withErrorHandling(async () => {
      const endpoints = getEndpoints();
      const healthResults: EtcdEndpointHealth[] = [];

      for (const endpoint of endpoints) {
        const start = performance.now();
        try {
          const client = getEtcdClient();
          await client.maintenance.status();
          const took = performance.now() - start;

          healthResults.push({
            endpoint,
            health: true,
            took: `${took.toFixed(3)}ms`,
          });
        } catch {
          const took = performance.now() - start;
          healthResults.push({
            endpoint,
            health: false,
            took: `${took.toFixed(3)}ms`,
          });
        }
      }

      return healthResults;
    }, []);
  }
);

export const getEndpointStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<EtcdEndpointStatus[]> => {
    if (isMockMode()) {
      return mockEndpointStatus;
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const endpoints = getEndpoints();
      const statusResults: EtcdEndpointStatus[] = [];

      for (const endpoint of endpoints) {
        try {
          const status = await client.maintenance.status();

          statusResults.push({
            endpoint,
            dbSize: Number(status.dbSize),
            dbSizeInUse: Number(status.dbSizeInUse || 0),
            leader: memberIdToHex(status.leader),
            raftIndex: Number(status.raftIndex),
            raftTerm: Number(status.raftTerm),
            raftAppliedIndex: Number(status.raftAppliedIndex || 0),
            version: status.version,
          });
        } catch {
          // Skip failed endpoints
        }
      }

      return statusResults;
    }, []);
  }
);

// ============ Maintenance ============

export const defragment = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean; message: string }> => {
    if (isMockMode()) {
      return { success: true, message: "Defragmentation completed" };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      await client.maintenance.defragment();
      return { success: true, message: "Defragmentation completed" };
    });
  }
);

export const compact = createServerFn({ method: "POST" })
  .inputValidator(z.object({ revision: z.number().optional() }))
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    if (isMockMode()) {
      return { success: true, message: "Compaction completed" };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();

      // If no revision provided, get the current revision
      let revision = data.revision;
      if (!revision) {
        const status = await client.maintenance.status();
        revision = Number(status.header.revision);
      }

      await client.kv.compact({ revision });
      return { success: true, message: `Compaction completed at revision ${revision}` };
    });
  });

export const snapshot = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean; path: string }> => {
    if (isMockMode()) {
      return { success: true, path: "/tmp/etcd-snapshot.db" };
    }

    return withErrorHandling(async () => {
      const client = getEtcdClient();
      const fs = await import("node:fs");
      const path = await import("node:path");
      const os = await import("node:os");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const snapshotPath = path.join(os.tmpdir(), `etcd-snapshot-${timestamp}.db`);

      const stream = await client.maintenance.snapshot();
      const writeStream = fs.createWriteStream(snapshotPath);

      await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk) => {
          if (chunk.blob) {
            writeStream.write(chunk.blob);
          }
        });
        stream.on("end", () => {
          writeStream.end();
          resolve();
        });
        stream.on("error", reject);
        writeStream.on("error", reject);
      });

      return { success: true, path: snapshotPath };
    });
  }
);
