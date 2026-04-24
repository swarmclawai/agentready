# AgentReady

[![npm version](https://img.shields.io/npm/v/%40swarmclawai%2Fagentready?label=npm)](https://www.npmjs.com/package/@swarmclawai/agentready)
[![npm alpha](https://img.shields.io/npm/v/%40swarmclawai%2Fagentready/alpha?label=alpha)](https://www.npmjs.com/package/@swarmclawai/agentready/v/0.1.0-alpha.0)
[![license](https://img.shields.io/npm/l/%40swarmclawai%2Fagentready)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20.18-339933)](package.json)

Open-source readiness scanner for the agentic web.

AgentReady checks whether a website, API, marketplace, merchant, MCP server, or agent service is ready for AI agents to discover it, understand it, authenticate with it, buy from it, pay it, request refunds, and interact safely.

## Install

AgentReady is published on npm as [`@swarmclawai/agentready`](https://www.npmjs.com/package/@swarmclawai/agentready). It installs one executable: `agentready`.

Current npm dist-tags:

- `alpha`: `0.1.0-alpha.0`
- `latest`: `0.1.0-alpha.0`

This is an alpha release, so installing with `@alpha` is the clearest way to stay on the prerelease channel:

```bash
npm install -g @swarmclawai/agentready@alpha
agentready scan https://example.com --profile merchant
```

Run it without a global install:

```bash
npx @swarmclawai/agentready@alpha scan https://example.com --profile merchant
```

Or add it to a project for CI:

```bash
npm install --save-dev @swarmclawai/agentready@alpha
npx agentready scan https://example.com --profile merchant --format markdown --output agentready-report.md
```

Requirements:

- Node.js `>=20.18`
- Network access to the target being scanned

## Commands

```bash
agentready scan https://example.com
agentready scan https://example.com --profile merchant --format markdown --output report.md
agentready scan https://example.com --format json
agentready rules list
agentready rules test ./rules/custom-rule.yaml https://example.com
agentready init
```
