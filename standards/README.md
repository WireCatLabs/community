# Development standards

Use these presets for WireCat JavaScript and TypeScript repositories. They bring
the tools used by cli-docs into one reviewed baseline, while keeping application
rules and generated-file exclusions in each project's root configuration.

| Tool | Shared settings | Project settings |
| --- | --- | --- |
| Biome | Formatting, recommended rules, strict unused-code and type rules | Architecture boundaries, framework options, generated files |
| markdownlint-cli2 | Tabs, blank lines, fenced-code languages, empty links | Documents to check and additional rules |
| CSpell | English, British English, Russian, Spanish, WireCat vocabulary | Documentation scope and project vocabulary |
| Lefthook | Staged Biome and optional secret scan; config integrity before push | Additional project hooks |
| rumdl | Compatibility preset for existing CLI documentation checks | Existing docs commands and exclusions |

The Biome and hook base originated in cli-core, which cli-docs already extended.
The Markdown rules and multilingual spelling additions originate in cli-docs.
The presets retain their Apache-2.0 attribution in adopting repositories.

## Adopt or update

From a reviewed checkout of this repository:

```sh
python3 scripts/adopt-standards.py /path/to/project
cd /path/to/project
pnpm install
pnpm standards:check
pnpm lint
pnpm docs:lint
pnpm docs:spell
```

The installer copies presets into `config/wirecat/`, pins tool versions from
[toolchain.json](toolchain.json), and records the source revision and file hashes.
Biome, CSpell, Markdown, and Git hooks extend those copies. Existing project
overrides and development scripts are preserved. Commit the updated lockfile.
Inspect the resulting diff and run the project's required checks before merging.

`standards:check` detects edits to managed presets, dependency-version drift, or
disconnected root configs without network access. Project changes belong in root
configs; general improvements belong in this repository and are adopted through
reviewed updates. The installer changes files only: it does not install packages,
run hooks, push commits, publish releases, or rewrite application code.

## CI and hooks

| Trigger | Checks |
| --- | --- |
| Commit | Biome on staged files and staged secret detection |
| Push | Offline preset and dependency integrity check |
| PR / main CI | Preset integrity, Biome, Markdown lint, critical secret detection |
| Release / manual full validation | Typecheck, tests and coverage, build, Bun, documentation contracts, parity, platform and browser suites |

Hooks must not install dependencies, build, typecheck, generate files, or run tests.
Fast CI uses one cached dependency installation with lifecycle scripts disabled.
New commits cancel superseded fast runs. Runner queues and cold downloads are
outside the check-time budget, so total GitHub turnaround is not guaranteed.

Existing full suites are preserved as reusable full-ci workflows and are required
before package publication. Site deployment remains a release operation with full
browser and export validation. Heavy platform and parity workflows are called by
full validation and remain available manually; they do not run for ordinary PRs.
Third-party security apps may post independent checks outside these YAML workflows.

Install local hooks with `pnpm exec lefthook install`. A missing gitleaks binary
produces a warning locally; CI secret detection remains mandatory. Spelling is
available for documentation edits without forcing every commit to scan all docs.

Node 24 is used in CI; projects retain their own minimum supported Node runtime
and TypeScript settings. Framework options and architecture restrictions stay local.
