import { describe, expect, it } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { contentSurvivedPipelineFailure } from "../scripts/autopilot-agent.mjs";
// @ts-expect-error - plain .mjs script, no types
import { STEP_KINDS, stepKind } from "../scripts/agent-pipeline.mjs";

const RUN_STARTED = "2026-10-30T10:00:00.000Z";

function status(summary: Record<string, unknown>, generatedAt = "2026-10-30T10:00:05.000Z") {
  return { generatedAt, summary };
}

describe("pipeline step classification", () => {
  it("treats the issue sync as reporting, not content", () => {
    expect(STEP_KINDS.issues).toBe("notify");
  });

  it("treats every step that writes to src/content as content", () => {
    for (const id of ["auto-tools", "auto-news", "operator", "design", "daily-checklist"]) {
      expect(stepKind(id)).toBe("content");
    }
  });

  it("calls an unclassified step content, so a new step cannot opt itself out of rollback", () => {
    expect(stepKind("some-step-added-later")).toBe("content");
  });
});

describe("keeping content when only the reporting failed", () => {
  it("keeps it when the pipeline says the content steps passed and the sync did not", () => {
    expect(
      contentSurvivedPipelineFailure(status({ contentOk: true, notifyFailed: ["Issue sync"] }), RUN_STARTED)
    ).toBe(true);
  });

  it("rolls back when a content step failed", () => {
    expect(
      contentSurvivedPipelineFailure(status({ contentOk: false, notifyFailed: ["Issue sync"] }), RUN_STARTED)
    ).toBe(false);
  });

  /*
   * The cases below are the ones that cost real work when guessed. Each asks
   * the same question: is "I cannot tell" being read as "it is fine"? It must
   * not be -- the only answer that keeps the content is a positive verdict
   * from this run.
   */
  it("rolls back when there is no status file at all, rather than assuming success", () => {
    expect(contentSurvivedPipelineFailure(null, RUN_STARTED)).toBe(false);
    expect(contentSurvivedPipelineFailure(undefined, RUN_STARTED)).toBe(false);
  });

  it("ignores a status file left by an earlier run", () => {
    const stale = status({ contentOk: true, notifyFailed: ["Issue sync"] }, "2026-10-29T23:00:00.000Z");
    expect(contentSurvivedPipelineFailure(stale, RUN_STARTED)).toBe(false);
  });

  it("rolls back when the pipeline is too old to report contentOk", () => {
    expect(contentSurvivedPipelineFailure(status({ notifyFailed: ["Issue sync"] }), RUN_STARTED)).toBe(false);
  });

  it("rolls back when nothing names the reporting step that failed", () => {
    // contentOk is also true when nothing failed, so on its own it cannot
    // distinguish "only the sync failed" from "the pipeline died before it
    // recorded anything".
    expect(contentSurvivedPipelineFailure(status({ contentOk: true, notifyFailed: [] }), RUN_STARTED)).toBe(false);
    expect(contentSurvivedPipelineFailure(status({ contentOk: true }), RUN_STARTED)).toBe(false);
  });

  it("rolls back when either timestamp is unreadable", () => {
    const summary = { contentOk: true, notifyFailed: ["Issue sync"] };
    expect(contentSurvivedPipelineFailure(status(summary, "not a date"), RUN_STARTED)).toBe(false);
    expect(contentSurvivedPipelineFailure(status(summary), "not a date")).toBe(false);
  });
});
