# AIC Dependency Report

## Platform Dependencies

| Dependency | Type | Version/Plugin | Required/Optional | Notes |
|------------|------|---------------|-------------------|-------|
| ServiceNow Platform | Base | Utah+ (Australia target) | Required | Core GlideRecord/GlideDateTime APIs |
| AI Agent Studio | Plugin | com.snc.ai_agent | Required | Provides `sn_ai_agent` table |
| Generative AI Controller | Plugin | com.snc.generative_ai | Conditional | Required for BYOK_REQUIRED rule; safe fallback if absent |
| Document Management | Plugin | com.snc.document_management | Optional | Needed for PDF export; CSV/JSON work without it |
| Task Management | Core | Standard | Required | `sn_custom_task` table for remediation records |

## Data Table Dependencies

### Reads

| Table | Label | Scope | Access Pattern |
|-------|-------|-------|----------------|
| sn_ai_agent | AI Agent | Global/Plugin | Read — `gr.query()` iteration, `gr.getValue()` for fields |
| sn_generative_ai_cfg_provider | GenAI Configuration Provider | Plugin | Read — `gr.setLimit(1)`, `gr.query()`, `gr.hasNext()` |

### Writes

| Table | Label | Scope | Access Pattern |
|-------|-------|-------|----------------|
| sn_custom_task | Custom Task | Global | Insert — `gr.initialize()`, `gr.setValue()`, `gr.insert()` |

## Cross-Scope Privilege Requirements

| Source Scope | Target Table | Operation | Rationale |
|--------------|-------------|-----------|-----------|
| x_aic | sn_ai_agent | Read | Policy engine must enumerate all AI agents |
| x_aic | sn_generative_ai_cfg_provider | Read | BYOK provider existence check |
| x_aic | sn_custom_task | Create | Remediation engine inserts task records |

## Script Include Dependencies

| Script Include | Scope | Import Pattern | Function |
|----------------|-------|----------------|----------|
| AICPolicyEngine | x_aic | Internal | Core scanning logic |
| AICComplianceReporter | x_aic | Internal | Report generation |
| AICRemediationEngine | x_aic | Internal | Task creation and auto-fix |

No cross-scope Script Include dependencies. All three modules are self-contained within `x_aic`.

## Global API Usage

| API | Used In | Method | Risk Level |
|-----|---------|--------|------------|
| GlideRecord | All modules | query, next, getValue, setValue, insert, update, isValid, get | Standard — no deprecation risk |
| GlideDateTime | PolicyEngine, Reporter | getDisplayValueInternal | Standard — no deprecation risk |
| gs.info | All modules | Logging | Standard — no deprecation risk |
| gs.error | RemediationEngine | Error logging | Standard — no deprecation risk |
| Class.create | All modules | Class definition | Standard — no deprecation risk |

## Plugin Compatibility Matrix

| Plugin | Utah | Vancouver | Washington | Yokohama | Zurich | Australia |
|--------|------|-----------|------------|----------|--------|-----------|
| AI Agent Studio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Generative AI Controller | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Document Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Node.js Test Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥14.x | Test runtime |
| assert (built-in) | — | Test assertions |
| fs (built-in) | — | Source file loading |

No npm packages required. Tests use only Node.js built-in modules.

## Upgrade Impact Assessment

| Component | Upgrade Risk | Mitigation |
|-----------|-------------|------------|
| sn_ai_agent schema | Low | Reads only standard fields (name, log_retention_days, confidence_threshold, mcp_rate_limit) — unlikely to change |
| sn_generative_ai_cfg_provider | Low | Read-only existence check — table may be renamed but API surface minimal |
| sn_custom_task | Low | Uses standard platform task fields (short_description, description, priority, state) |
| GlideRecord API | Very Low | Core API unchanged since Fuji |
| GlideDateTime | Very Low | Core API unchanged since Fuji |

## Compliance Dependencies

| Regulation | Covered By | Mechanism |
|------------|-----------|-----------|
| GDPR Article 30 (RoPA) | All rules | Audit trail of agent configurations and compliance status |
| ISO 27001 A.12.5 | BYOK_REQUIRED | Cryptographic control verification |
| SOC 2 CC6.1 | All rules | Automated control monitoring |
| NIST AI RMF | HUMAN_IN_THE_LOOP | Human oversight for high-confidence actions |
