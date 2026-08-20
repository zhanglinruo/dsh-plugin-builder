# DSH Plugin Builder Design

Status: implementation baseline

## Objective

The first release serves developers who can read and edit code. A later release may offer a simplified guided experience for non-technical users without replacing the underlying workflow.

Users describe the business outcome. Plugin Builder derives the required DSH capabilities, explains their impact, generates the implementation, verifies it, installs it safely, and produces usage and rollback instructions.

Plugin type is an internal architectural result, not a question the user must answer up front.

## Product shape

Plugin Builder is not only a prompt. It consists of four layers:

1. A Plugin Builder Agent preset that composes the required tools, prompts, and skills.
2. General engineering skills for brainstorming, planning, test-driven development, debugging, review, and completion verification.
3. DSH-specific skills for capability mapping, service/provider design, Tool and Remote authoring, Client UI, testing, packaging, and installation.
4. A resumable workflow runtime plus deterministic inspection, scaffolding, validation, installation, and runtime-verification tools.

## Guiding principles

- Reuse an existing DSH seam before creating a new abstraction.
- Infer technical components from user scenarios instead of asking users to classify plugins.
- Define and approve public contracts, side effects, credentials, permissions, and activation impact before implementation.
- Prefer Slot-based UI extensions over core-layout changes.
- Keep implementation incremental, tested, attributable to a requirement, and within an approved file scope.
- Recalculate observed impact from the real diff before installation.
- Never gain a green result by deleting tests, weakening types, or disabling security checks.
- Treat external publishing as a separate, explicit approval boundary.

## Workflow

```text
Discover
  -> Clarify
  -> Design
  -> Review
  -> Implement
  -> Verify
  -> Install Review
  -> Install
  -> Accept
  -> Deliver
```

Review can return to Clarify. Verification or acceptance failures return to the smallest affected implementation task. A material requirement change invalidates only the downstream artifacts that depend on it.

### Stage contracts

| Stage | Primary output | Completion condition |
| --- | --- | --- |
| Discover | EnvironmentReport | Workspace, DSH version, package manager, repository state, and runtime mode are known |
| Clarify | PluginIntent | Scenarios, side effects, credentials, user experience, and executable acceptance criteria are clear |
| Design | CapabilityPlan and ImpactPlan | Components, contracts, permissions, lifecycle, activation, and rollback are complete |
| Review | Approval record | The user approves capability, risk, and change scope |
| Implement | Source, tests, and documentation | Planned components exist and local checks pass |
| Verify | VerificationReport | Required static, unit, integration, security, and loading checks pass |
| Install Review | Installation preview | Exact package, composition, restart, migration, and rollback actions are visible |
| Install | Installed plugin | The target DSH composition loads successfully |
| Accept | AcceptanceReport | Real user scenarios pass |
| Deliver | Package and handoff | Installation, use, upgrade, uninstall, and rollback are documented |

## Persistent workflow artifacts

```text
.dsh/plugin-builder/
  workflow.json
  plugin-intent.json
  capability-plan.json
  impact-plan.json
  decisions.jsonl
  verification-report.json
  acceptance-report.json
```

The store contains facts, decisions, evidence, and results. It does not persist private chain-of-thought.

Important fields carry provenance (`user`, `workspace`, `documentation`, or `inferred`) and confirmation state (`proposed` or `confirmed`). Inferences that affect public APIs, permissions, secrets, or side effects require confirmation.

## PluginIntent

PluginIntent is the structured source of truth for requirements:

```text
PluginIntent
  Identity
  Scenarios
  Capabilities
  Integrations
  Surfaces
  State
  Security
  Delivery
  Acceptance
```

It records the problem, users, non-goals, user-triggered scenarios, business operations, external systems, input/output, side effects, desired DSH surfaces, state ownership, credentials, permissions, deployment target, and executable acceptance criteria.

The Builder parses the user's free-form request, inspects the workspace, fills discoverable facts, and asks only questions whose answers change architecture. Technical details such as Cordis registration and test-directory layout belong to CapabilityPlan, not requirement clarification.

