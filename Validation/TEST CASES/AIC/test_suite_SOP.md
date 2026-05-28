# AIC Test Suite SOP

## Test Environment

- **Runtime:** Node.js ≥14.x with ServiceNow mock APIs
- **Mock Framework:** `tests/test_aic.js` — MockGR, Class.create, GlideDateTime, gs
- **Test data:** Inline DB object with 2 agents (Alpha non-compliant, Beta compliant) + 1 BYOK provider

## Pre-Test Checklist

- [ ] Node.js installed (`node --version` ≥14)
- [ ] `tests/test_aic.js` exists and loads all 3 source files
- [ ] MockGR implements `addQuery`, `setLimit`, `query`, `next`, `getValue`, `getUniqueValue`
- [ ] No hardcoded `7%%gXJzImsW7` or `GITHUB_TOKEN` in source

## Test Scenarios

### T01 — Policy Engine Returns All 4 Rules

**Description:** Verify runPolicyScan() evaluates all 4 default rules.

**Input:** DB with 2 agents (Alpha: non-compliant on 3 rules, Beta: compliant on all 4)

**Expected:**
- `result.totalPolicies === 4`
- `result.violations > 0`
- `result.findings` is an array
- `result.scanDate` is a non-empty string

**Node.js assert:**
```javascript
assert.ok(result.totalPolicies === 4, "T01: Should declare 4 policies");
assert.ok(result.violations > 0, "T01: Should detect violations");
assert.ok(Array.isArray(result.findings), "T01: findings must be array");
assert.ok(result.scanDate.length > 0, "T01: scanDate must be set");
```

### T02 — BYOK Rule Detects Missing Provider

**Description:** Agent on instance without BYOK provider triggers CRITICAL violation.

**Input:** DB has `sn_generative_ai_cfg_provider` with 1 provider record (BYOK present)

**Expected:** No BYOK violation (provider exists)

**Variant (remove provider from DB):** Each agent generates BYOK_REQUIRED violation

```javascript
// Re-run with empty sn_generative_ai_cfg_provider
DB["sn_generative_ai_cfg_provider"] = [];
var r2 = engine.runPolicyScan();
var byokViolations = r2.findings.filter(function(f) { return f.rule === "BYOK_REQUIRED"; });
assert.ok(byokViolations.length > 0, "T02: Missing BYOK should trigger violations");
```

### T03 — Log Retention Below Threshold

**Description:** Agent with log_retention_days=30 triggers HIGH violation.

**Input:** Agent Alpha: log_retention_days="30" (threshold: 90)

**Expected:**
- Agent Alpha has AGENT_LOG_RETENTION violation
- Agent Beta (log_retention_days="120") has no violation

```javascript
var logViolations = result.findings.filter(function(f) { return f.rule === "AGENT_LOG_RETENTION"; });
assert.ok(logViolations.some(function(f) { return f.agent === "Agent Alpha"; }), "T03: Alpha should violate log retention");
assert.ok(!logViolations.some(function(f) { return f.agent === "Agent Beta"; }), "T03: Beta should pass");
```

### T04 — Human-in-the-Loop Threshold

**Description:** Agent with confidence_threshold=0.75 violates HITL rule (threshold: 0.85).

**Input:** Agent Alpha: confidence_threshold="0.75", Agent Beta: confidence_threshold="0.90"

**Expected:** Alpha violates, Beta passes

```javascript
var hitlViolations = result.findings.filter(function(f) { return f.rule === "HUMAN_IN_THE_LOOP"; });
assert.ok(hitlViolations.some(function(f) { return f.agent === "Agent Alpha"; }), "T04: Alpha should violate HITL");
```

### T05 — MCP Rate Limit Zero

**Description:** Agent with mcp_rate_limit=0 violates MEDIUM rule.

**Input:** Agent Alpha: mcp_rate_limit="0", Agent Beta: mcp_rate_limit="100"

**Expected:** Alpha violates, Beta passes

```javascript
var mcpViolations = result.findings.filter(function(f) { return f.rule === "MCP_RATE_LIMIT"; });
assert.ok(mcpViolations.some(function(f) { return f.agent === "Agent Alpha"; }), "T05: Alpha should violate MCP rate limit");
```

### T06 — Empty Agent Table (No Agents)

**Description:** No agents in sn_ai_agent — scan completes with zero violations.

**Input:** DB.sn_ai_agent = []

