# AIC Validation Checklist

## Pre-Deployment

- [ ] `src/sys_app.xml` has correct scope `x_aic` and version `1.0.0`
- [ ] All 3 Script Includes (AICPolicyEngine, AICComplianceReporter, AICRemediationEngine) present in `src/`
- [ ] All source files have copyright header: `Copyright (c) 2026 Vladimir Kapustin`
- [ ] SPDX identifier present in each file header
- [ ] `LICENSE` file exists at repo root
- [ ] LICENSE copyright line is `Copyright (C) 2026 Vladimir Kapustin` (NOT FSF)
- [ ] `README.md` ≥ 2000 words
- [ ] README contains Mermaid architecture diagram
- [ ] README contains ROI section with dollar figures
- [ ] README contains Troubleshooting table (≥5 rows)
- [ ] README contains Security Considerations section
- [ ] No duplicate README section headers (G8 check)
- [ ] `tests/test_aic.js` exists and loads all 3 source files
- [ ] `memory/checkpoints/architecture_summary.md` ≥ 40 lines
- [ ] `memory/checkpoints/dependency_report.md` ≥ 30 lines
- [ ] `memory/checkpoints/risk_report.md` has ≥ 10 P0-P3 risk entries
- [ ] `memory/checkpoints/execution_plan.md` ≥ 30 lines
- [ ] `Validation/TEST CASES/AIC/test_suite_SOP.md` has ≥ 10 TXX scenarios
- [ ] `Validation/TEST CASES/AIC/regression_cases.md` has ≥ 8 RXX cases
- [ ] `Validation/TEST CASES/AIC/edge_cases.md` has ≥ 6 EXX cases
- [ ] `Validation/TEST CASES/AIC/validation_checklist.md` exists (this file)
- [ ] `marketing/WHITEPAPER.md` exists
- [ ] `marketing/LINKEDIN_POST.md` exists
- [ ] No hardcoded credentials in source: `grep -r "7%%gXJzImsW7\|GITHUB_TOKEN" src/` empty

## Node.js Test Execution

- [ ] `node tests/test_aic.js` runs without errors
- [ ] Output contains "All AIC tests PASSED"
- [ ] T01 — Policy engine evaluates all 4 rules
- [ ] T02 — BYOK rule detects missing provider
- [ ] T03 — Log retention threshold detection
- [ ] T04 — Human-in-the-loop threshold
- [ ] T05 — MCP rate limit zero detection

## ServiceNow PDI Validation (when PDI available)

- [ ] PDI accessible: `curl -s https://dev362840.service-now.com/api/now/table/sys_app?sysparm_limit=1`
- [ ] `sn_ai_agent` table exists: `GET /api/now/stats/sn_ai_agent?sysparm_count=true`
- [ ] Cross-scope grants configured for `x_aic` → `sn_ai_agent` (Read)
- [ ] Cross-scope grants configured for `x_aic` → `sn_generative_ai_cfg_provider` (Read)
- [ ] Cross-scope grants configured for `x_aic` → `sn_custom_task` (Create)
- [ ] Background Script smoke test passes (sys.scripts.do)
- [ ] Policy scan returns non-empty results
- [ ] Compliance report generates valid JSON
- [ ] CSV export downloads correctly
- [ ] Remediation engine creates sn_custom_task records
- [ ] Auto-fix only operates on AGENT_LOG_RETENTION rule
- [ ] No errors logged to sys_log during scan

## Git Commit & Push

- [ ] `git diff --cached --stat` shows all Phase 1+2 files
- [ ] No `__pycache__/` or `*.pyc` in staged files
- [ ] Commit message follows conventional format
- [ ] Push to `origin/main` succeeds
- [ ] `DONE.marker` pushed to repo root
- [ ] README verified via GitHub raw endpoint: ≥2000 words
- [ ] LICENSE verified via GitHub API: shows AGPL-3.0 / MIT
- [ ] Pipeline progress file updated: AIC moved to `done`

## Post-Deployment Health

- [ ] GitHub repo shows DONE.marker in file list
- [ ] README renders correctly on GitHub (Mermaid diagrams visible)
- [ ] No broken badge links
- [ ] Issues tab open for community contributions
- [ ] Repo description matches product purpose

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | Vladimir Kapustin | 2026-05-28 | — |
| Reviewer | — | — | — |
| Release Manager | — | — | — |

## Validation History

| Date | Result | Failures | Action Taken |
|------|--------|----------|-------------|
| 2026-05-28 | — | — | Initial run pending |
