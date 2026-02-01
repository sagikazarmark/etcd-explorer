import type { Etcd3 } from "etcd3";
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
  RolePermission,
  User,
} from "../types/etcd";
import type { EtcdClientInterface } from "./etcd-client-interface";
import { withErrorHandling } from "./etcd-errors";

/**
 * Convert member ID (bigint, number, or string) to hex string
 */
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

/**
 * Real etcd client implementation using the etcd3 library.
 */
export class RealEtcdClient implements EtcdClientInterface {
  constructor(
    private client: Etcd3,
    private endpoints: string[],
  ) {}

  // ============ Cluster ============

  async getClusterInfo(): Promise<ClusterInfo> {
    return withErrorHandling(async () => {
      const status = await this.client.maintenance.status();

      return {
        version: status.version,
        clusterName: "etcd-cluster", // etcd3 doesn't expose cluster name directly
        endpoints: this.endpoints,
        leader: memberIdToHex(status.leader),
        revision: Number(status.header.revision),
        raftTerm: Number(status.raftTerm),
      };
    });
  }

  // ============ Keys ============

  async getKeys(path: string): Promise<Key[]> {
    return withErrorHandling(async () => {
      const prefix =
        path === "/" || path === "" ? "" : path.replace(/\/$/, "") + "/";

      // Get all keys with the prefix
      const response = await this.client.getAll().prefix(prefix).keys();

      // Build a map of direct children
      const childrenMap = new Map<string, Key>();

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
      const keys: Key[] = [];
      for (const child of childrenMap.values()) {
        if (!child.isDirectory) {
          const fullKeyPath = prefix + child.key;
          try {
            const kvResponse = await this.client.get(fullKeyPath);
            if (kvResponse) {
              // The response is the value directly, we need to use a different method to get metadata
              const allResponse = await this.client
                .getAll()
                .prefix(fullKeyPath)
                .limit(1)
                .exec();
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
  }

  async getKeyValue(key: string): Promise<{ value: string; key: Key | null }> {
    return withErrorHandling(
      async () => {
        const keyPath = key.replace(/\/$/, "");

        const response = await this.client
          .getAll()
          .prefix(keyPath)
          .limit(1)
          .exec();

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
      },
      { value: "", key: null },
    );
  }

  async putKey(key: string, value: string): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
      await this.client.put(key).value(value);
      return { success: true };
    });
  }

  async deleteKey(key: string): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
      await this.client.delete().key(key);
      return { success: true };
    });
  }

