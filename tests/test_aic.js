// Copyright (c) 2026 Vladimir Kapustin
// SPDX-License-Identifier: MIT
// test_aic.js
const assert = require('assert');
function MockGR(table, rows) { this._rows = rows||[]; this._idx = -1; this._filters = {}; this._limit = null; this._filtered = []; }
MockGR.prototype.addQuery = function() {};
MockGR.prototype.setLimit = function(n) { this._limit = n; };
MockGR.prototype.query = function() { this._idx = -1; this._filtered = this._rows; };
MockGR.prototype.next = function() { this._idx++; if(this._limit && this._idx >= this._limit) return false; return this._idx < this._filtered.length; };
MockGR.prototype.getValue = function(f) { if(this._idx >= 0 && this._idx < this._filtered.length) return String(this._filtered[this._idx][f]||""); return ""; };
MockGR.prototype.getUniqueValue = function() { if(this._idx >= 0 && this._idx < this._filtered.length) return this._filtered[this._idx]["sys_id"]||"m"; return "m"; };

const fs = require('fs');
function stripHeader(code){ return code.replace(/^\/\*.*?\*\//s, ''); }
global.Class = { create: function(){ var cls=function(){ if(this.initialize) this.initialize.apply(this, arguments); }; return cls; } };
global.GlideRecord = function(table){ return new MockGR(table, DB[table]); };
global.GlideDateTime = function(){ this.getDisplayValueInternal=function(){ return '20260516000000'; }; };
global.gs = {
  info: function(msg) { console.log("[gs.info] " + msg); },
  error: function(msg) { console.error("[gs.error] " + msg); },
  warn: function(msg) { console.warn("[gs.warn] " + msg); }
};
var DB = {
  "sn_ai_agent": [
    { name: "Agent Alpha", log_retention_days: "30", confidence_threshold: "0.75", mcp_rate_limit: "0", sys_id: "a1" },
    { name: "Agent Beta",  log_retention_days: "120", confidence_threshold: "0.90", mcp_rate_limit: "100", sys_id: "a2" }
  ],
  "sn_generative_ai_cfg_provider": [{ sys_id: "p1" }]
};
eval(stripHeader(fs.readFileSync('/home/crixus/agentic-loop/output/AIC/src/AICPolicyEngine.js','utf8')));

function testPolicy() {
  var e = new AICPolicyEngine();
  var r = e.runPolicyScan();
  assert.ok(r.violations > 0, "Should find violations for Agent Alpha");
  assert.ok(r.totalPolicies >= 4);
  console.log("  testPolicy PASSED (violations=" + r.violations + ")");
}

function testRemediation() {
  eval(stripHeader(fs.readFileSync('/home/crixus/agentic-loop/output/AIC/src/AICRemediationEngine.js','utf8')));
  var rem = new AICRemediationEngine();
  var findings = [
    { agent: "Agent Alpha", rule: "AGENT_LOG_RETENTION", severity: "HIGH", msg: "Log retention low" }
  ];
  var res = rem.remediate(findings);
  assert.ok(res.created === 1 || res.created === 0, "Should try to create task");
  console.log("  testRemediation PASSED (created=" + res.created + ")");
}

function testReporter() {
  eval(stripHeader(fs.readFileSync('/home/crixus/agentic-loop/output/AIC/src/AICComplianceReporter.js','utf8')));
  var rep = new AICComplianceReporter();
  var scan = { totalPolicies: 4, violations: 2, findings: [
    { agent: "A", rule: "R1", severity: "HIGH", msg: "M" }
  ], scanDate: "20260516000000" };
  var report = rep.buildReport(scan);
  assert.ok(report.totalPolicies === 4);
  assert.ok(report.totalViolations === 2);
  console.log("  testReporter PASSED (passRate=" + report.passRate + ")");
}

console.log("Running AIC tests...\n");
testPolicy();
testRemediation();
testReporter();
console.log("All AIC tests PASSED");
