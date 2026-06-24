# Semi-Autopilot Mode

Use this mode when you want a manual PR-based run for review before merge.

## Workflow

- File: `.github/workflows/agents-semi-autopilot-pr.yml`
- Trigger:
  - manual dispatch

## Scheduling model

- Use `.github/workflows/auto-news-agent.yml` as the fast freshness workflow (every 2 hours, direct news sync).
- Use `.github/workflows/autopilot-agent.yml` as the broad daily maintenance workflow.
- Use this semi-autopilot workflow as the manual PR fallback mode.
- Keep `.github/workflows/agents-master.yml` for manual run profiles only.

## What runs automatically

1. auto tools ingestion
2. auto news ingestion
3. operator audit/action queue refresh
4. daily checklist generation (`docs/agent/daily-checklist.md`)
5. issue sync state refresh
6. health/privacy/affiliate verification

## Output behavior

- Changes are committed to branch `bot/semi-autopilot`.
- A pull request is opened/updated automatically.
- Main branch is not modified until you merge.

## Why use this mode

- Gives you human approval before production branch changes.
- Reduces risk of unwanted automated edits.
