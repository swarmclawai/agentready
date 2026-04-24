# Rules

Rules are small, public, and testable. Built-in rules are implemented in `packages/rules`.

Custom YAML rule example:

```yaml
id: discoverability.llms_txt
title: llms.txt is available
profile: website
severity: minor
category: discoverability
description: Checks whether the target exposes an llms.txt file at the root.
check:
  type: http_exists
  path: /llms.txt
recommendation: Add an llms.txt file that points agents to useful public documentation and policies.
```

Supported alpha custom checks:

- `http_exists`
- `text_contains`
- `structured_policy_detection`