PluginIntent is complete when the primary scenarios, external effects, credentials and permissions, user experience, and executable acceptance criteria are unambiguous.

## CapabilityPlan

CapabilityPlan maps PluginIntent to DSH components:

```text
CapabilityPlan
  ReusePlan
  ComponentGraph
  PublicContracts
  PackagePlan
  LifecyclePlan
  ErrorPlan
  TestPlan
  Traceability
```

Typical mappings include:

| Requirement characteristic | Derived capability |
| --- | --- |
| Agent invokes an operation | Tool |
| Multiple consumers share domain behavior | Service |
| Multiple or replaceable implementations exist | Service Definition and Provider |
| External system or database is accessed | Connector or Provider |
| User-managed ordinary configuration | Settings |
| Token, password, or other secret | Credential |
| Browser invokes Host behavior | Remote API |
| User needs a visible or interactive surface | Client UI contribution |
| Durable session fact drives UI | Session Event and Projection |
| A file, report, chart, or evidence pack is produced | Artifact |
| Long-running or multi-step operation | Job or Workflow |
| Operation requires consent | Approval |
| Domain procedure should guide the model | Skill |

The default is one cohesive package with internal component boundaries. Packages split only for a current reason: interchangeable providers, independent installation, heavy dependencies, separate release ownership, or a stable contract used by multiple consumers.

Public contracts are designed before implementation. Tool schemas remain simple and model-facing; Remote methods expose only browser needs; Settings and Credential boundaries prevent secrets from entering ordinary responses, logs, errors, or model context; UI extends existing Slots by default.

Every component traces to one or more PluginIntent requirements, and every scenario traces to a verification path. Components without a requirement source are removed.

## ImpactPlan

ImpactPlan is generated once from the design and again from the implemented diff:

```text
ImpactPlan
  RuntimeImpact
  FileImpact
  DependencyImpact
  CompositionImpact
  UIImpact
  SessionImpact
  StateImpact
  SecurityImpact
  ExternalEffects
  ActivationPlan
  MigrationPlan
  RollbackPlan
```

The observed implementation impact must be contained by the approved planned impact. New permissions, dependencies, public interfaces, secrets, external side effects, core UI changes, or migrations reopen review.

Activation is derived from actual changes:

| Change | Activation |
| --- | --- |
| Live Settings value | Save and apply live |
| Runtime-managed connector record | Save and reconnect |
| Client bundle | Rebuild client; production usually also restarts Host and refreshes Browser |
| Tool, Skill, prompt, or preset capability | Start a new session |
| Host plugin or composition | Restart DSH |
| New dependency | Install, rebuild, and restart |
| Persistent schema | Back up, migrate, and restart |
| Documentation or tests only | No runtime activation |

UI impact is classified as none, Slot extension, new section, core layout, or root replacement. Core layout is high risk; root replacement is not automatically installed in the first release.

External effects record trigger, reversibility, idempotency, approval, audit, and retry behavior. Installation rollback restores composition, package and lockfile state; user settings and credentials are preserved by default. External business operations are not automatically undone unless a safe inverse is explicitly supported and approved.

## Implementation orchestration

Implementation starts only from approved PluginIntent, CapabilityPlan, and ImpactPlan.

Tasks carry requirement IDs, dependencies, allowed file changes, tests, impact labels, and evidence. The default order is:

```text
public types and contracts
  -> Service
  -> Provider
  -> Settings and Credentials
  -> Tools and Remote API
  -> Client UI
  -> integration tests
  -> documentation and examples
```

Each task follows a small engineering loop:

```text
read task contract
  -> write a failing test
  -> implement the minimum behavior
  -> run the test
  -> simplify where useful
  -> type-check
  -> record evidence
```

Shared contracts stabilize before dependent work is parallelized. Tasks that modify the same files or rely on undecided interfaces remain sequential.

Planned checkpoints cover contracts, Service and Provider, Tools, Remote and UI, and final integration. A checkpoint records files, tests, open issues, and observed impact. It may correspond to an atomic Git commit.

