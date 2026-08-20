---
name: plugin-builder-workflow
description: Use when a DSH plugin must be created, changed, repaired, packaged, installed, or reviewed.
---

# DSH Plugin Builder Workflow

Use this skill for every request to create, extend, repair, package, or install a DSH plugin. The user's scenario is the input; plugin type is an implementation result.

## Non-negotiable gates

1. Inspect before proposing architecture.
2. Complete design review before writing implementation source.
3. Write a failing test before each behavior change.
4. Recalculate impact from the real diff before installation.
5. Obtain separate approval before installation and before publication.
6. Preserve existing DSH capabilities and user files by default.

## Stage 1: Discover

Locate the target workspace and DSH installation. Read the nearest `AGENTS.md`, DSH architecture documentation, package manifests, plugin composition, tests, and current repository state. Record `.dsh/plugin-builder/workflow.json` with stage `discover` and create an EnvironmentReport containing DSH version, Node and package-manager versions, runtime profile, repository status, and relevant extension points.

Use DSH runtime inspection tools when the behavior depends on the assembled Cordis tree. Do not infer a service, Tool, Remote method, Slot, or lifecycle from names alone.

## Stage 2: Clarify PluginIntent

Translate the request into `.dsh/plugin-builder/plugin-intent.json` with stable requirement ids. Capture:

- users, business outcome, non-goals, and primary scenarios;
- inputs, outputs, external systems, state, and side effects;
- desired DSH surface and whether the Agent, browser, or both invoke it;
- credentials, permissions, data sensitivity, audit needs, and deployment target;
- executable acceptance criteria for success and failure paths.

Fill workspace facts by inspection. Ask only questions whose answers change public behavior, security, side effects, activation, or architecture. Mark fields with provenance (`user`, `workspace`, `documentation`, `inferred`) and confirmation (`proposed`, `confirmed`).

PluginIntent is incomplete while a primary scenario, external effect, secret, permission, or acceptance outcome remains ambiguous.

## Stage 3: Design CapabilityPlan

Map requirements to existing DSH mechanisms:

| Need | Prefer |
| --- | --- |
| Model invokes an operation | Tool registered on `ctx.tools` |
| Shared domain behavior | Service with Definition, Provider, and Consumer roles |
| Replaceable external integration | Provider behind a Service Definition |
| User configuration | Settings namespace |
| Token or password | Credential reference, never ordinary Settings |
| Browser invokes Host behavior | Typed Remote API exposing only browser needs |
| Visible browser contribution | Existing Client Slot or Conversation Node |
| Durable model-visible fact | Session Event plus replay projection |
| Long-running operation | Job or Workflow |
| Consent-sensitive operation | Approval through the existing policy seam |
| Reusable model procedure | Skill |
| Installable composition | Bundle with `dsh.bundle` and Cordis patch |
| Per-session tool/persona composition | Agent preset |

Write `.dsh/plugin-builder/capability-plan.json`. Define public input/output and error contracts before implementation. Keep Tool schemas model-facing, canonical, and JSON-safe. Keep Remote methods browser-minimal. Use branded opaque ids across package or wire boundaries. Place process-wide registries on the Host plane and per-session tool, prompt, and projection contributions in the Agent preset plane. A preset-owned Service requires an isolate realm unless every consumer lives outside that preset, in which case it belongs on the Host plane.

Trace every component to a requirement and every acceptance scenario to a verification path. Remove components with no requirement source.

## Stage 4: Design ImpactPlan and review

Write `.dsh/plugin-builder/impact-plan.json` covering files, dependencies, composition rows, public interfaces, UI class, session events, persistence, credentials, permissions, external effects, activation, migration, and rollback.

Classify UI impact as none, Slot extension, new section, core layout, or root replacement. Prefer Slot extension. Treat core layout and root replacement as high risk.

Derive activation from the change: Settings may apply live; connector records reconnect; Client code rebuilds and normally needs Host restart plus browser refresh in production; Tool, Skill, persona, or preset changes require a new session; Host composition and dependencies require restart; persistent schema requires backup and migration.

Present a concise design review containing scenarios, components, public behavior, permissions and secrets, files, tests, activation, and rollback. Do not start implementation until the user approves this design.

## Stage 5: Implement incrementally

Create ordered tasks carrying requirement ids, dependencies, allowed files, tests, and impact labels. Default order:

```text
public types -> Service -> Provider -> Settings/Credentials
-> Tools/Remote -> Client UI -> integration -> docs
```

For every behavior:

1. Write one test that names the break it catches.
2. Run it and confirm it fails for the missing behavior.
3. Implement the minimum behavior.
4. Run the focused test and relevant existing tests.
5. Simplify only while green.
6. Type-check and record evidence.
7. Make an atomic commit when the increment is independently useful.

Do not weaken tests, types, security checks, or existing extension contracts to get green. Do not modify files outside the approved scope without reopening review.

## Stage 6: Verify and recalculate impact

Create `.dsh/plugin-builder/verification-report.json`. Record every check with status, command or procedure, timestamp, relevant output, and artifact paths. Cover package validation, types, unit tests, integration/loading, assembled user-visible behavior, and security checks appropriate to the change.

Compare the implemented diff with the approved ImpactPlan. New permissions, dependencies, public interfaces, secrets, external effects, core UI changes, or migrations return to design review.

## Stage 7: Installation review and install

Show the exact package, profile, dependency, composition, restart, migration, and rollback actions. Installation approval does not imply publication approval. After approval, install using the supported DSH profile or preset mechanism, verify the effective composition, and stop if loading fails. Preserve user Settings and Credential records during rollback unless the user explicitly requests their removal.

## Stage 8: Accept and deliver

Run the user's real scenarios and write `.dsh/plugin-builder/acceptance-report.json`. Deliver installation, first-use, configuration, upgrade, uninstall, and rollback instructions plus the evidence chain from requirement ids to code, commands, results, and artifacts.

Do not publish, push, create a release, or mutate a shared marketplace without explicit publication approval.

## Failure routing

- Requirement failure: return to Clarify.
- Architecture or new-impact failure: return to Design and Review.
- Type, unit, loading, or permission failure: diagnose from evidence and return to the smallest implementation task.
- External-service failure: distinguish credentials, availability, rate limit, contract drift, and product defect before retrying.

Never repeatedly retry an unchanged failure and never bypass a policy denial.
