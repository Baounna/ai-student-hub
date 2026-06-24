import fs from "node:fs";
import path from "node:path";

const DEFAULT_FILES = [".env.local", ".env"];

function parseLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const index = trimmed.indexOf("=");
  if (index < 1) return null;

  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();
  if (!key) return null;

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export function loadScriptEnv(root = process.cwd(), fileNames = DEFAULT_FILES) {
  const applied = [];

  for (const fileName of fileNames) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const entry = parseLine(line);
      if (!entry) continue;
      if (process.env[entry.key] != null && String(process.env[entry.key]).trim() !== "") continue;
      process.env[entry.key] = entry.value;
      applied.push(entry.key);
    }
  }

  return applied;
}
