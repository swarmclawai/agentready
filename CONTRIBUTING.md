# Contributing

AgentReady is in alpha. The best early contributions are passive rules, fixtures, report improvements, and documentation.

## Local Setup

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Rule Requirements

Rules should be passive by default and include:

- stable rule ID
- title
- profiles
- category
- severity
- clear evidence
- practical recommendation
- tests or fixtures

Good rule ID:

```txt
discoverability.llms_txt
```

Avoid checks that submit forms, bypass access controls, brute-force paths, trigger paid actions, or attempt exploitation.
