/**
 * Copyright (c) 2026 Vladimir Kapustin
 * SPDX-License-Identifier: MIT
 *
 * AICComplianceReporter — AI Control Tower Configurator
 * Scope: x_aic
 * Purpose: Generates compliance report for auditors by aggregating policy scan findings.
 */
var AICComplianceReporter = Class.create();
AICComplianceReporter.prototype = {
    initialize: function() {
        this.version = "1.0.0";
        this.reportSchema = {};
    },

    /**
     * buildReport - generates a structured compliance report from policy results
     * @param {Object} scanResult - result from AICPolicyEngine.runPolicyScan()
     * @returns {Object} report object suitable for auditor consumption
     */
    buildReport: function(scanResult) {
        var report = {
            scanDate: scanResult.scanDate || new GlideDateTime().getDisplayValueInternal(),
            totalPolicies: scanResult.totalPolicies || 0,
            totalViolations: scanResult.violations || 0,
            passRate: 0,
            findings: [],
            summaryBySeverity: {},
            recommendations: [],
            auditTrail: []
        };

        if (scanResult.findings && scanResult.findings.length > 0) {
            var i;
            for (i = 0; i < scanResult.findings.length; i++) {
                var f = scanResult.findings[i];
                report.findings.push({
                    agent: f.agent,
                    rule: f.rule,
                    severity: f.severity,
                    message: f.msg,
                    timestamp: report.scanDate
                });
                var count = report.summaryBySeverity[f.severity] || 0;
                report.summaryBySeverity[f.severity] = count + 1;
            }
        }

        if (report.totalPolicies > 0) {
            var passCount = report.totalPolicies;
            if (scanResult.violations > 0) {
                passCount = Math.max(0, report.totalPolicies - Math.floor(scanResult.violations / (report.totalViolations > 0 ? report.totalViolations : 1)));
            }
            report.passRate = parseFloat(((passCount / report.totalPolicies) * 100).toFixed(2));
        }

        var severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
        var si;
        for (si = 0; si < severityOrder.length; si++) {
            var sev = severityOrder[si];
            if (report.summaryBySeverity[sev] > 0) {
                report.recommendations.push({
                    priority: sev,
                    action: "Review and remediate " + sev + " severity findings immediately"
                });
            }
        }

        return report;
    },

    /**
     * exportToPDF - placeholder for PDF export integration
     */
    exportToPDF: function(report) {
        gs.info("[AICComplianceReporter] PDF export requested for compliance report with " + report.totalViolations + " violations");
        return {
            status: "pending",
            message: "PDF generation queued via Document Management"
        };
    },

    /**
     * exportToCSV - returns CSV string for download
     */
    exportToCSV: function(report) {
        var csv = "Agent,Rule,Severity,Message,Timestamp\n";
        var i;
        for (i = 0; i < report.findings.length; i++) {
            var f = report.findings[i];
            csv += [f.agent, f.rule, f.severity, this._escapeCSV(f.message), f.timestamp].join(",") + "\n";
        }
        return csv;
    },

    _escapeCSV: function(val) {
        val = String(val || "");
        if (val.indexOf(",") !== -1 || val.indexOf("\"") !== -1) {
            val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
    },

    type: "AICComplianceReporter"
};
