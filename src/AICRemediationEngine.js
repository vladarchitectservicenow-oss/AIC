/**
 * Copyright (c) 2026 Vladimir Kapustin
 * SPDX-License-Identifier: MIT
 *
 * AICRemediationEngine — AI Control Tower Configurator
 * Scope: x_aic
 * Purpose: Auto-creates remediation tasks for policy violations.
 */
var AICRemediationEngine = Class.create();
AICRemediationEngine.prototype = {
    initialize: function() {
        this.version = "1.0.0";
    },

    /**
     * remediate - processes findings and creates remediation tasks
     * @param {Array} findings - array of violation objects from policy scan
     * @returns {Object} remediation summary with created task sys_ids
     */
    remediate: function(findings) {
        var createdTasks = [];
        var i;

        if (!findings || findings.length === 0) {
            gs.info("[AICRemediationEngine] No findings to remediate.");
            return { created: 0, tasks: [] };
        }

        for (i = 0; i < findings.length; i++) {
            var f = findings[i];
            var task = this._createRemediationTask(f);
            if (task && task.sys_id) {
                createdTasks.push(task);
            }
        }

        gs.info("[AICRemediationEngine] Created " + createdTasks.length + " remediation tasks.");
        return { created: createdTasks.length, tasks: createdTasks };
    },

    /**
     * _createRemediationTask - internal helper to insert a task record
     */
    _createRemediationTask: function(finding) {
        try {
            var gr = new GlideRecord("sn_custom_task");
            if (gr.isValid()) {
                gr.initialize();
                gr.short_description = finding.msg || "Policy violation: " + finding.rule;
                gr.description = "AIC detected a policy violation on agent '" + (finding.agent || "Unknown") + "' for rule '" + (finding.rule || "UNKNOWN") + "'. Severity: " + (finding.severity || "LOW") + ".";
                if (gr.priority) {
                    gr.priority = this._severityToPriority(finding.severity);
                }
                if (gr.state) {
                    gr.state = 1; // Open
                }
                var sysId = gr.insert();
                return { sys_id: sysId, agent: finding.agent, rule: finding.rule, severity: finding.severity };
            }
        } catch (e) {
            gs.error("[AICRemediationEngine] Failed to create task for rule " + finding.rule + ": " + e);
        }
        return null;
    },

    _severityToPriority: function(severity) {
        switch (String(severity).toUpperCase()) {
            case "CRITICAL": return 1;
            case "HIGH": return 2;
            case "MEDIUM": return 3;
            case "LOW": return 4;
            default: return 3;
        }
    },

    /**
     * autoFix - attempts automated remediation for select low-risk rule classes
     */
    autoFix: function(finding) {
        if (finding.rule === "AGENT_LOG_RETENTION") {
            try {
                var agent = new GlideRecord("sn_ai_agent");
                if (agent.get("name", finding.agent)) {
                    agent.setValue("log_retention_days", 90);
                    agent.update();
                    gs.info("[AICRemediationEngine] Auto-fixed log retention for " + finding.agent);
                    return true;
                }
            } catch (e) {
                gs.error("[AICRemediationEngine] Auto-fix failed for " + finding.agent + ": " + e);
            }
        }
        return false;
    },

    type: "AICRemediationEngine"
};