Failures are classified as type, unit, loading, external-service, permission, requirement, or architecture failures. The Builder diagnoses from evidence and returns to the smallest responsible stage. It does not bypass a policy denial or repeatedly retry an unchanged failing action.

Implementation is complete only when all planned components exist, every requirement maps to code, every public contract has tests, type checks and unit tests pass, and observed impact stays within the approved boundary.

## Approval boundaries

Three explicit gates exist:

1. Design approval before source generation.
2. Installation approval before dependencies, profiles, presets, migration, or service restart are changed.
3. Publication approval before any push, package publication, release creation, marketplace upload, or shared-team mutation.

## VerificationReport

VerificationReport records each required check as `not-run`, `passed`, `failed`, or `skipped`, together with the command or procedure, timestamp, relevant output, and artifact paths. A required check cannot be skipped without an approved reason. The report separates package validation, unit tests, DSH composition loading, security review, installation rehearsal, and user-scenario acceptance so a green low-level test cannot hide a failed runtime path.

The first release validates the packaged preset structure, exercises installation against an isolated DSH home, and proves that reinstall and removal do not silently overwrite user-owned files. Runtime acceptance against a real DSH checkout remains a separate named check because it depends on the target installation.

## Installation transaction

The first release is distributed as an installable user Agent preset rather than a normal DSH bundle. DSH currently discovers user presets from `<DSH_HOME>/.agent-presets`, while an out-of-tree bundle contributes Cordis patch rows and has no stable interface for adding a preset root. This keeps the first release outside DSH core and makes the change reversible.

Installation resolves the DSH home from an explicit `--dsh-home`, then `DSH_HOME`, then the platform user home. It validates the packaged preset, stages a complete copy beside the target, and publishes it with a rename. An existing target is preserved unless the user explicitly requests replacement. Replacement first moves the previous preset to a backup and restores it if publication fails. Uninstall removes only the exact `plugin-builder` preset installed at the resolved root.

Installation does not install dependencies, change the active default preset, restart DSH, edit a profile, or publish anything externally. A running DSH process discovers the new preset on the next roster read; an existing session remains on its original preset and the user starts a new session in Plugin Builder mode.

## Runtime acceptance

The minimum acceptance path is:

1. Install into an isolated DSH home.
2. Confirm the preset is listed as `plugin-builder` and its composition parses.
3. Start a new session with the preset.
4. Ask for a small developer-oriented DSH plugin.
5. Confirm the Agent enters discovery and clarification before implementation, produces PluginIntent, CapabilityPlan, and ImpactPlan artifacts, and does not install without approval.
6. Confirm removal deletes only this preset and it disappears from later roster reads.

The first automated slice covers steps 1, 2, and 6 without an LLM. The assembled DSH session scenario is retained as an explicit runtime acceptance check until a deterministic snapshot harness is added to this repository.

## Developer-facing experience

The first release adds one mode named `插件构建器`, described as a guided workflow for developing DSH plugins. It inherits the Cordis creation mode's shell, filesystem, planning, workflow, inspection, and temporary mounting capabilities. Its persona establishes the workflow gate, and its bundled skill provides detailed DSH-specific discovery, capability mapping, implementation, verification, installation, and delivery instructions.

The Agent begins from the user's business request. It infers plugin components, asks only architecture-changing questions, shows an impact review before writing code, and shows an exact installation review before activation. Generated artifacts live in the target workspace under `.dsh/plugin-builder/`; the installed preset stores no project state.

## Delivery and package contract

The repository is a Node.js ESM package requiring Node.js `^22.19.0 || >=24.0.0` and has no runtime dependencies in the first release. It exposes a `dsh-plugin-builder` command with `install`, `status`, and `uninstall` operations. The npm package includes the command implementation, the complete preset directory, README, license, and design documentation.

Git installations need no `prepare` build because executable JavaScript is shipped directly. Registry and tarball installations likewise run no install-time scripts. Publication remains outside the implementation workflow and requires explicit approval.

## Future distribution seam

When DSH exposes an additive registry or bundle manifest for preset contributions, the package can replace filesystem installation with native profile composition. The stored preset format and workflow artifacts remain unchanged so this migration does not alter user projects.
