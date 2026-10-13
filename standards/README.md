# Development standards

Use these presets for WireCat JavaScript and TypeScript repositories. They bring
the tools used by cli-docs into one reviewed baseline, while keeping application
rules and generated-file exclusions in each project's root configuration.

| Tool | Shared settings | Project settings |
| --- | --- | --- |
| Biome | Formatting, recommended rules, strict unused-code and type rules | Architecture boundaries, framework options, generated files |
| markdownlint-cli2 | Tabs, blank lines, fenced-code languages, empty links | Documents to check and additional rules |
| CSpell | English, British English, Russian, Spanish, WireCat vocabulary | Documentation scope and project vocabulary |
| Lefthook | Staged Biome and optional secret scan; no push hook | Additional project hooks |
| rumdl | Compatibility preset for existing CLI documentation checks | Existing docs commands and exclusions |

The Biome and hook base originated in cli-base (then named cli-core), which cli-docs already extended.
The Markdown rules and multilingual spelling additions originate in cli-docs.
The presets retain their Apache-2.0 attribution in adopting repositories.

## Adopt or update

From a reviewed checkout of this repository:

```sh
python3 scripts/adopt-standards.py /path/to/project
cd /path/to/project
pnpm install
pnpm lint
pnpm docs:lint
pnpm docs:spell
```

The installer copies presets into `config/wirecat/`, pins tool versions from
[toolchain.json](toolchain.json), and records the source revision and file hashes.
Biome, CSpell, Markdown, and Git hooks extend those copies. Existing project
overrides and development scripts are preserved. Commit the updated lockfile.
Inspect the resulting diff and run the project's required checks before merging.

In CI, `standards:check` detects edits to managed presets, dependency-version drift, or
disconnected root configs without network access. Project changes belong in root
configs; general improvements belong in this repository and are adopted through
reviewed updates. The installer changes files only: it does not install packages,
run hooks, push commits, publish releases, or rewrite application code.

## CI and hooks

See [the check schedule and timing guide](CHECKS.md) for what each check does and
rough costs.

| Trigger | Checks |
| --- | --- |
| Commit | Biome on staged files and staged secret detection |
| Push | No local checks |
| PR / main CI | Preset integrity, Biome, Markdown lint, critical secret detection, and bounded `ci:quick` bug checks |
| Push to `main` (each merge) | Full validation on Linux: typecheck, tests and coverage, build, Bun, documentation contracts, parity. Not on PR branches; no platform suites, no publishing |
| Release / monthly / manual full validation | Typecheck, tests and coverage, build, Bun, documentation contracts, parity, platform and browser suites, heavy security |

Hooks must not install dependencies, build, typecheck, generate files, or run tests.
Fast CI uses one cached dependency installation with lifecycle scripts disabled.
New commits cancel superseded fast runs. Runner queues and cold downloads are
outside the check-time budget, so total GitHub turnaround is not guaranteed.

Projects define `ci:quick` in their package scripts: existing typechecking for CLI packages,
synthetic unit tests for the docs site. This step has a two-minute failure ceiling.
The shared template allows projects without that script to adopt static checks alone;
review their early bug checks when onboarding. Do not put live-account or agent suites here.

The [monthly workflow template](templates/monthly.yml) calls a project's existing `ci.yml`
and pinned release-security workflow without publishing. Adjust its cron to stagger new projects
and its CodeQL languages to match their source. The
[cli-testing CI folder](https://github.com/WireCatLabs/cli-testing/tree/main/docs/ci)
contains the cross-project timing table, schedule, and failure-handling runbook.

Existing full suites are preserved as reusable full-ci workflows and are required
before package publication. The validated Linux build is packed once, then its SHA-256 is
verified at the release handoff; the publisher receives that exact artifact. Separate Bun/OS
jobs retain their own environment checks. Offline CLI contracts belong in full validation,
with plans and reviewed snapshots described in
[cli-testing](https://github.com/WireCatLabs/cli-testing/blob/main/docs/ci/CONTRACTS.md).
Site deployment remains a release operation with full
browser and export validation. Heavy platform and parity workflows are called by
full validation and remain available manually; they do not run for ordinary PRs.
Third-party security apps may post independent checks outside these YAML workflows.

Install local hooks with `pnpm exec lefthook install`. A missing gitleaks binary
produces a warning locally; CI secret detection remains mandatory. Spelling is
available for documentation edits without forcing every commit to scan all docs.

Node 24 is used in CI; projects retain their own minimum supported Node runtime
and TypeScript settings. Framework options and architecture restrictions stay local.

## Security checks

PR security is the fast Gitleaks secret check; hosted push protection prevents credential exposure. Heavy security checks run before package publication or production deployment, monthly, or on demand. Reuse the pinned cli-base `release-checks.yml` workflow and make publication depend on it. Production dependency audit and CodeQL block critical findings; noncritical findings are reviewed by the owner. Workflow analysis reports findings and fails if the scanner itself cannot complete. Do not add heavyweight source scanners to edit/Stop hooks or ordinary PR jobs. Tests, coverage and compatibility checks follow the release/monthly/manual schedule above.

Repositories without a package release use a manual security-release workflow; the documentation site's production deployment is its release boundary. Hosted secret-scanning availability can differ for private repositories, so record coverage gaps rather than claiming protection that the service does not provide.
