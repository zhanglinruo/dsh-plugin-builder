# Plugin Builder MVP Acceptance

- Date: 2026-08-20
- Package: `dsh-plugin-builder@0.1.0`
- DSH source: `E:\DeepSeek Harness\deepseek-harness`
- DSH version: `0.1.0-rc.5`
- Acceptance environment: repository-local isolated DSH home, removed after verification

## Scope

This acceptance verifies the first runnable vertical slice: packaging, safe preset lifecycle, discovery by the real DSH preset scanner, session composition, workflow-skill visibility, and uninstall. It does not install into the user's normal DSH home, call a model, publish a package, or push a branch.

## Automated package verification

| Check | Result | Evidence |
| --- | --- | --- |
| Unit and CLI tests | Pass | 17 tests passed, 0 failed |
| Package validation | Pass | `Package dsh-plugin-builder@0.1.0 is valid (8 files checked).` |
| npm package preview | Pass | 13 files, 18.6 kB packed, 52.0 kB unpacked |

These counts come from the final pre-commit verification run.

## Real DSH runtime acceptance

The preset was installed into an isolated DSH home and inspected through DSH's real scanner and Web runtime.

| Scenario | Result | Observed behavior |
| --- | --- | --- |
| Install packaged preset | Pass | Preset copied under `.agent-presets/plugin-builder` |
| Scan preset root | Pass | `plugin-builder` discovered as user-trust preset named `插件构建器`, order 5 |
| List presets through Web API | Pass | Preset returned healthy and non-default |
| Create a session with the preset | Pass | Session returned the requested `plugin-builder` preset |
| List session skills | Pass | `plugin-builder-workflow` was model-invocable |
| Uninstall while Web service was running | Pass | A later preset-list call no longer returned Plugin Builder |

The first sandboxed runtime mount failed with Windows `spawn EPERM` while loading `tool-cordis`. Re-running the same DSH startup with host execution succeeded. The failure was therefore classified as a test-sandbox process restriction, not a DSH or Plugin Builder defect.

## Behavioral workflow check

A pressure scenario combined a 90-minute deadline, sunk implementation cost, manager pressure, a browser contribution, a model Tool, a secret, and an external CRM side effect. Both the no-skill control and the supplied-workflow run selected the gated design-first, test-first, no-install path.

This confirms that the workflow prompt is compatible with the desired behavior, but it does not prove that the skill caused the behavior because the control also passed. The skill was written before this behavioral baseline, so the project must not claim a complete skill RED-GREEN-REFACTOR campaign. Broader repeated scenarios remain a release-quality follow-up rather than an MVP runtime blocker.

## Impact and activation

- Installation changes only the selected DSH home's `.agent-presets/plugin-builder` directory.
- It does not change DSH core code, default presets, profiles, Settings, credentials, sessions, or persistent schemas.
- Existing targets are preserved unless the operator explicitly supplies `--replace`.
- DSH can discover install and uninstall changes without a Host restart.
- An existing session does not acquire the new persona or skill; the user starts a new session and selects `插件构建器`.
- Rollback is the exact preset-directory uninstall. No user Settings or credentials are removed.

## Deferred acceptance

- A real LLM conversation was not run because it would require configured model credentials and an external model call; runtime composition was proven without it.
- Installation into the user's normal DSH home requires separate installation approval.
- Push, pull request, npm publication, release, or marketplace mutation requires separate publication approval.
