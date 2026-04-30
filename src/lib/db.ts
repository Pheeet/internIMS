/**
 * lib/db.ts
 * Production-ready PostgreSQL connection module using node-postgres (pg).
 * Implements singleton pool, health check, and typed query helper.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DbHealthResult {
  connected: boolean;
  latencyMs: number;
  error?: string;
}

export interface QueryOptions {
  /** Override log behaviour; defaults to process.env.NODE_ENV === 'development' */
  logQuery?: boolean;
}

interface ResolvedDbConfig {
  signature: string;
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

// ---------------------------------------------------------------------------
// Pool configuration
// ---------------------------------------------------------------------------

function isPlaceholderDatabaseUrl(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    const username = parsed.username.toLowerCase();
    const password = parsed.password.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    const database = parsed.pathname.replace(/^\//, "").toLowerCase();

    return (
      username === "user" ||
      password === "password" ||
      hostname === "host" ||
      database === "database"
    );
  } catch {
    return true;
  }
}

function resolveDbConfig(): ResolvedDbConfig {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  const hasAllDbParts =
    Boolean(process.env.DB_HOST) &&
    Boolean(process.env.DB_USER) &&
    Boolean(process.env.DB_PASSWORD) &&
    Boolean(process.env.DB_NAME);

  // Prefer explicit DB_* values when fully provided to avoid conflicts
  // between multiple env files with stale DATABASE_URL values.
  if (hasAllDbParts) {
    const host = process.env.DB_HOST as string;
    const port = parseInt(process.env.DB_PORT ?? "5432", 10);
    const user = process.env.DB_USER as string;
    const password = process.env.DB_PASSWORD as string;
    const database = process.env.DB_NAME as string;

    if (databaseUrl && process.env.NODE_ENV === "development") {
      const parsed = (() => {
        try {
          return new URL(databaseUrl);
        } catch {
          return null;
        }
      })();

      const urlHost = parsed?.hostname;
      const urlPort = parsed?.port ? parseInt(parsed.port, 10) : 5432;
      const dbPart = parsed?.pathname.replace(/^\//, "");

      if (
        !parsed ||
        urlHost !== host ||
        urlPort !== port ||
        parsed.username !== user ||
        dbPart !== database
      ) {
        console.warn(
          "[db] Both DATABASE_URL and DB_* are set. Using DB_* values in development."
        );
      }
    }

    return {
      signature: `fallback:${host}:${port}:${user}:${database}`,
      host,
      port,
      user,
      password,
      database,
    };
  }

  if (databaseUrl && !isPlaceholderDatabaseUrl(databaseUrl)) {
    return {
      signature: `url:${databaseUrl}`,
      connectionString: databaseUrl,
    };
  }

  if (databaseUrl && process.env.NODE_ENV !== "production") {
    console.warn(
      "[db] Ignoring placeholder/invalid DATABASE_URL and using DB_* fallback variables."
    );
  }

  const missingVars: string[] = [];
  (["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const).forEach((v) => {
    if (!process.env[v]) missingVars.push(v);
  });

  if (missingVars.length > 0) {
    throw new Error(
      `[db] Missing required environment variables: ${missingVars.join(", ")}. ` +
        "Set a valid DATABASE_URL or the individual DB_* variables."
    );
  }

  throw new Error("[db] Failed to resolve database configuration.");
}

function createPool(): Pool {
  const isProduction = process.env.NODE_ENV === "production";
  const resolved = resolveDbConfig();

  if (process.env.NODE_ENV === "development" && !globalThis.__pgPoolLoggedSource) {
    if (resolved.connectionString) {
      console.log("[db] Using DATABASE_URL connection config.");
    } else {
      console.log(
        `[db] Using DB_* connection config host=${resolved.host} port=${resolved.port} db=${resolved.database} user=${resolved.user}`
      );
    }
    globalThis.__pgPoolLoggedSource = true;
  }

  // SSL: enabled in production or when DB_SSL=true is set explicitly
  const sslEnabled =
    isProduction || process.env.DB_SSL?.toLowerCase() === "true";

  const sslConfig = sslEnabled
    ? {
        // rejectUnauthorized: false is required for cloud providers
        // (Railway, Supabase, Neon, Render) that use self-signed certs.
        rejectUnauthorized: false,
      }
    : false;

  const baseConfig = {
    max: parseInt(process.env.DB_POOL_MAX ?? "10", 10),
    min: parseInt(process.env.DB_POOL_MIN ?? "2", 10),
    idleTimeoutMillis: parseInt(
      process.env.DB_IDLE_TIMEOUT_MS ?? "30000",
      10
    ),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT_MS ?? "5000",
      10
    ),
    ssl: sslConfig,
  };

  if (resolved.connectionString) {
    return new Pool({
      connectionString: resolved.connectionString,
      ...baseConfig,
    });
  }

  return new Pool({
    host: resolved.host,
    port: resolved.port,
    user: resolved.user,
    password: resolved.password,
    database: resolved.database,
    ...baseConfig,
  });
}

// ---------------------------------------------------------------------------
// Singleton pattern — prevents multiple Pool instances during Next.js hot reload
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __pgPoolConfigSignature: string | undefined;
  // eslint-disable-next-line no-var
  var __pgPoolShutdownHooksAttached: boolean | undefined;
  // eslint-disable-next-line no-var
  var __pgPoolLoggedSource: boolean | undefined;
}

