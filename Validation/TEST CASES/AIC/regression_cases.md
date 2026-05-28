# AIC Regression Cases

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-28 | Vladimir Kapustin | Initial regression suite (R01-R10) |

## Regression Scenarios

### R01 — Policy Engine Version Stability

**Trigger:** AICPolicyEngine version field (`this.version`) must remain "1.0.0" after any hotfix.

**Verification:**
```javascript
var e = new AICPolicyEngine();
assert.strictEqual(e.version, "1.0.0", "R01: Version must not change without bump");
```

**Severity:** P2 — version drift could break compatibility checks.

### R02 — POLICY_RULES Array Integrity

**Trigger:** Adding/removing rules must not change existing rule indices or IDs.

**Verification:**
```javascript
var rules = e.POLICY_RULES.map(function(r) { return r.id; });
assert.ok(rules.indexOf("BYOK_REQUIRED") !== -1, "R02: BYOK_REQUIRED rule present");
assert.ok(rules.indexOf("AGENT_LOG_RETENTION") !== -1, "R02: AGENT_LOG_RETENTION rule present");
assert.ok(rules.indexOf("HUMAN_IN_THE_LOOP") !== -1, "R02: HITL rule present");
assert.ok(rules.indexOf("MCP_RATE_LIMIT") !== -1, "R02: MCP_RATE_LIMIT rule present");
assert.strictEqual(rules.length, 4, "R02: Exactly 4 rules loaded");
```

**Severity:** P0 — missing rule = silent compliance gap.

### R03 — runPolicyScan Return Schema

**Trigger:** Any code change that modifies the return object structure.

**Verification:**
```javascript
var r = e.runPolicyScan();
assert.ok("totalPolicies" in r, "R03: totalPolicies field");
assert.ok("violations" in r, "R03: violations field");
assert.ok("findings" in r, "R03: findings field");
assert.ok("scanDate" in r, "R03: scanDate field");
```

**Severity:** P1 — downstream consumers (reporter, remediation) depend on schema.

### R04 — Compliance Reporter Output Schema

**Trigger:** Any modification to buildReport() return object.

**Verification:**
```javascript
var rep = new AICComplianceReporter();
var scan = { totalPolicies: 4, violations: 2, findings: [{agent: "X", rule: "Y", severity: "HIGH", msg: "Z"}], scanDate: "20260528" };
var report = rep.buildReport(scan);
assert.ok("totalPolicies" in report, "R04: totalPolicies");
assert.ok("totalViolations" in report, "R04: totalViolations");
assert.ok("passRate" in report, "R04: passRate");
assert.ok("findings" in report, "R04: findings");
assert.ok("summaryBySeverity" in report, "R04: summaryBySeverity");
assert.ok("recommendations" in report, "R04: recommendations");
assert.ok("auditTrail" in report, "R04: auditTrail");
```

**Severity:** P1 — report consumers depend on field existence.

### R05 — CSV Export Escaping

**Trigger:** Agent name contains comma or quote character.

**Verification:**
```javascript
var rep = new AICComplianceReporter();
var scan = { totalPolicies: 4, violations: 1, findings: [{agent: "Agent, Inc.", rule: "R1", severity: "MEDIUM", msg: 'Needs "fix"'}] };
var report = rep.buildReport(scan);
var csv = rep.exportToCSV(report);
var lines = csv.trim().split("\n");
// Message field should be quoted
assert.ok(lines[1].indexOf('"') !== -1, "R05: CSV field with comma should be quoted");
```

**Severity:** P1 — malformed CSV breaks auditor tooling.

### R06 — Remediation Engine Graceful on Missing Table

**Trigger:** sn_custom_task table missing from instance.

**Verification:**
```javascript
// Mock sn_custom_task as MISSING (not in DB)
var rem = new AICRemediationEngine();
var backup = global.GlideRecord;
// Override to simulate missing table
global.GlideRecord = function(table) {
    if (table === "sn_custom_task") {
        var gr = new MockGR(table, []);
        gr.isValid = function() { return false; };
        return gr;
    }
    return new MockGR(table, DB[table] || []);
};
var summary = rem.remediate([{agent: "A", rule: "R1", severity: "LOW", msg: "M"}]);
assert.strictEqual(summary.created, 0, "R06: Zero tasks when table missing — no crash");
global.GlideRecord = backup;
```

