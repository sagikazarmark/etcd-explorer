# etcd Explorer

A modern web-based UI for exploring and managing etcd clusters.

## Features

- **Dashboard** - Overview of cluster health, authentication status, and quick stats
- **Key Browser** - Browse and manage key-value pairs stored in etcd
- **Leases** - View and manage etcd leases
- **Authentication** - Manage users and roles
- **Cluster Management** - Monitor cluster members, endpoints, and alarms
- **Dark Mode** - Toggle between light and dark themes

## Getting Started

### Prerequisites

- Node.js 22+
- An etcd cluster (or use mock mode for development)

### Installation

```bash
npm install
```

### Configuration

Configure the connection to your etcd cluster using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ETCD_ENDPOINTS` | Comma-separated list of etcd endpoints | `http://localhost:2379` |
| `ETCD_USERNAME` | Username for authentication | - |
| `ETCD_PASSWORD` | Password for authentication | - |
| `ETCD_CA_CERT` | Path to CA certificate for TLS | - |
| `ETCD_CLIENT_CERT` | Path to client certificate for TLS | - |
| `ETCD_CLIENT_KEY` | Path to client key for TLS | - |
| `ETCD_DIAL_TIMEOUT` | Connection timeout in milliseconds | `30000` |
| `ETCD_MOCK_MODE` | Enable mock mode for development (`true`/`false`) | `false` |

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Docker

A pre-built container image is available:

```bash
docker run -p 3000:3000 -e ETCD_ENDPOINTS=http://etcd:2379 ghcr.io/sagikazarmark/etcd-explorer
```

To build the image locally:

```bash
docker build -t etcd-explorer .
```

## License

See [LICENSE](LICENSE) for details.
