import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_VERSION = "scrypt_v1";
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
} as const;

export function validatePassword(value: string) {
  const password = value.trim();
  if (password.length < 10) {
    return "Password must be at least 10 characters.";
  }
  if (password.length > 128) {
    return "Password is too long.";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers.";
  }
  return null;
}

function base64url(input: Uint8Array | Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function deriveKey(password: string, salt: Buffer) {
  const derived = scryptSync(password, salt, KEY_BYTES, SCRYPT_PARAMS);
  return Buffer.from(derived);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const derived = deriveKey(password, salt);
  return `${HASH_VERSION}$${base64url(salt)}$${base64url(derived)}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [version, encodedSalt, encodedValue] = encodedHash.split("$");
  if (version !== HASH_VERSION || !encodedSalt || !encodedValue) return false;

  let expected: Buffer;
  let salt: Buffer;
  try {
    salt = Buffer.from(encodedSalt, "base64url");
    expected = Buffer.from(encodedValue, "base64url");
  } catch {
    return false;
  }

  if (!salt.length || !expected.length) return false;

  const actual = deriveKey(password, salt);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