**Severity:** P1 — crash on missing table blocks all scans.

### R07 — Auto-Fix Only Modifies Log Retention

**Trigger:** Auto-fix called on non-AGENT_LOG_RETENTION rule.

**Verification:**
```javascript
var rem = new AICRemediationEngine();
var result = rem.autoFix({agent: "Agent Alpha", rule: "MCP_RATE_LIMIT", severity: "MEDIUM"});
assert.strictEqual(result, false, "R07: Auto-fix only for AGENT_LOG_RETENTION");
```

**Severity:** P0 — auto-fix on wrong rule = unauthorized configuration change.

### R08 — BYOK Check Returns False When Table Missing

**Trigger:** sn_generative_ai_cfg_provider table removed from instance.

**Verification:**
```javascript
var origDB = DB["sn_generative_ai_cfg_provider"];
delete DB["sn_generative_ai_cfg_provider"];
var e = new AICPolicyEngine();
var r = e.runPolicyScan();
var byok = r.findings.filter(function(f) { return f.rule === "BYOK_REQUIRED"; });
assert.ok(byok.length > 0, "R08: Missing provider table = BYOK violation");
DB["sn_generative_ai_cfg_provider"] = origDB;
```

**Severity:** P1 — silent false-negative if missing table = compliant.

### R09 — String-to-Float Safety for Numeric Fields

**Trigger:** Agent fields contain non-numeric strings (e.g. "N/A", "off").

**Verification:**
```javascript
DB["sn_ai_agent"] = [{ name: "BrokenAgent", log_retention_days: "N/A", confidence_threshold: "off", mcp_rate_limit: "∞", sys_id: "b1" }];
var e = new AICPolicyEngine();
var r = e.runPolicyScan();
// All rules should trigger violations (non-numeric = 0 after parseInt/parseFloat)
assert.ok(r.violations >= 3, "R09: Non-numeric fields = violations, not crash");
var rules = r.findings.map(function(f) { return f.rule; });
assert.ok(rules.indexOf("AGENT_LOG_RETENTION") !== -1, "R09: Log retention violation");
assert.ok(rules.indexOf("HUMAN_IN_THE_LOOP") !== -1, "R09: HITL violation");
assert.ok(rules.indexOf("MCP_RATE_LIMIT") !== -1, "R09: MCP rate violation");
```

**Severity:** P1 — crash on parseInt("N/A") blocks all agents.

### R10 — Report Handles Zero Violations

**Trigger:** Scan with 0 violations.

**Verification:**
```javascript
var rep = new AICComplianceReporter();
var cleanScan = { totalPolicies: 4, violations: 0, findings: [], scanDate: "2026" };
var report = rep.buildReport(cleanScan);
assert.strictEqual(report.violations, 0, "R10: Zero violations");
assert.strictEqual(report.passRate, 100, "R10: 100% pass rate");
assert.strictEqual(report.findings.length, 0, "R10: Empty findings");
```

**Severity:** P2 — incorrect pass rate on clean scan is cosmetic but misleading.

## Run All Regression Cases

```javascript
function runRegression() {
    var failures = [];
    var tests = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10];
    for (var i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            console.log("  R" + String(i+1).padStart(2, '0') + " PASSED");
        } catch(e) {
            console.log("  R" + String(i+1).padStart(2, '0') + " FAILED: " + e.message);
            failures.push("R" + String(i+1).padStart(2, '0'));
        }
    }
    console.log("\n" + (tests.length - failures.length) + "/" + tests.length + " passed");
    if (failures.length) console.log("FAILURES: " + failures.join(", "));
}
```

## Regression Run History

| Date | Tester | Passed | Failed | Notes |
|------|--------|--------|--------|-------|
| 2026-05-28 | Automated | — | — | Initial suite — awaiting first run |