function getPool(): Pool {
  if (process.env.NODE_ENV === "production") {
    // In production each process has exactly one module instance, so a
    // module-level singleton is sufficient.
    if (!_productionPool) {
      _productionPool = createPool();
      attachPoolListeners(_productionPool);
      attachShutdownHooks();
    }
    return _productionPool;
  }

  const { signature } = resolveDbConfig();

  // In development, Next.js hot reload can re-execute this module multiple
  // times within the same Node.js process.  Storing the pool on `globalThis`
  // ensures we reuse the same Pool across HMR boundaries.
  if (
    !globalThis.__pgPool ||
    globalThis.__pgPoolConfigSignature !== signature
  ) {
    if (globalThis.__pgPool) {
      void globalThis.__pgPool.end().catch((err) => {
        console.error("[db] Failed to close previous dev pool:", err);
      });
    }

    globalThis.__pgPool = createPool();
    globalThis.__pgPoolConfigSignature = signature;
    attachPoolListeners(globalThis.__pgPool);
    attachShutdownHooks();
  }
  return globalThis.__pgPool;
}

let _productionPool: Pool | undefined;

// ---------------------------------------------------------------------------
// Pool event listeners
// ---------------------------------------------------------------------------

function attachPoolListeners(pool: Pool): void {
  pool.on("error", (err: Error, _client: PoolClient) => {
    console.error("[db] Unexpected idle-client error:", err.message);
  });

  pool.on("connect", (_client: PoolClient) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[db] New client connected to pool");
    }
  });

}

function attachShutdownHooks(): void {
  if (globalThis.__pgPoolShutdownHooksAttached) {
    return;
  }

  // Graceful shutdown — release all connections when the process exits.
  let shutdownTriggered = false;
  const shutdown = async () => {
    if (shutdownTriggered) {
      return;
    }
    shutdownTriggered = true;

    const poolToClose =
      process.env.NODE_ENV === "production" ? _productionPool : globalThis.__pgPool;

    if (!poolToClose) {
      return;
    }

    try {
      await poolToClose.end();
      console.log("[db] Pool has ended gracefully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("Called end on pool more than once")) {
        console.error("[db] Error during pool shutdown:", err);
      }
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("beforeExit", shutdown);

  globalThis.__pgPoolShutdownHooksAttached = true;
}

// ---------------------------------------------------------------------------
// Public API — pool accessor
// ---------------------------------------------------------------------------

export function getDbPool(): Pool {
  return getPool();
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

/**
 * Runs a lightweight `SELECT 1` against the database and returns
 * connectivity status and round-trip latency.
 */
export async function checkDatabaseConnection(): Promise<DbHealthResult> {
  const start = Date.now();
  try {
    const pool = getPool();
    const result = await pool.query<{ "?column?": number }>("SELECT 1");
    const latencyMs = Date.now() - start;

    if (result.rows[0]["?column?"] !== 1) {
      return {
        connected: false,
        latencyMs,
        error: "Unexpected result from SELECT 1",
      };
    }

    return { connected: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    // Classify common error types for clearer diagnostics
    let friendlyError = message;
    if (message.includes("ECONNREFUSED")) {
      friendlyError = `Host unreachable (ECONNREFUSED): ${message}`;
    } else if (
      message.includes("password authentication failed") ||
      message.includes("role") ||
      message.includes("does not exist")
    ) {
      friendlyError = `Authentication / database error: ${message}`;
    } else if (message.includes("timeout")) {
      friendlyError = `Connection timeout: ${message}`;
    }

    console.error("[db] Health check failed:", friendlyError);
    return { connected: false, latencyMs, error: friendlyError };
  }
}

// ---------------------------------------------------------------------------
// Typed query helper
// ---------------------------------------------------------------------------

/**
 * Executes a parameterised SQL query and returns the typed result rows.
 *
 * @example
 * const users = await query<{ id: number; name: string }>(
 *   'SELECT id, name FROM users WHERE active = $1',
 *   [true]
 * );
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
  options?: QueryOptions
): Promise<QueryResult<T>> {
  const pool = getPool();
  const isDev = process.env.NODE_ENV === "development";
  const shouldLog = options?.logQuery ?? isDev;

  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);

    if (shouldLog) {
      console.log(
        `[db] query executed in ${Date.now() - start}ms | rows: ${result.rowCount} | ${text.slice(0, 120)}`
      );
    }

    return result;
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    // Provide helpful context for common pg error codes
    const pgErr = err as { code?: string };
    let context = "";
    if (pgErr.code === "42601") context = " (syntax error)";
    else if (pgErr.code === "23505") context = " (unique constraint violation)";
    else if (pgErr.code === "23503") context = " (foreign key violation)";
    else if (pgErr.code === "23502") context = " (not-null violation)";
    else if (pgErr.code === "57014") context = " (query cancelled / timeout)";

    console.error(
      `[db] query failed in ${duration}ms${context}: ${message} | ${text.slice(0, 120)}`
    );

    throw err; // Re-throw so the caller can handle it
  }
}

/**
 * Executes a callback inside a single transaction.
 * Automatically commits on success and rolls back on any error.
 *
 * @example
 * await withTransaction(async (client) => {
 *   await client.query('INSERT INTO ...', [...]);
 *   await client.query('UPDATE ...', [...]);
 * });
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
