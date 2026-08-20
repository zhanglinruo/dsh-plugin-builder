# DSH Plugin Builder MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable developer-facing Plugin Builder Agent preset with safe local lifecycle commands.

**Architecture:** A dependency-free Node.js CLI installs a complete, self-contained Agent preset into DSH's supported user preset root. The preset reuses DSH's existing Cordis creation capabilities and adds a workflow persona and skill; installation is a staged filesystem transaction that never mutates DSH core.

**Tech Stack:** Node.js ESM, built-in `node:test`, DSH Cordis YAML, Markdown skills

**Spec:** `docs/superpowers/specs/2026-08-20-plugin-builder-mvp.md`

## Global Constraints

- Node.js `^22.19.0 || >=24.0.0`.
- No runtime dependencies.
- Existing presets are preserved unless replacement is explicit.
- No DSH core, active-session, profile, credential, or default-preset mutation.
- Publication requires separate approval.

---

### Task 1: Preset lifecycle library

**Files:**
- Create: `package.json`
- Create: `src/preset-manager.mjs`
- Create: `tests/preset-manager.test.mjs`
- Create: `preset/plugin-builder/preset.yml`
- Create: `preset/plugin-builder/agent.cordis.yml`
- Create: `preset/plugin-builder/skills/plugin-builder-workflow/SKILL.md`

**Interfaces:**
- Consumes: `{ dshHome: string, replace?: boolean }` and the packaged preset directory.
- Produces: `validatePackagedPreset()`, `installPreset()`, `getPresetStatus()`, and `uninstallPreset()` returning tagged JSON-safe receipts.

- [ ] Write a failing test proving a fresh install publishes the complete preset at `<dshHome>/.agent-presets/plugin-builder`.
- [ ] Run `node --test tests/preset-manager.test.mjs` and confirm failure because `src/preset-manager.mjs` is absent.
- [ ] Implement packaged preset validation and the minimum staged copy needed for the fresh install.
- [ ] Run the focused test and confirm it passes.
- [ ] Add failing tests for overwrite refusal, explicit replacement, status, uninstall, and invalid packaged input.
- [ ] Implement the minimum safe behavior for each failure, running the focused test after every red-green cycle.
- [ ] Run `npm test` and commit with `feat: add safe plugin builder preset lifecycle`.

### Task 2: Command-line entry point

**Files:**
- Create: `src/cli.mjs`
- Create: `tests/cli.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: lifecycle functions from Task 1 and `install|status|uninstall`, `--dsh-home`, and `--replace` arguments.
- Produces: executable `dsh-plugin-builder` command with stable exit codes: `0` success/status installed, `1` operation failure, `2` invalid usage or status absent.

- [ ] Write a failing process-level test for `status` against an empty temporary DSH home.
- [ ] Run the focused test and confirm failure because the CLI is absent.
- [ ] Implement argument parsing and `status` output only.
- [ ] Run the focused test and confirm it passes.
- [ ] Add failing process-level tests for install, repeated install refusal, replacement, uninstall, and invalid usage.
- [ ] Implement the minimum command behavior for each test and keep outputs free of stack traces for expected errors.
- [ ] Run `npm test` and commit with `feat: add plugin builder lifecycle command`.

### Task 3: Package validation and user handoff

**Files:**
- Create: `src/check.mjs`
- Create: `tests/package-check.test.mjs`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: packaged files and package manifest.
- Produces: `npm run check` plus installation, first-use, activation, status, and removal documentation.

- [ ] Write a failing test that runs the package checker and expects a valid distributable inventory.
- [ ] Run the focused test and confirm failure because the checker is absent.
- [ ] Implement the minimum checker for manifest, bin target, package files, preset metadata, composition, and workflow skill.
- [ ] Run the focused test and confirm it passes.
- [ ] Update README with exact local, npm/npx, DSH mode-selection, first-request, replacement, and removal commands.
- [ ] Run `npm test`, `npm run check`, and `npm pack --dry-run`.
- [ ] Commit with `docs: document plugin builder installation and use`.

### Task 4: Real DSH acceptance checkpoint

**Files:**
- Create: `docs/acceptance/plugin-builder-mvp.md`

**Interfaces:**
- Consumes: an installed DSH Web profile and the packaged preset.
- Produces: a recorded acceptance result covering discovery, design review, implementation gating, installation gating, and removal.

- [ ] Install the preset into an isolated DSH home and verify its files.
- [ ] Run the target DSH preset roster/composition check against that home.
- [ ] Start a Plugin Builder session and execute the documented small-plugin scenario when model credentials are available.
- [ ] Record commands, results, skipped credential-dependent steps, and observed activation impact.
- [ ] Run `npm test` and `npm run check`.
- [ ] Commit with `test: record plugin builder runtime acceptance`.
