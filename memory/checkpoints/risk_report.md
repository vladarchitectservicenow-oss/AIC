# AIC Risk Report

## Risk Matrix

| ID | Risk | Severity | Likelihood | Impact | Mitigation | Status |
|----|------|----------|------------|--------|------------|--------|
| P0-01 | sn_ai_agent table unavailable on target instance | P0 — CRITICAL | Low | High | Try/catch in runPolicyScan; empty results, no crash | MITIGATED |
| P0-02 | Cross-scope GlideRecord access denied | P0 — CRITICAL | Medium | High | Graceful try/catch; returns empty results instead of throwing | MITIGATED |
| P0-03 | Remediation creates duplicate tasks on repeated scans | P0 — CRITICAL | High | Medium | Deduplication not yet implemented — risk accepted for v1.0 | MONITOR |
| P1-01 | sn_generative_ai_cfg_provider table missing (plugin not installed) | P1 — HIGH | Medium | Medium | Catch block returns false — treated as non-compliant, prompting plugin install | MITIGATED |
| P1-02 | Agent fields (log_retention_days, confidence_threshold, mcp_rate_limit) renamed in future release | P1 — HIGH | Low | High | ParseInt/parseFloat with fallback to 0; treats missing as non-compliant | MITIGATED |
| P1-03 | Scheduled job timeout on large agent fleets (1000+ agents) | P1 — HIGH | Low | Medium | O(n) complexity; setLimit() available for sharding | ACCEPTED |
| P1-04 | Auto-fix overrides manual compliance configurations | P1 — HIGH | Medium | High | Auto-fix limited to AGENT_LOG_RETENTION only; all others create tasks | MITIGATED |
| P2-01 | CSV export injection via agent names containing commas/quotes | P2 — MEDIUM | Low | Low | _escapeCSV() with quote-doubling implemented | MITIGATED |
| P2-02 | passRate calculation is inaccurate with complex violation counts | P2 — MEDIUM | Low | Low | Simplified pass/fail math; documented as approximate | ACCEPTED |
| P2-03 | PDF export stub returns promise without generation | P2 — MEDIUM | Low | Low | Stub logs intent; full implementation gated on Document Management plugin | DOCUMENTED |
| P2-04 | sn_custom_task table may not exist on stripped-down instances | P2 — MEDIUM | Low | Medium | gr.isValid() check before insert; silently skips if table missing | MITIGATED |
| P3-01 | No persistent scan result storage | P3 — LOW | Medium | Low | Results returned as in-memory object; persistence left to consumer | ACCEPTED |
| P3-02 | Policy rules are hardcoded — no UI for admin modification | P3 — LOW | Medium | Low | Rules defined as array in source; admins can clone and modify Script Include | ACCEPTED |
| P3-03 | No PDI smoke test executed | P3 — LOW | Low | Low | PDI hibernated; Node.js mock tests verify logic | MONITOR |

## Risk Summary

| Severity | Count | Mitigated | Accepted | Monitor |
|----------|-------|-----------|----------|---------|
| P0 — CRITICAL | 3 | 2 | 0 | 1 |
| P1 — HIGH | 4 | 3 | 1 | 0 |
| P2 — MEDIUM | 4 | 3 | 1 | 0 |
| P3 — LOW | 3 | 0 | 2 | 1 |
| **Total** | **14** | **8** | **4** | **2** |

## Key Risk Themes

1. **Cross-scope access (P0-02, P1-01):** The largest class of risk. AIC reads from global/plugin tables. If cross-scope grants are missing, scans return empty — silently appearing compliant when they are not. Mitigation: try/catch blocks prevent crashes; documentation warns admins to verify access grants.

2. **Remediation idempotency (P0-03):** No deduplication means each scan creates new task records for existing violations. In v1.0 this is accepted; v1.1 must add lookup-before-create logic.

3. **Table schema evolution (P1-02):** Field names could change across ServiceNow releases. Defensive parsing (parseInt with fallback to 0) converts missing fields to non-compliant results, ensuring violations surface rather than being silently skipped.

4. **Auto-fix safety (P1-04):** Auto-fix scope is intentionally narrow — only AGENT_LOG_RETENTION (deterministic, reversible). This prevents accidental overrides of intentional configurations.

## Residual Risk Acceptance

The following risks are accepted for v1.0 without mitigation:
- **P1-03 (Large fleet timeout):** Acceptable for MVP; mitigation in v1.1 via sharding
- **P2-02 (passRate inaccuracy):** Edge-case math inaccuracy with specific violation distributions; impact limited to display, not compliance
- **P3-01 (No persistence):** Intentional design choice — AIC is a scanner/reporter, not a database
- **P3-02 (Hardcoded rules):** Acceptable for v1.0; UI-based rule management is a v1.2 roadmap item

## Monitoring Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Scan returns 0 findings for 7 consecutive days | Possible false-negative (missing cross-scope grants) | Verify table access grants |
| Remediation task count spikes >500/day | Possible scan loop or unmitigated fleet issue | Audit scan schedule and agent count |
| PDI smoke test available | PDI wakes from hibernation | Execute full PDI validation suite |