  // ============ Auth - Users ============

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      // Try to get auth status
      const status = await this.client.auth.authStatus();
      return { enabled: status.enabled };
    } catch (error) {
      // If we get "authentication is not enabled", auth is disabled
      if (
        error instanceof Error &&
        error.message.includes("authentication is not enabled")
      ) {
        return { enabled: false };
      }
      // For other errors (like permission denied), auth is enabled but we might not have access
      return { enabled: true };
    }
  }

  async getUsers(): Promise<User[]> {
    return withErrorHandling(async () => {
      // Use high-level API
      const userList = await this.client.getUsers();

      // Get roles for each user
      const usersWithRoles: User[] = await Promise.all(
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
        }),
      );

      return usersWithRoles;
    }, []);
  }

  // ============ Auth - Roles ============

  async getRoles(): Promise<Role[]> {
    return withErrorHandling(async () => {
      // Use high-level API
      const roleList = await this.client.getRoles();

      // Get permissions for each role
      const rolesWithPermissions: Role[] = await Promise.all(
        roleList.map(async (role) => {
          try {
            const perms = await role.permissions();
            const permissions: RolePermission[] = perms.map((p) => {
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
                prefix:
                  p.range.end.length === 1 && p.range.end[0] === 0
                    ? true
                    : undefined,
              };
            });

            return { name: role.name, permissions };
          } catch {
            return { name: role.name, permissions: [] };
          }
        }),
      );

      return rolesWithPermissions;
    }, []);
  }

  // ============ Leases ============

  async getLeases(): Promise<Lease[]> {
    return withErrorHandling(async () => {
      const leaseList = await this.client.leaseClient.leaseLeases();

      // Get details for each lease
      const leasesWithDetails: Lease[] = await Promise.all(
        (leaseList.leases || []).map(async (lease) => {
          const leaseId = lease.ID;
          try {
            const ttlInfo = await this.client.leaseClient.leaseTimeToLive({
              ID: leaseId,
              keys: true,
            });
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
        }),
      );

      return leasesWithDetails;
    }, []);
  }

  // ============ Members ============

  async getMembers(): Promise<ClusterMember[]> {
    return withErrorHandling(async () => {
      const memberList = await this.client.cluster.memberList({});

      return (memberList.members || []).map((m) => ({
        id: memberIdToHex(m.ID),
        name: m.name || "",
        peerURLs: m.peerURLs || [],
        clientURLs: m.clientURLs || [],
        isLearner: m.isLearner || false,
      }));
    }, []);
  }

  async updateMember(
    memberId: string,
    peerURLs: string[],
  ): Promise<ClusterMember | null> {
    return withErrorHandling(async () => {
      const memberIdBigInt = BigInt(`0x${memberId}`).toString();

      await this.client.cluster.memberUpdate({
        ID: memberIdBigInt,
        peerURLs,
      });

      // Fetch updated member list to get the member
      const memberList = await this.client.cluster.memberList({});
      const member = (memberList.members || []).find(
        (m) => memberIdToHex(m.ID) === memberId,
      );

      if (!member) return null;

      return {
        id: memberId,
        name: member.name || "",
        peerURLs: member.peerURLs || [],
        clientURLs: member.clientURLs || [],
        isLearner: member.isLearner || false,
      };
    });
  }

  async promoteMember(memberId: string): Promise<ClusterMember | null> {
    return withErrorHandling(async () => {
      const memberIdBigInt = BigInt(`0x${memberId}`).toString();

      await this.client.cluster.memberPromote({ ID: memberIdBigInt });

      // Fetch updated member list
      const memberList = await this.client.cluster.memberList({});
      const member = (memberList.members || []).find(
        (m) => memberIdToHex(m.ID) === memberId,
      );

      if (!member) return null;

      return {
        id: memberId,
        name: member.name || "",
        peerURLs: member.peerURLs || [],
        clientURLs: member.clientURLs || [],
        isLearner: member.isLearner || false,
      };
    });
  }

  async removeMember(memberId: string): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
      const memberIdBigInt = BigInt(`0x${memberId}`).toString();
      await this.client.cluster.memberRemove({ ID: memberIdBigInt });
      return { success: true };
    });
  }

  async moveLeader(
    targetMemberId: string,
  ): Promise<{ success: boolean; newLeaderId: string }> {
    return withErrorHandling(async () => {
      const targetMemberIdBigInt = BigInt(`0x${targetMemberId}`).toString();

      await this.client.maintenance.moveLeader({
        targetID: targetMemberIdBigInt,
      });

      return { success: true, newLeaderId: targetMemberId };
    });
  }

  // ============ Alarms ============

  async getAlarms(): Promise<Alarm[]> {
    return withErrorHandling(async () => {
      const response = await this.client.maintenance.alarm({ action: "Get" });

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

  // ============ Endpoints ============

  async getEndpointHealth(): Promise<EndpointHealth[]> {
    return withErrorHandling(async () => {
      const healthResults: EndpointHealth[] = [];

      for (const endpoint of this.endpoints) {
        const start = performance.now();
        try {
          await this.client.maintenance.status();
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

  async getEndpointStatus(): Promise<EndpointStatus[]> {
    return withErrorHandling(async () => {
      const statusResults: EndpointStatus[] = [];

      for (const endpoint of this.endpoints) {
        try {
          const status = await this.client.maintenance.status();

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
}
