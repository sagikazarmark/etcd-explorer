import { Etcd3, type IOptions } from "etcd3";
import { env } from "../../env";
import type { EtcdClientInterface } from "./etcd-client-interface";
import { RealEtcdClient } from "./real-etcd-client";
import { MockEtcdClient } from "./mock-etcd-client";

let etcd3Client: Etcd3 | null = null;
let realClient: RealEtcdClient | null = null;
let mockClient: MockEtcdClient | null = null;

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
	return env.ETCD_MOCK_MODE === "true";
}

/**
 * Build etcd3 client options from environment variables
 */
function buildClientOptions(): IOptions {
	const options: IOptions = {
		hosts: env.ETCD_ENDPOINTS.split(",").map((h) => h.trim()),
		dialTimeout: env.ETCD_DIAL_TIMEOUT,
	};

	// Add authentication if credentials are provided
	if (env.ETCD_USERNAME && env.ETCD_PASSWORD) {
		options.auth = {
			username: env.ETCD_USERNAME,
			password: env.ETCD_PASSWORD,
		};
	}

	// Add TLS credentials if provided
	if (env.ETCD_CA_CERT && env.ETCD_CLIENT_CERT && env.ETCD_CLIENT_KEY) {
		options.credentials = {
			rootCertificate: Buffer.from(env.ETCD_CA_CERT),
			privateKey: Buffer.from(env.ETCD_CLIENT_KEY),
			certChain: Buffer.from(env.ETCD_CLIENT_CERT),
		};
	} else if (env.ETCD_CA_CERT) {
		// CA-only mode (server verification without client auth)
		options.credentials = {
			rootCertificate: Buffer.from(env.ETCD_CA_CERT),
		};
	}

	return options;
}

/**
 * Get the configured endpoints as an array
 */
export function getEndpoints(): string[] {
	return env.ETCD_ENDPOINTS.split(",").map((h) => h.trim());
}

/**
 * Get the singleton etcd3 client instance (for internal use by RealEtcdClient)
 */
function getEtcd3Client(): Etcd3 {
	if (!etcd3Client) {
		etcd3Client = new Etcd3(buildClientOptions());
	}
	return etcd3Client;
}

/**
 * Get the unified etcd client interface.
 * Returns MockEtcdClient when mock mode is enabled, otherwise RealEtcdClient.
 */
export function getClient(): EtcdClientInterface {
	if (isMockMode()) {
		if (!mockClient) {
			mockClient = new MockEtcdClient();
		}
		return mockClient;
	}

	if (!realClient) {
		realClient = new RealEtcdClient(getEtcd3Client(), getEndpoints());
	}
	return realClient;
}

/**
 * Close the etcd3 client connection
 */
export async function closeEtcdClient(): Promise<void> {
	if (etcd3Client) {
		etcd3Client.close();
		etcd3Client = null;
		realClient = null;
	}
}
