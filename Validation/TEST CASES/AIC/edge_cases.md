# AIC Edge Cases

## E01 — Agent With All Fields at Boundary Values

**Scenario:** Agent has exactly the threshold values for each rule.

**Input:**
- log_retention_days = "90" (exactly at threshold)
- confidence_threshold = "0.85" (exactly at threshold)
- mcp_rate_limit = "1" (just above zero)

**Expected Behavior:**
- AGENT_LOG_RETENTION: PASS (≥ 90)
- HUMAN_IN_THE_LOOP: PASS (≥ 0.85)
- MCP_RATE_LIMIT: PASS (> 0)

**Risk:** Off-by-one errors in comparison operators.

**Test:**
```javascript
DB["sn_ai_agent"] = [{ name: "BoundaryAgent", log_retention_days: "90", confidence_threshold: "0.85", mcp_rate_limit: "1", sys_id: "e1" }];
var r = engine.runPolicyScan();
var logV = r.findings.filter(f => f.rule === "AGENT_LOG_RETENTION");
assert.strictEqual(logV.length, 0, "E01: 90 days should PASS");
var hitlV = r.findings.filter(f => f.rule === "HUMAN_IN_THE_LOOP");
assert.strictEqual(hitlV.length, 0, "E01: 0.85 threshold should PASS");
var mcpV = r.findings.filter(f => f.rule === "MCP_RATE_LIMIT");
assert.strictEqual(mcpV.length, 0, "E01: Rate limit 1 should PASS");
```

## E02 — Agent With Empty String Fields

**Scenario:** All string fields are empty strings (not null, not undefined).

**Input:**
- log_retention_days = ""
- confidence_threshold = ""
- mcp_rate_limit = ""

**Expected Behavior:**
- All three rules trigger violations (empty → parseInt/parseFloat → 0 → non-compliant)

**Risk:** Empty string vs null handling — parseInt("") returns NaN, not 0. Code uses `|| "0"` fallback.

**Test:**
```javascript
DB["sn_ai_agent"] = [{ name: "EmptyFields", log_retention_days: "", confidence_threshold: "", mcp_rate_limit: "", sys_id: "e2" }];
var r = engine.runPolicyScan();
assert.ok(r.violations >= 3, "E02: Empty fields = all violations");
```

## E03 — Negative Values in Numeric Fields

**Scenario:** Agent has negative retention days, confidence, or rate limit.

**Input:**
- log_retention_days = "-30"
- confidence_threshold = "-1"
- mcp_rate_limit = "-5"

**Expected Behavior:**
- All three trigger violations (negative < threshold)

**Risk:** Negative values could bypass parseInt safety checks.

**Test:**
```javascript
DB["sn_ai_agent"] = [{ name: "NegativeValues", log_retention_days: "-30", confidence_threshold: "-1", mcp_rate_limit: "-5", sys_id: "e3" }];
var r = engine.runPolicyScan();
var logV = r.findings.filter(f => f.rule === "AGENT_LOG_RETENTION");
assert.ok(logV.length > 0, "E03: Negative retention = violation");
```

## E04 — Extremely Large String Values

**Scenario:** Numeric fields contain strings far beyond integer range.

**Input:**
- log_retention_days = "9999999999999999999999"
- mcp_rate_limit = "9999999999999999999999"

**Expected Behavior:**
- parseInt may overflow to Infinity or large int. Rule should handle gracefully (either pass or fail, but no crash).

**Risk:** JavaScript parseInt on giant strings → possible Infinity.

**Test:**
```javascript
DB["sn_ai_agent"] = [{ name: "GiantValues", log_retention_days: "9999999999999999999999", confidence_threshold: "0.5", mcp_rate_limit: "9999999999999999999999", sys_id: "e4" }];
var r = engine.runPolicyScan();
// Should not crash — just check it runs
assert.ok(r.violations >= 0, "E04: Giant values — no crash");
```

## E05 — Agent Name With Special Characters

**Scenario:** Agent name contains characters that could break CSV/JSON.

**Input:**
- name = 'Agent "Sensitive" (HQ/NY), Finance — [TOP SECRET]'

**Expected Behavior:**
- CSV export properly escapes quotes and commas
- JSON report does not contain unescaped control characters

**Test:**
```javascript
DB["sn_ai_agent"] = [{ name: 'Agent "Sensitive" (HQ/NY), Finance — [TOP SECRET]', log_retention_days: "30", confidence_threshold: "0.5", mcp_rate_limit: "0", sys_id: "e5" }];
var r = engine.runPolicyScan();
var reporter = new AICComplianceReporter();
var report = reporter.buildReport(r);
var csv = reporter.exportToCSV(report);
// CSV should have at least one row (header + data)
var lines = csv.trim().split("\n");
assert.ok(lines.length >= 2, "E05: CSV export with special chars");
// Verify agent name appears quoted
assert.ok(lines[1].indexOf('"') !== -1 || lines[1].indexOf("Agent") !== -1, "E05: Agent name in CSV");
```

## E06 — Concurrent Scan Invocations

**Scenario:** Two rapid invocations of runPolicyScan() without state reset.

**Input:** DB with 100 agents. Call runPolicyScan() twice in succession.

**Expected Behavior:**
- Second invocation produces identical (or superset) results
- No shared mutable state contamination between calls

**Risk:** Instance variables not reset between calls — GlideRecord cursor leaks.

**Test:**
```javascript
DB["sn_ai_agent"] = Array.from({length: 100}, (_, i) => ({
    name: "Agent" + i,
    log_retention_days: String(30 + (i % 2) * 100),
    confidence_threshold: String(0.5 + (i % 2) * 0.4),
    mcp_rate_limit: String(i % 2 * 100),
    sys_id: "m" + i
}));
var r1 = engine.runPolicyScan();
var r2 = engine.runPolicyScan();
assert.ok(r1.violations >= 0, "E06: First scan runs");
assert.ok(r2.violations >= 0, "E06: Second scan runs");
// Violation counts should be similar (not zero due to state loss)
assert.ok(r2.violations > 0, "E06: Second scan should also find violations");
```
