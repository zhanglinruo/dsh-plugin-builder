# Spec: DSH Plugin Builder MVP

## Objective

Deliver a developer-facing DSH Agent preset that turns a business request into a reviewed, tested, installable DSH plugin through the workflow defined in `docs/plugin-builder-design.md`. The first runnable release must install without modifying DSH core, appear as a selectable mode, preserve existing user data by default, and be removable.

## Assumptions

- The target DSH version follows the inspected `0.1.0-rc.5` preset and Cordis package interfaces.
- The developer has DSH installed and uses the Web profile when selecting modes.
- The first release may require a new session after installation; it does not switch existing sessions.
- Native external bundle contribution of Agent presets is not currently available, so installation copies a complete preset into the supported user preset root.

## Tech Stack

- Node.js `^22.19.0 || >=24.0.0`
- ESM JavaScript
- Node.js built-in test runner and filesystem APIs
- DSH Cordis YAML composition and Markdown skills
- No runtime dependencies

## Commands

- Test: `npm test`
- Validate package: `npm run check`
- Install: `node src/cli.mjs install [--dsh-home <path>] [--replace]`
- Inspect: `node src/cli.mjs status [--dsh-home <path>]`
- Uninstall: `node src/cli.mjs uninstall [--dsh-home <path>]`

## Project Structure

- `src/cli.mjs` parses commands and renders stable user-facing receipts.
- `src/preset-manager.mjs` owns path resolution, validation, transactional installation, status, and uninstall behavior.
- `preset/plugin-builder/` is the complete user Agent preset copied into DSH home.
- `preset/plugin-builder/skills/plugin-builder-workflow/` contains the DSH-specific staged workflow.
- `tests/` exercises real filesystem behavior in temporary DSH homes.
- `docs/superpowers/plans/` contains the ordered implementation plan.

## Code Style

Use small ESM functions, explicit input objects, and tagged result objects. Validate command-line and filesystem input at their entry points. Keep filesystem effects in `preset-manager.mjs`; the CLI only maps arguments to operations and maps results to text and exit codes.

```js
export async function getPresetStatus({ dshHome }) {
  const target = resolvePresetTarget(dshHome)
  return { kind: 'status', installed: await pathExists(target), target }
}
```

## Testing Strategy

Tests use real temporary directories and the packaged preset. Each mutation test names the user-visible break it catches. Required paths cover fresh installation, refusal to overwrite an existing preset, explicit replacement, status, uninstall, packaged preset validation, and rollback after a failed staged publication. Tests must not depend on a real user DSH home.

The first release does not claim automated LLM-behavior coverage. Its README includes the real DSH acceptance path, and a later snapshot harness will turn that path into a deterministic test.

## Boundaries

- Always: validate the packaged preset before copying; stage before publication; preserve an existing target unless replacement is explicit; use the exact `plugin-builder` target; run tests and package checks before commit.
- Ask first: add dependencies; modify DSH core; change another preset; set Plugin Builder as the default mode; publish a package or release.
- Never: read or write credentials; edit a running session; delete an arbitrary directory; execute generated plugin code during installation; hide a failed verification.

## Success Criteria

- A clean DSH home receives `.agent-presets/plugin-builder` with valid metadata, composition, and workflow skill.
- `status` distinguishes installed from absent without changing files.
- Installation refuses to overwrite an existing target unless `--replace` is provided.
- Replacement and uninstall are restricted to the resolved Plugin Builder preset path.
- The package test and check commands pass on a clean checkout.
- README explains installation, mode selection, first request, activation behavior, and removal.

## Open Questions

None block the MVP. Native bundle-based preset distribution and deterministic assembled-agent snapshots are later phases.
