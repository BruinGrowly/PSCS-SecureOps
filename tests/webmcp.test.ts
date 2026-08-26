import assert from 'node:assert/strict';
import test from 'node:test';
import {
  inspectSecureOps,
  issueHumanGrant,
  scenarios,
  type AuthorityGrant,
  type Consequence,
  type SecurityDecision,
} from '../app/lib/secureops.ts';
import { registerSecureOpsTools, SECUREOPS_WEBMCP_TOOL_NAMES } from '../app/webmcp.ts';

type RegisteredTool = {
  name: string;
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
};

type ToolResult = {
  structuredContent: SecurityDecision & { effect: string };
};

test('WebMCP execution uses the host shared replay ledger', async () => {
  const registered = new Map<string, RegisteredTool>();
  const priorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      modelContext: {
        registerTool: async (tool: RegisteredTool) => {
          registered.set(tool.name, tool);
        },
      },
    },
  });

  try {
    const scenario = scenarios[0];
    const grant: AuthorityGrant = await issueHumanGrant(scenario, Date.now(), 'webmcp-shared-ledger');
    const ledger = new Set<string>();
    let latestDecision: SecurityDecision | null = null;
    let latestProposal: Consequence | null = null;
    const controller = await registerSecureOpsTools({
      getGrant: () => grant,
      getExecutionLedger: () => ledger,
      onDecision: (decision, proposal) => {
        latestDecision = decision;
        latestProposal = proposal;
      },
    });

    assert.deepEqual([...registered.keys()], [...SECUREOPS_WEBMCP_TOOL_NAMES]);
    const executeTool = registered.get('execute_approved_action');
    assert.ok(executeTool);
    const result = await executeTool.execute({
      ticket_id: scenario.id,
      operation: scenario.proposal.operation,
      target: scenario.proposal.target,
      payload: scenario.proposal.payload,
    }) as ToolResult;
    assert.equal(result.structuredContent.effect, 'demo_effect_recorded');
    assert.equal(latestDecision?.effectPermitted, true);
    assert.deepEqual(latestProposal, scenario.proposal);

    const replay = await inspectSecureOps(scenario, scenario.proposal, grant, { consume: true, ledger });
    assert.deepEqual(replay.reasonCodes, ['grant_replay']);
    controller?.abort();
  } finally {
    if (priorDocument) {
      Object.defineProperty(globalThis, 'document', priorDocument);
    } else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  }
});
