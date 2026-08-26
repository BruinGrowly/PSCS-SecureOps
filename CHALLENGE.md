# WebMCP Challenge submission notes

## One-sentence pitch

PSCS SecureOps lets browser agents use untrusted web content while independently verifying human authority before any consequential action is permitted.

## Judging map

| Criterion | Evidence in this project |
| --- | --- |
| WebMCP leverage | Four imperative tools with schemas, annotations, lifecycle cleanup, structured results, and direct application-logic wiring |
| Execution | Complete responsive Sites application with human authority, agent proposal, deterministic enforcement, recovery, and trace |
| Potential impact | Addresses the authority-substitution failure that makes prompt injection dangerous for agentic web actions |
| Creativity and ambition | Preserves useful hostile content while governing consequence, rather than classifying words as safe or unsafe |

## Demonstration arc (under three minutes)

1. **0:00–0:20 — Problem.** “A webpage can tell an agent what to do. Why should that give the webpage authority to cause the action?”
2. **0:20–0:45 — Normal work.** Open `INC-0042`; run the exact password-reset proposal; show the matching human grant and `ALLOW`.
3. **0:45–1:15 — Direct injection.** Open `INC-0043`; run the injected group-add proposal; show operation, target, and payload mismatch; show `BLOCK / QUARANTINE`.
4. **1:15–1:35 — Recovery.** Click “Run preserved legitimate task”; show the original reset can still proceed.
5. **1:35–1:55 — Authority impersonation.** Open `INC-0044`; show that claimed system policy does not change the ticket's source role.
6. **1:55–2:20 — Legitimate hostile text.** Open `INC-0045`; show authorized analysis is allowed while the quoted attack remains quarantined.
7. **2:20–2:40 — Replay.** Re-run an allowed grant; show single-use replay rejection.
8. **2:40–2:55 — Close.** “Meaning informs. Authority decides.”

## Required external deliverables

- Public ChatGPT Sites URL.
- Public source repository.
- Devpost project description and screenshots.
- Public YouTube demonstration under three minutes.
- Final eligibility and deadline confirmation against the live official rules.
