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

### Lint rules

The shared Biome base adds these to the `recommended` preset's `noGlobalEval` and `noBlankTarget`
(and `noDangerouslySetInnerHtml` where the React domain is on). The plugins are GritQL files copied
into `config/wirecat/` with the base. They run with the rest of Biome in the commit hook and PR CI.

| Rule | Level | Catches |
| --- | --- | --- |
| `security/noSecrets` | error | High-entropy strings and known token shapes, before gitleaks sees the commit |
| `plugin/no-shell-true` | error | `shell: true` in a `spawn`, `exec`, `execFile` or `fork` call (and their `Sync` forms) |
| `plugin/no-exec-interpolation` | error | `exec` or `execSync` given a template literal with `${}` or a `+` concatenation |
| `plugin/no-new-function` | error | `new Function(...)` and `Function(...)` |
| `plugin/no-unbounded-spread` | warning | `.push(...x)`, `Math.max(...x)`, `Math.min(...x)` (see [Size limits](#size-limits)) |

`noSecrets` uses an entropy threshold of 50, not Biome's default of 41. The default flags hundreds of
identifiers, Cyrillic strings and generated API descriptions. The rule is a net under gitleaks, not a
replacement: on 100 random tokens of each shape, 50 caught every AWS key ID, Slack token and JWT, 89–98%
of GitHub, OpenAI and AWS secret keys, 63–69% of Stripe and Google API keys, about half of Telegram bot,
Anthropic and Google OAuth client secrets, and no hex string. The default 41 does not reach 100% on those
shapes either. It is off for test files, `test/`, `tests/`, `__tests__/`, `fixtures/` and
`generated/`. Tests carry fake credentials on purpose, and generated files cannot keep a suppression
comment. Biome runs it on JavaScript and TypeScript only, so lock files and JSON are not checked.

The spread rule is a warning and skips tests and the `testing/`, `scripts/`, `bench/` and
`performance/` folders. Lint cannot tell a list of three from a list of a million, and most
spreads are over small lists. Fix the ones over user data by looping; leave the rest.

Biome prints the first 20 diagnostics, so in a repository with many spread warnings an error can be
counted but not shown; `biome check --diagnostic-level=error .` lists errors only.

Suppress a reviewed site with the reason:
`// biome-ignore lint/security/noSecrets: Crockford base32 alphabet, not a key`, or
`// biome-ignore lint/plugin/no-shell-true: Windows .cmd shim, fixed arguments`.

The plugins match syntax, not data flow. They miss options or commands held in a variable,
a renamed `child_process` import (`proc.exec`), `util.promisify(exec)`, and
`shell: process.platform === "win32"`. Review and CodeQL at release cover those.

### Audit method

How a security audit of these repositories is run lives in cli-testing:
[METHOD.md](https://github.com/WireCatLabs/cli-testing/blob/main/docs/security/METHOD.md) (scope
and tools), [RUNBOOK.md](https://github.com/WireCatLabs/cli-testing/blob/main/docs/security/RUNBOOK.md)
(the steps) and [LESSONS.md](https://github.com/WireCatLabs/cli-testing/blob/main/docs/security/LESSONS.md)
(how the tools behave, learned the hard way). Link these from each repository's contributor
documentation rather than restating them.

## Size limits

Code that handles user data must keep working when that data is large. Never spread an
unbounded list into a call (`push(...items)`, `Math.max(...items)`): V8 throws at about
125,000 arguments, so loop or reduce instead. SQLite takes at most 32,766 `?`
parameters, so chunk an `IN` list by 500 or pass it as one JSON parameter through
`json_each`. Send provider requests in batches no larger than the provider's documented
limit. Every command that takes a list states "at most N" in `--help` when N is
enforced. Past N it fails with an error that says how to split the input. Reading a
folder or file of user-chosen size has a cap or streams.
