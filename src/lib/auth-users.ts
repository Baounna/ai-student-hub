import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { hashPassword, verifyPassword } from "@/lib/password";

type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type StoreShape = {
  version: 1;
  users: StoredUser[];
};

const EMPTY_STORE: StoreShape = {
  version: 1,
  users: []
};

type CredentialsBackend = "file" | "supabase";

let writeQueue = Promise.resolve();

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function sanitizeName(value: string) {
  const compact = value.trim().replace(/\s+/g, " ");
  return compact.slice(0, 80) || "Student";
}

function getCredentialsBackend(): CredentialsBackend {
  const explicit = (process.env.AUTH_CREDENTIALS_BACKEND || "").trim().toLowerCase();
  if (explicit === "file" || explicit === "supabase") return explicit;

  const hasSupabaseCredentials = Boolean((process.env.SUPABASE_URL || "").trim() && (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim());
  return hasSupabaseCredentials ? "supabase" : "file";
}

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  table: string;
};

function getSupabaseConfig(): SupabaseConfig {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const table = (process.env.SUPABASE_USERS_TABLE || "auth_users").trim();
  return { url, serviceRoleKey, table };
}

function validateSupabaseConfig(config: SupabaseConfig) {
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase credentials backend is not configured.");
  }
  if (!/^[a-z0-9_]+$/i.test(config.table)) {
    throw new Error("SUPABASE_USERS_TABLE is invalid.");
  }
}

function mapRowToStoredUser(row: {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}): StoredUser {
  return {
    id: String(row.id),
    email: normalizeEmail(String(row.email)),
    name: sanitizeName(String(row.name)),
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null
  };
}

function supabaseHeaders(config: SupabaseConfig, includePrefer = false) {
  const headers: Record<string, string> = {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json"
  };
  if (includePrefer) headers.Prefer = "return=representation";
  return headers;
}

async function supabaseFetchJson<T>(url: URL, init: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(12_000) });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, status: response.status, body: text };
    }
    return { ok: true, data: (text ? (JSON.parse(text) as T) : (null as T)) };
  } catch {
    return { ok: false, status: 0, body: "request_failed" };
  }
}

async function ensureSupabaseReady() {
  const config = getSupabaseConfig();
  validateSupabaseConfig(config);

  const endpoint = new URL(`/rest/v1/${config.table}`, `${config.url}/`);
  endpoint.searchParams.set("select", "id");
  endpoint.searchParams.set("limit", "1");

  const result = await supabaseFetchJson<unknown[]>(endpoint, {
    method: "GET",
    headers: supabaseHeaders(config)
  });

  if (!result.ok) {
    throw new Error("Supabase credentials backend is unavailable.");
  }

  return true;
}

async function registerSupabaseUser(input: { email: string; name: string; password: string }) {
  const config = getSupabaseConfig();
  validateSupabaseConfig(config);

  const email = normalizeEmail(input.email);
  const name = sanitizeName(input.name);
  const now = new Date().toISOString();

  const existingUrl = new URL(`/rest/v1/${config.table}`, `${config.url}/`);
  existingUrl.searchParams.set("select", "id,email,name,password_hash,created_at,updated_at,last_login_at");
  existingUrl.searchParams.set("email", `eq.${email}`);
  existingUrl.searchParams.set("limit", "1");

  const existingResult = await supabaseFetchJson<
    Array<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      created_at: string;
      updated_at: string;
      last_login_at?: string | null;
    }>
  >(existingUrl, {
    method: "GET",
    headers: supabaseHeaders(config)
  });

  if (!existingResult.ok) {
    return { ok: false as const, reason: "store_unavailable" as const };
  }

  if (existingResult.data.length) {
    return { ok: false as const, reason: "email_exists" as const };
  }

  const passwordHash = await hashPassword(input.password);
  const insertUrl = new URL(`/rest/v1/${config.table}`, `${config.url}/`);
  insertUrl.searchParams.set("select", "id,email,name,password_hash,created_at,updated_at,last_login_at");

  const insertResult = await supabaseFetchJson<
    Array<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      created_at: string;
      updated_at: string;
      last_login_at?: string | null;
    }>
  >(insertUrl, {
    method: "POST",
    headers: supabaseHeaders(config, true),
    body: JSON.stringify({
      id: randomUUID(),
      email,
      name,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
      last_login_at: now
    })
  });

  if (!insertResult.ok) {
    const duplicate = insertResult.body.toLowerCase().includes("duplicate");
    if (duplicate || insertResult.status === 409) {
      return { ok: false as const, reason: "email_exists" as const };
    }
    return { ok: false as const, reason: "store_unavailable" as const };
  }

  const inserted = insertResult.data[0];
  if (!inserted) {
    return { ok: false as const, reason: "store_unavailable" as const };
  }

  return { ok: true as const, user: mapRowToStoredUser(inserted) };
}

