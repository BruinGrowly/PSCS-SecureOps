'use client';

import { useEffect, useRef, useState } from 'react';
import {
  inspectSecureOps,
  issueHumanGrant,
  scenarios,
  type AuthorityGrant,
  type Consequence,
  type SecurityDecision,
} from './lib/secureops';
import { registerSecureOpsTools, SECUREOPS_WEBMCP_TOOL_NAMES } from './webmcp';

type WebMCPStatus = 'checking' | 'connected' | 'unavailable' | 'error';

export default function Home() {
  const [selected, setSelected] = useState(1);
  const [proposal, setProposal] = useState<Consequence>(scenarios[1].proposal);
  const [decision, setDecision] = useState<SecurityDecision | null>(null);
  const [grants, setGrants] = useState(new Map<string, AuthorityGrant>());
  const [grantsReady, setGrantsReady] = useState(false);
  const [webMCPStatus, setWebMCPStatus] = useState<WebMCPStatus>('checking');
  const grantStore = useRef(new Map<string, AuthorityGrant>());
  const uiLedger = useRef(new Set<string>());
  const scenario = scenarios[selected];
  const grant = grants.get(scenario.id) ?? null;
  const isAuthorizedProposal = proposal.operation === scenario.authorized.operation
    && proposal.target === scenario.authorized.target
    && proposal.payload === scenario.authorized.payload;

  useEffect(() => {
    let active = true;
    Promise.all(scenarios.map(async (item) => [item.id, await issueHumanGrant(item)] as const)).then((entries) => {
      if (!active) return;
      const nextGrants = new Map(entries);
      grantStore.current = nextGrants;
      setGrants(nextGrants);
      setGrantsReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!grantsReady) return;
    let controller: AbortController | null = null;
    registerSecureOpsTools({
      getGrant: (ticketId) => grantStore.current.get(ticketId) ?? null,
      onDecision: (nextDecision, nextProposal) => {
        const index = scenarios.findIndex((item) => item.id === nextDecision.ticketId);
        if (index >= 0) setSelected(index);
        setProposal(nextProposal);
        setDecision(nextDecision);
      },
    }).then((registered) => {
      controller = registered;
      setWebMCPStatus(registered ? 'connected' : 'unavailable');
    }).catch(() => setWebMCPStatus('error'));
    return () => controller?.abort();
  }, [grantsReady]);

  function chooseScenario(index: number) {
    setSelected(index);
    setProposal(scenarios[index].proposal);
    setDecision(null);
    uiLedger.current.clear();
  }

  async function run(nextProposal = proposal) {
    if (!grant) return;
    setProposal(nextProposal);
    setDecision(await inspectSecureOps(scenario, nextProposal, grant, {
      consume: true,
      ledger: uiLedger.current,
    }));
  }

  const statusCopy = webMCPStatus === 'connected'
    ? 'WebMCP connected'
    : webMCPStatus === 'checking'
      ? 'Detecting WebMCP'
      : 'Open in a WebMCP browser';
  const buttonCopy = decision?.effectPermitted ? 'Replay same grant' : 'Run through PSCS';
  const displayTrace = decision?.trace ?? [
    { id: 'recognition', label: 'Source recognized', detail: 'Ticket ≠ administrator', status: 'pass' as const },
    { id: 'purpose', label: 'Purpose retained', detail: 'Original support task intact', status: 'pass' as const },
    { id: 'authority', label: 'Authority separated', detail: 'Content cannot issue grants', status: 'pass' as const },
    { id: 'binding', label: 'Exact binding pending', detail: 'Operation + target + payload', status: 'fail' as const },
  ];

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">P</span>
          <div><strong>PSCS SecureOps</strong><span>Authority-safe agent operations</span></div>
        </div>
        <div className={`status-pill ${webMCPStatus}`}><span /> {statusCopy}</div>
        <button className="operator-button" type="button">Operator · Wellington</button>
      </header>

      <div className="workspace">
        <aside className="rail">
          <p className="eyebrow">Demo queue</p>
          <nav aria-label="Security scenarios">
            {scenarios.map((item, index) => (
              <button key={item.id} className={index === selected ? 'scenario active' : 'scenario'} onClick={() => chooseScenario(index)} type="button">
                <span className={`state-dot ${item.expected === 'block' ? 'blocked' : 'ready'}`} aria-hidden="true" />
                <span><b>{item.id}</b>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="tool-list">
            <p className="eyebrow">Registered tools</p>
            {SECUREOPS_WEBMCP_TOOL_NAMES.map((name) => <code key={name}>{name}</code>)}
          </div>
          <div className="rail-note">
            <span className="note-icon" aria-hidden="true">i</span>
            <p><strong>Core invariant</strong>Content may carry meaning. It cannot grant itself authority.</p>
          </div>
        </aside>

        <section className="content">
          <div className="content-heading">
            <div><p className="eyebrow">Live decision workspace</p><h1>{scenario.id} · {scenario.label}</h1><p className="scenario-summary">{scenario.summary}</p></div>
            <span className="mode-badge">DEMO MODE · NO REAL EFFECTS</span>
          </div>

          <div className="decision-grid">
            <article className="panel ticket-panel">
              <div className="panel-heading">
                <div><span className="step">01</span><p><b>Untrusted carrier</b>Service desk ticket</p></div>
                <span className="trust-tag untrusted">UNTRUSTED</span>
              </div>
              <div className="ticket-meta"><span>From</span> employee@corp.example <span>Priority</span> Normal</div>
              <div className="ticket-body">
                <p>{scenario.ticket}</p>
                {scenario.injectedText && <blockquote>{scenario.injectedText}</blockquote>}
              </div>
              <footer>Source identity: <code>ticket:{scenario.id}</code> · Authority: <code>none</code></footer>
            </article>

            <article className="panel proposal-panel">
              <div className="panel-heading">
                <div><span className="step">02</span><p><b>Agent proposal</b>Structured consequence</p></div>
                <span className="trust-tag observed">OBSERVED</span>
              </div>
              <dl className="fields">
                <div><dt>operation</dt><dd>{proposal.operation}</dd></div>
                <div><dt>target</dt><dd>{proposal.target}</dd></div>
                <div><dt>payload</dt><dd>{proposal.payload}</dd></div>
              </dl>
              <div className="action-stack">
                <button className="primary-action" type="button" onClick={() => run()} disabled={!grant}>{buttonCopy}<span>→</span></button>
                {decision && !decision.permitted && !isAuthorizedProposal && (
                  <button className="recovery-action" type="button" onClick={() => run(scenario.authorized)}>Run preserved legitimate task</button>
                )}
              </div>
            </article>

            <article className="panel authority-panel">
              <div className="panel-heading">
                <div><span className="step">03</span><p><b>Human authority</b>Exact runtime grant</p></div>
                <span className="trust-tag trusted">TRUSTED</span>
              </div>
              <dl className="grant-fields">
                <div><dt>operation</dt><dd>{scenario.authorized.operation}</dd></div>
                <div><dt>target</dt><dd>{scenario.authorized.target}</dd></div>
                <div><dt>payload digest</dt><dd>{grant ? `${grant.payloadDigest.slice(0, 14)}…` : 'issuing…'}</dd></div>
                <div><dt>scope</dt><dd>single use · 5 min</dd></div>
              </dl>
              <p className="authority-source"><span>✓</span> Issued outside agent-accessible tools</p>
            </article>
          </div>

          <section className={`trace-panel ${decision ? 'has-decision' : ''}`} aria-live="polite">
            <div className="trace-head">
              <div><span className="step">04</span><p><b>PSCS security trace</b>Meaning preserved · consequence governed</p></div>
              <span className={`decision ${decision ? decision.disposition : 'pending'}`}>
                {decision ? (decision.disposition === 'block' ? 'BLOCK / QUARANTINE' : decision.disposition.replaceAll('_', ' ').toUpperCase()) : 'READY TO VERIFY'}
              </span>
            </div>
            <div className="trace-steps">
              {displayTrace.map((item, index) => (
                <div className="trace-step" key={item.id}>
                  <span className={`check ${item.status}`}>{item.status === 'pass' ? '✓' : item.status === 'quarantine' ? '!' : index + 1}</span>
                  <div><b>{item.label}</b><small>{item.detail}</small></div>
                </div>
              ))}
            </div>
            {decision && (
              <div className={`decision-read ${decision.permitted ? 'allowed' : 'denied'}`}>
                <div><span>{decision.permitted ? '✓' : '×'}</span><p><b>{decision.reason}</b><small>{decision.recovery}</small></p></div>
                <code>{decision.reasonCodes.join(' · ')}</code>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