**Expected:**
- `result.totalPolicies === 4`
- `result.violations === 0`
- `result.findings.length === 0`

```javascript
DB["sn_ai_agent"] = [];
var r3 = engine.runPolicyScan();
assert.ok(r3.totalPolicies === 4, "T06: Should still report 4 policies");
assert.ok(r3.violations === 0, "T06: Zero agents = zero violations");
assert.ok(r3.findings.length === 0, "T06: No findings array");
```

### T07 — Missing Table Graceful Degradation

**Description:** sn_generative_ai_cfg_provider table missing entirely (plugin not installed).

**Input:** Remove table from DB entirely

**Expected:** BYOK check returns false (non-compliant), scan does not crash

```javascript
delete DB["sn_generative_ai_cfg_provider"];
var r4 = engine.runPolicyScan();
assert.ok(r4.violations > 0, "T07: Should report BYOK violations when table missing");
```

### T08 — Compliance Reporter Generates Valid JSON

**Description:** buildReport produces structured report with required fields.

**Input:** Scan result with 4 policies, 2 violations, 1 finding

**Expected:**
- report.scanDate is set
- report.totalPolicies === 4
- report.totalViolations === 2
- report.passRate is a number between 0-100
- report.summaryBySeverity is an object
- report.findings is an array (1 element)
- report.recommendations is an array

```javascript
var report = reporter.buildReport(scanResult);
assert.ok(report.totalPolicies === 4, "T08: Correct policy count");
assert.ok(report.totalViolations === 2, "T08: Correct violation count");
assert.ok(typeof report.passRate === "number", "T08: passRate is numeric");
assert.ok(report.findings.length === 1, "T08: Finding count preserved");
```

### T09 — CSV Export Format Valid

**Description:** exportToCSV produces RFC 4180-compatible CSV.

**Input:** Report with 1 finding

**Expected:**
- First line is header: "Agent,Rule,Severity,Message,Timestamp"
- Second line contains finding data
- Commas in message are properly escaped

```javascript
var csv = reporter.exportToCSV(report);
var lines = csv.trim().split("\n");
assert.ok(lines[0] === "Agent,Rule,Severity,Message,Timestamp", "T09: CSV header");
assert.ok(lines.length >= 2, "T09: At least 1 data row");
```

### T10 — Remediation Creates Task Records

**Description:** remediate() creates sn_custom_task for each finding.

**Input:** 2 findings (non-empty)

**Expected:** created ≥ 1 (may fail if sn_custom_task mock doesn't support insert)

```javascript
var summary = rem.remediate(findings);
assert.ok(summary.created >= 0, "T10: Remediation summary returned");
assert.ok(Array.isArray(summary.tasks), "T10: Tasks array returned");
```

### T11 — Severity-to-Priority Mapping

**Description:** _severityToPriority maps CRITICAL→1, HIGH→2, MEDIUM→3, LOW→4.

**Input:** Each severity string

**Expected:**
- CRITICAL → 1
- HIGH → 2
- MEDIUM → 3
- LOW → 4

```javascript
assert.ok(rem._severityToPriority("CRITICAL") === 1, "T11: CRITICAL → 1");
assert.ok(rem._severityToPriority("HIGH") === 2, "T11: HIGH → 2");
assert.ok(rem._severityToPriority("MEDIUM") === 3, "T11: MEDIUM → 3");
assert.ok(rem._severityToPriority("LOW") === 4, "T11: LOW → 4");
assert.ok(rem._severityToPriority("UNKNOWN") === 3, "T11: Unknown → 3 (default)");
```

### T12 — Empty Findings Array (No Violations)

**Description:** remediate with empty findings array returns early.

**Input:** findings = []

**Expected:**
- summary.created === 0
- summary.tasks is empty array
- No error logged

```javascript
var summary = rem.remediate([]);
assert.ok(summary.created === 0, "T12: Zero tasks for empty findings");
assert.ok(summary.tasks.length === 0, "T12: Empty tasks array");
```

## Run Order

1. T01-T05: Core functional (requires standard DB)
2. T06-T07: Edge states (modify DB mid-test)
3. T08-T09: Reporter module
4. T10-T12: Remediation module

## Pass Criteria

- ALL 12 scenarios must PASS
- Any FAIL → fix source, re-run from beginning
- 0 PASS → CRITICAL FAILURE — rollback deployment
