import { Etcd3, type IOptions } from 'etcd3';
import { env } from '../../env';

let client: Etcd3 | null = null;

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return env.ETCD_MOCK_MODE === 'true';
}

/**
 * Build etcd3 client options from environment variables
 */
function buildClientOptions(): IOptions {
  const options: IOptions = {
    hosts: env.ETCD_ENDPOINTS.split(',').map(h => h.trim()),
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
 * Get the singleton etcd3 client instance
 */
export function getEtcdClient(): Etcd3 {
  if (isMockMode()) {
    throw new Error('Cannot get etcd client in mock mode');
  }

  if (!client) {
    client = new Etcd3(buildClientOptions());
  }

  return client;
}

/**
 * Close the etcd3 client connection
 */
export async function closeEtcdClient(): Promise<void> {
  if (client) {
    client.close();
    client = null;
  }
}

/**
 * Get the configured endpoints as an array
 */
export function getEndpoints(): string[] {
  return env.ETCD_ENDPOINTS.split(',').map(h => h.trim());
}
