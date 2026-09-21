import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { execFile } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(process.cwd(), "scripts/add-stage.mjs");

/**
 * add-stage.mjs refuses a link it thinks is dead, and the whole value of that
 * check is that it is right about which statuses mean dead. It shells out to
 * curl against the real URL, so the only honest way to exercise it is to give
 * it a real URL that answers the status in question.
 */
let server: http.Server;
let port = 0;
/** Path segment -> status to answer with. */
const ROUTES: Record<string, number> = {
  "/blocked-429": 429,
  "/blocked-503": 503,
  "/blocked-401": 401,
  "/gone-404": 404,
  "/live-200": 200
};

const workspaces: string[] = [];

function makeWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "add-stage-"));
  workspaces.push(dir);
  fs.mkdirSync(path.join(dir, "src/content"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "src/content/stages.json"),
    JSON.stringify({ version: 1, updatedAt: "2026-09-21T12:00:00.000Z", items: [] }, null, 2)
  );
  return dir;
}

async function addStage(dir: string, urlPath: string) {
  return execFileAsync(
    process.execPath,
    [
      SCRIPT,
      "--role", "Stage PFE Cybersecurite",
      "--company", "Acme",
      "--city", "Rabat",
      "--country", "MA",
      "--kind", "pfe",
      "--link", `http://127.0.0.1:${port}${urlPath}`
    ],
    { cwd: dir }
  );
}

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const status = ROUTES[req.url || ""] ?? 404;
    res.writeHead(status, { "Content-Type": "text/html" });
    res.end("<html><body>test</body></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  port = typeof address === "object" && address ? address.port : 0;
});

afterAll(async () => {
  for (const dir of workspaces) fs.rmSync(dir, { recursive: true, force: true });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("a link the board refused us", () => {
  // check-stages.mjs already treats all of these as "blocked, not proof either
  // way". add-stage knew only 403/405/999, so a board rate-limiting us, or
  // mid-deployment, or behind a login wall, made it throw away a live posting
  // with "Not adding a dead link."
  for (const [label, urlPath] of [
    ["rate limited (429)", "/blocked-429"],
    ["temporarily unavailable (503)", "/blocked-503"],
    ["behind an auth wall (401)", "/blocked-401"]
  ] as const) {
    it(`is added anyway when the board is ${label}`, async () => {
      const dir = makeWorkspace();
      const { stdout } = await addStage(dir, urlPath);
      expect(stdout).toMatch(/Added:/);

      const file = JSON.parse(fs.readFileSync(path.join(dir, "src/content/stages.json"), "utf8"));
      expect(file.items).toHaveLength(1);
      expect(file.items[0].href).toBe(`http://127.0.0.1:${port}${urlPath}`);
    });
  }
});

describe("a link that is genuinely gone", () => {
  it("is still refused on a 404", async () => {
    const dir = makeWorkspace();
    await expect(addStage(dir, "/gone-404")).rejects.toThrow();
    const file = JSON.parse(fs.readFileSync(path.join(dir, "src/content/stages.json"), "utf8"));
    expect(file.items).toHaveLength(0);
  });
});

describe("a link that resolves", () => {
  it("is added", async () => {
    const dir = makeWorkspace();
    const { stdout } = await addStage(dir, "/live-200");
    expect(stdout).toMatch(/Link checked: HTTP 200/);
  });
});
