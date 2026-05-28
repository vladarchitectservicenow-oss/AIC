# Contributing to AIC

Thank you for your interest in contributing to the AI Control Tower Configurator.

## Development Setup

```bash
git clone https://github.com/vladarchitectservicenow-oss/AIC.git
cd AIC
```

## How to Contribute

### Reporting Bugs

- Search existing issues first
- Include ServiceNow version, AI Agent Studio plugin version, and reproduction steps
- Use the bug report template

### Proposing New Policy Rules

1. Fork the repository
2. Add your rule to `POLICY_RULES` array in `src/AICPolicyEngine.js`
3. Implement `_checkRule` logic in the switch block
4. Add corresponding test assertions in `tests/test_aic.js`
5. Open a pull request with description of the governance gap being addressed

### Pull Request Process

1. Ensure all tests pass: `cd tests && node test_aic.js`
2. Update README if adding new features
3. Add a test scenario for any new rule
4. Maintain backward compatibility with existing `sn_ai_agent` table schema
5. Follow the existing code style (ServiceNow server-side JS conventions)

### Code Style

- Use ServiceNow server-side JavaScript (ES5 compatible, `Class.create()`)
- Copyright header on all files: `Copyright (c) [year] Vladimir Kapustin`
- SPDX identifier: `SPDX-License-Identifier: MIT`
- Comments in English

### Testing

All new rules must include:
- A positive test case (rule fires when violation present)
- A negative test case (rule does NOT fire when compliant)
- An edge case (boundary values, missing fields, null values)

### License

By contributing, you agree that your contributions will be licensed under the MIT License.
