# Challenge provenance

## Pre-existing work

Repository: `BruinGrowly/PSCS-Semantic-Security`

Anchor commit: `1760c615c12e078117f806c4ac307f7efffca4d4`

Commit date: `2026-08-02T19:17:27+10:00`

Pre-existing material includes the typed Python kernel, bounded observation adapter, exact authority model, authenticated runtime envelope and grant, replay ledger, tests, technical notes, and evidence-boundary documentation.

## New challenge work

PSCS SecureOps was started after the WebMCP challenge opened on August 25, 2026. Its new work includes:

- ChatGPT Sites application and responsive operations console;
- imperative `document.modelContext.registerTool(...)` integration;
- `read_ticket`, `propose_action`, `execute_approved_action`, and `get_security_trace` tools;
- a Sites-compatible, narrow TypeScript enforcement profile;
- human-only demo grant construction;
- four competition demonstration scenarios;
- visual PSCS decision and recovery trace;
- executable TypeScript tests; and
- challenge documentation and deployment metadata.

## Relationship to the PSCS kernel

The TypeScript profile preserves the exact consequence boundary used by this demo: request/session, operation, target, SHA-256 payload digest, time window, and single-use state. It is independently testable but is not presented as a line-for-line port or as the full PSCS Harness.

The full Python runtime additionally binds HMAC-authenticated decision envelopes, grounded review, principled measurement, and—when used—the recurrent carrier-recognition result. Those features remain in the pre-existing PSCS repository and are outside this browser-only challenge slice.