async function authenticateSupabaseUser(input: { email: string; password: string }) {
  const config = getSupabaseConfig();
  validateSupabaseConfig(config);

  const email = normalizeEmail(input.email);
  const selectUrl = new URL(`/rest/v1/${config.table}`, `${config.url}/`);
  selectUrl.searchParams.set("select", "id,email,name,password_hash,created_at,updated_at,last_login_at");
  selectUrl.searchParams.set("email", `eq.${email}`);
  selectUrl.searchParams.set("limit", "1");

  const selectResult = await supabaseFetchJson<
    Array<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      created_at: string;
      updated_at: string;
      last_login_at?: string | null;
    }>
  >(selectUrl, {
    method: "GET",
    headers: supabaseHeaders(config)
  });

  if (!selectResult.ok) {
    return { ok: false as const, reason: "store_unavailable" as const };
  }

  const row = selectResult.data[0];
  if (!row) {
    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) {
    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  const now = new Date().toISOString();
  const updateUrl = new URL(`/rest/v1/${config.table}`, `${config.url}/`);
  updateUrl.searchParams.set("email", `eq.${email}`);
  updateUrl.searchParams.set("select", "id,email,name,password_hash,created_at,updated_at,last_login_at");

  const updateResult = await supabaseFetchJson<
    Array<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      created_at: string;
      updated_at: string;
      last_login_at?: string | null;
    }>
  >(updateUrl, {
    method: "PATCH",
    headers: supabaseHeaders(config, true),
    body: JSON.stringify({
      last_login_at: now,
      updated_at: now
    })
  });

  if (!updateResult.ok || !updateResult.data[0]) {
    return { ok: true as const, user: mapRowToStoredUser({ ...row, last_login_at: now, updated_at: now }) };
  }

  return { ok: true as const, user: mapRowToStoredUser(updateResult.data[0]) };
}

async function checkSupabaseCredentialEmail(input: { email: string }) {
  const config = getSupabaseConfig();
  validateSupabaseConfig(config);

  const email = normalizeEmail(input.email);
  const selectUrl = new URL(`/rest/v1/${config.table}`, `${config.url}/`);
  selectUrl.searchParams.set("select", "id");
  selectUrl.searchParams.set("email", `eq.${email}`);
  selectUrl.searchParams.set("limit", "1");

  const selectResult = await supabaseFetchJson<Array<{ id: string }>>(selectUrl, {
    method: "GET",
    headers: supabaseHeaders(config)
  });

  if (!selectResult.ok) {
    return { ok: false as const, reason: "store_unavailable" as const };
  }

  return { ok: true as const, exists: selectResult.data.length > 0 };
}

function usersStorePath() {
  const raw = (process.env.AUTH_USERS_STORE_PATH || "").trim();
  if (!raw) return join(process.cwd(), "data", "auth-users.json");
  return isAbsolute(raw) ? raw : join(process.cwd(), raw);
}

async function ensureStoreDirectory(pathValue: string) {
  await mkdir(dirname(pathValue), { recursive: true });
}

function asStoreShape(value: unknown): StoreShape {
  if (!value || typeof value !== "object") return EMPTY_STORE;

  const payload = value as { version?: unknown; users?: unknown };
  const users = Array.isArray(payload.users)
    ? payload.users
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const user = entry as Partial<StoredUser>;
          if (
            !user.id ||
            !user.email ||
            !user.name ||
            !user.passwordHash ||
            !user.createdAt ||
            !user.updatedAt
          ) {
            return null;
          }

          return {
            id: String(user.id),
            email: normalizeEmail(String(user.email)),
            name: sanitizeName(String(user.name)),
            passwordHash: String(user.passwordHash),
            createdAt: String(user.createdAt),
            updatedAt: String(user.updatedAt),
            lastLoginAt: user.lastLoginAt ? String(user.lastLoginAt) : null
          } as StoredUser;
        })
        .filter(Boolean)
    : [];

  return {
    version: 1,
    users: users as StoredUser[]
  };
}

async function readStore() {
  const pathValue = usersStorePath();

  try {
    const content = await readFile(pathValue, "utf8");
    return asStoreShape(JSON.parse(content));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code === "ENOENT") return EMPTY_STORE;
    throw error;
  }
}

async function writeStore(store: StoreShape) {
  const pathValue = usersStorePath();
  await ensureStoreDirectory(pathValue);
  const tempPath = `${pathValue}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, pathValue);
}

function queueWrite<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function ensureCredentialStoreReady() {
  const backend = getCredentialsBackend();
  if (backend === "supabase") {
    return ensureSupabaseReady();
  }

  const pathValue = usersStorePath();
  await ensureStoreDirectory(pathValue);

  try {
    await stat(pathValue);
    return true;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code !== "ENOENT") throw error;
    await writeStore(EMPTY_STORE);
    return true;
  }
}

export async function registerCredentialUser(input: { email: string; name: string; password: string }) {
  const backend = getCredentialsBackend();
  if (backend === "supabase") {
    return registerSupabaseUser(input);
  }

  const email = normalizeEmail(input.email);
  const name = sanitizeName(input.name);

  return queueWrite(async () => {
    const store = await readStore();
    const exists = store.users.find((user) => user.email === email);
    if (exists) {
      return { ok: false as const, reason: "email_exists" as const };
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(input.password);
    const user: StoredUser = {
      id: randomUUID(),
      email,
      name,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };

    store.users.push(user);
    await writeStore(store);
    return { ok: true as const, user };
  });
}

export async function authenticateCredentialUser(input: { email: string; password: string }) {
  const backend = getCredentialsBackend();
  if (backend === "supabase") {
    return authenticateSupabaseUser(input);
  }

  const email = normalizeEmail(input.email);

  return queueWrite(async () => {
    const store = await readStore();
    const index = store.users.findIndex((user) => user.email === email);
    if (index < 0) {
      return { ok: false as const, reason: "invalid_credentials" as const };
    }

    const user = store.users[index];
    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      return { ok: false as const, reason: "invalid_credentials" as const };
    }

    const now = new Date().toISOString();
    const updated = { ...user, lastLoginAt: now, updatedAt: now };
    store.users[index] = updated;
    await writeStore(store);

    return { ok: true as const, user: updated };
  });
}

export async function credentialEmailExists(input: { email: string }) {
  const backend = getCredentialsBackend();
  if (backend === "supabase") {
    return checkSupabaseCredentialEmail(input);
  }

  const email = normalizeEmail(input.email);
  const store = await readStore();
  const exists = store.users.some((user) => user.email === email);
  return { ok: true as const, exists };
}
