/**
 * Copyright (c) 2026 Vladimir Kapustin
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * AIC — AI Control Tower Configurator
 * Scope: x_aic
 * Problem: No automated governance policy enforcement across AI agents.
 */
var AICPolicyEngine = Class.create();
AICPolicyEngine.prototype = {
    initialize: function() {
        this.version = "1.0.0";
        this.POLICY_RULES = [
            { id: "BYOK_REQUIRED", msg: "Generative AI Controller must have BYOK provider configured", severity: "CRITICAL" },
            { id: "AGENT_LOG_RETENTION", msg: "Agent conversation logs must exceed 90 days retention", severity: "HIGH" },
            { id: "HUMAN_IN_THE_LOOP", msg: "Critical-confidence agents require human approval", severity: "HIGH" },
            { id: "MCP_RATE_LIMIT", msg: "MCP servers must have rate limits defined", severity: "MEDIUM" }
        ];
    },

    runPolicyScan: function() {
        var findings = [];
        var i;
        // Scan AI agents
        try {
            var gr = new GlideRecord("sn_ai_agent");
            gr.query();
            while (gr.next()) {
                for (i = 0; i < this.POLICY_RULES.length; i++) {
                    var rule = this.POLICY_RULES[i];
                    var compliant = this._checkRule(rule, gr);
                    if (!compliant) {
                        findings.push({ agent: gr.getValue("name") || "", rule: rule.id, severity: rule.severity, msg: rule.msg });
                    }
                }
            }
        } catch (e) {}
        return { totalPolicies: this.POLICY_RULES.length, violations: findings.length, findings: findings, scanDate: new GlideDateTime().getDisplayValueInternal() };
    },

    _checkRule: function(rule, agentGR) {
        if (rule.id === "BYOK_REQUIRED") {
            try { var p = new GlideRecord("sn_generative_ai_cfg_provider"); p.setLimit(1); p.query(); return p.hasNext(); }
            catch(e) { return false; }
        }
        if (rule.id === "AGENT_LOG_RETENTION") {
            var days = parseInt(agentGR.getValue("log_retention_days") || "0", 10);
            return days >= 90;
        }
        if (rule.id === "HUMAN_IN_THE_LOOP") {
            var conf = agentGR.getValue("confidence_threshold") || "0";
            return parseFloat(conf) >= 0.85;
        }
        if (rule.id === "MCP_RATE_LIMIT") {
            var rl = agentGR.getValue("mcp_rate_limit") || "0";
            return parseInt(rl, 10) > 0;
        }
        return true;
    },

    type: "AICPolicyEngine"
};
