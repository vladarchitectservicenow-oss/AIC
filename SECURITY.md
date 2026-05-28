# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Please report security issues by opening a private security advisory on the repository, or contact the maintainer directly.

## Security Considerations for AIC

AIC reads from ServiceNow platform tables (`sn_ai_agent`, `sn_generative_ai_cfg_provider`) and writes to `sn_custom_task`. The application:

- Runs within ServiceNow's scoped application boundary (`x_aic`)
- Respects ACLs and role-based access control
- Does not store or transmit credentials, tokens, or cryptographic material
- Does not make external network calls
- Does not expose REST endpoints by default

## Audit Trail

All remediation actions create standard ServiceNow task records with full audit history. Scan outputs are ephemeral — no persistent data is stored outside the ServiceNow platform's native logging.

## Dependency Security

AIC has zero external dependencies at runtime. All logic runs on ServiceNow-provided APIs (GlideRecord, GlideDateTime, Class.create).

## Responsible Disclosure

We follow a 90-day responsible disclosure timeline. Critical vulnerabilities (authentication bypass, privilege escalation, data exfiltration) will be patched within 30 days.
