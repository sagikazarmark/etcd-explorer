import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SERVER_URL: z.string().url().optional(),

		// etcd Connection
		ETCD_ENDPOINTS: z.string().default("http://localhost:2379"),
		ETCD_USERNAME: z.string().optional(),
		ETCD_PASSWORD: z.string().optional(),

		// TLS (optional)
		ETCD_CA_CERT: z.string().optional(),
		ETCD_CLIENT_CERT: z.string().optional(),
		ETCD_CLIENT_KEY: z.string().optional(),

		// Settings
		ETCD_DIAL_TIMEOUT: z.coerce.number().default(30000),
		ETCD_MOCK_MODE: z.enum(["true", "false"]).default("false"),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: import.meta.env,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
