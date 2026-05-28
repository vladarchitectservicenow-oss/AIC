# AIC Execution Plan

## Phase 1: Installation & Scoping

1. **Import Application Manifest**
   - Upload `src/sys_app.xml` via Studio → Import Application
   - Commit scope `x_aic` with version 1.0.0
   - Verify application appears in Application Registry

2. **Deploy Server-Side Scripts**
   - Create Script Include `AICPolicyEngine` from `src/AICPolicyEngine.js`
   - Create Script Include `AICComplianceReporter` from `src/AICComplianceReporter.js`
   - Create Script Include `AICRemediationEngine` from `src/AICRemediationEngine.js`
   - Verify all three appear in Studio → Application Files

3. **Configure Cross-Scope Privileges**
   - Navigate to `sys_scope_privilege.list`
   - Grant `x_aic` → `sn_ai_agent` (Read)
   - Grant `x_aic` → `sn_generative_ai_cfg_provider` (Read)
   - Grant `x_aic` → `sn_custom_task` (Create)
   - Verify with REST API Explorer: GET `/api/now/table/sn_ai_agent?sysparm_limit=1`

## Phase 2: Functional Validation

4. **Manual Smoke Test**
   - Navigate to `sys.scripts.do` → switch scope to Global
   - Execute Background Script:
     ```javascript
     var engine = new x_aic.AICPolicyEngine();
     var result = engine.runPolicyScan();
     gs.info("Policies: " + result.totalPolicies + " | Violations: " + result.violations);
     ```
   - Verify output in log (green box below editor)

5. **Compliance Report Verification**
   ```javascript
   var reporter = new x_aic.AICComplianceReporter();
   var report = reporter.buildReport(result);
   gs.info("Pass Rate: " + report.passRate + "% | Severity: " + JSON.stringify(report.summaryBySeverity));
   ```

6. **CSV Export Verification**
   ```javascript
   var csv = reporter.exportToCSV(report);
   gs.info("CSV length: " + csv.length + " bytes");
   ```
   - Expected: CSV header row + one row per finding

7. **Remediation Engine Verification**
   ```javascript
   var rem = new x_aic.AICRemediationEngine();
   var summary = rem.remediate(result.findings);
   gs.info("Created: " + summary.created + " tasks");
   ```
   - Verify tasks appear in `sn_custom_task.list` filtered to scope `x_aic`

## Phase 3: Offline Test Suite

8. **Run Node.js Mock Tests**
   ```bash
   cd tests
   node test_aic.js
   ```
   - Expected: "All AIC tests PASSED" with three test results
   - Check: `testPolicy` finds violations, `testRemediation` creates tasks, `testReporter` computes pass rate

9. **Regression Case Validation**
   - Execute `regression_cases.md` scenarios R01-R08
   - Document pass/fail for each

10. **Edge Case Validation**
    - Execute `edge_cases.md` scenarios E01-E06
    - Document behavior for empty tables, missing fields, extreme values

## Phase 4: Documentation

11. **Verify README Quality Gates**
    - Word count ≥ 2000 (G2 check)
    - Mermaid diagram present
    - ROI section with dollar figures
    - Troubleshooting table with ≥5 rows
    - No duplicate section headers (G8 check)

12. **LICENSE Verification**
    - Header matches: `Copyright (C) 2026 Vladimir Kapustin`
    - License type: AGPL-3.0-only (or MIT as currently)
    - No FSF copyright conflict

13. **Marketing Artifacts**
    - `marketing/WHITEPAPER.md` — enterprise CTO pitch
    - `marketing/LINKEDIN_POST.md` — social media thread

## Phase 5: GitHub Push

14. **Pre-Commit Checks**
    ```bash
    git diff --cached --stat  # Verify all files staged
    grep -r "7%%gXJzImsW7\|GITHUB_TOKEN" src/  # Must be empty
    grep "Vladimir Kapustin" LICENSE  # Verify copyright
    ```

15. **Commit & Push**
    - Conventional commit: `docs: rebuild Phase 1-2 documentation suite for AIC`
    - Push to `origin/main` via HTTPS with PAT

16. **Post-Push Verification**
    - Verify README.md on GitHub raw endpoint ≥2000 words
    - Verify `DONE.marker` visible in repo root
    - Verify LICENSE shows correct copyright

## Phase 6: Pipeline Integration

17. **Update Progress File**
    - Move AIC from pending to done in `/tmp/pipeline_progress.json`
    - Set `current: null`, `status: complete`

18. **Trigger Next Product**
    - If pipeline cron is next, it picks from pending queue
    - If manual, proceed to `CFMS` (next alphabetically without DONE.marker)

## Rollback Plan

If any Phase 2 test fails:
1. Revert to last known-good commit via `git reset --hard HEAD~1`
2. Identify failing scenario from `regression_cases.md`
3. Fix source code in `src/` files
4. Re-run tests until 100% pass
5. Re-execute Phase 4–5

If push fails with auth error:
1. Verify token validity via `curl -H "Authorization: Bearer $TOKEN" https://api.github.com/user`
2. Create archive: `git archive --format=tar.gz --output=/tmp/AIC.tar.gz HEAD`
3. Log archive path in progress file for manual push later

## Estimated Duration

| Phase | Duration |
|-------|----------|
| Installation & Scoping | 15 min |
| Functional Validation (PDI) | 20 min |
| Offline Test Suite | 5 min |
| Documentation Review | 10 min |
| Push & Verify | 5 min |
| **Total** | **~55 min** |
