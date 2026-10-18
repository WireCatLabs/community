# Check schedule and rough timings

What each check examines and roughly how long it takes. The rules for what runs
where are in the WireCat CLI standards handbook, on its [CI page](https://github.com/WireCatLabs/cli-base/blob/main/docs/standards/ci.md)
(`WC-CI-…`); this page adds the details and the costs. Timing ranges are a guide,
not a deadline guarantee.

## Local development

| When | Check | What it examines | Rough cost |
| --- | --- | --- | --- |
| Commit | Biome | Only staged JS, TS, and JSON files; formatting, syntax, lint rules, security plugins, and project import restrictions | Usually well under 1 second |
| Commit | Gitleaks | Only staged changes; detects accidentally committed credentials | Usually well under 1 second |
| Push | None | No config integrity, typecheck, build, parity, or test hook | No check overhead |

The two commit checks run in parallel. Recent complete commit-hook runs took
roughly 0.3–1.5 seconds. Large staged changes can take longer. Hooks use the
installed Biome binary through Node, so committing does not invoke package-manager
auto-installation. If gitleaks is absent locally, the hook warns; CI still scans.

Config integrity is a CI check. Its command remains available for an explicit
manual investigation, but agents and hooks must not run it on each commit or push.
No full repository lint, spelling, generation, build, typecheck, or test suite is
required locally by default. Developers can run a targeted check when they need it.

## Pull requests and the fast job on `main`

| Check | Purpose | Rough cost after setup |
| --- | --- | --- |
| Config integrity | Verify copied preset hashes, pinned tools, and root config bindings | Less than 1 second |
| Repository Biome | Apply the shared code rules, security plugins, and local architecture restrictions | About 1–3 seconds; the security plugins add about half again in CPU time (cli-core measured 18 → 29 CPU-seconds) |
| Markdown lint | Check configured documentation for missing code-fence languages, tabs, and empty links | About 1–3 seconds |
| Early bug checks (`ci:quick`) | A typecheck, and in most CLIs a build and the command lint; the docs site's synthetic unit suite (WC-CI-4) | Allow about 5–30 seconds for type checks; docs tests previously took about 8 seconds |
| New-commit secret scan | Scan the PR or push commit range, rather than all historical commits | About 1–3 seconds, including fetching the scanner |

The job does one cached dependency installation with lifecycle scripts disabled.
Checkout, Node/pnpm setup, cache restoration, and installation dominate its time.
Observed complete jobs across the ten projects took about 15–40 seconds; the
community job took about 13 seconds. Runner queues and cold downloads can add time.
Superseded fast runs are cancelled when another commit arrives.

The early-bug step runs what [WC-CI-4](https://github.com/WireCatLabs/cli-base/blob/main/docs/standards/ci.md) lists for each repository:
a typecheck in every package, plus a build and the command lint in tg, max, memo, wa and drive;
the docs site runs its synthetic unit tests. Allow about 20–70 seconds for ordinary
CI depending on the package. First successful updated jobs took 17–34 seconds, with community
at 14 seconds; these include the early-bug step and exclude queue time. The step has a two-minute
failure ceiling. Local CLI type checks passed in about 1–6 seconds each. The docs command-group
test needs generated references and remains in full validation; the other 31 files run in fast CI.
Beside the fast job, every PR runs the full Linux validation through `pr.yml`
([WC-CI-5](https://github.com/WireCatLabs/cli-base/blob/main/docs/standards/ci.md)): the project's
`ci.yml` with platform suites skipped, so tests, the coverage floor, contracts, documentation and
parity fail before merge rather than on `main`. A new commit cancels the superseded run. Measured
on 2026-10-18, it takes about 2.5 minutes: wa 148 s, tg 145 s, max 164 s. Browser suites, OS
matrices, and native-library builds remain in release, monthly and manual full validation.
Some repositories also have a separate mandatory secret-security workflow. Its
current pinned implementation scans Git history, so that extra job can take
longer than the new-commit scan; it does not run tests, builds, or typechecking.
Third-party security apps may post independent checks as well.

The five-minute job timeout is a failure ceiling for stalled setup, not an expected
duration. A cold install is not promised to finish within the observed range.

## Pull request validation, each merge to `main`, releases, monthly checks, and requested full validation

| Check group | What it covers | Rough scale |
| --- | --- | --- |
| Typecheck and build | Production code, tests/scripts where configured, compiled artifacts | A few seconds to about a minute per project |
| Full tests and coverage | Complete synthetic test suites and coverage floors | Seconds for small packages; roughly 1–3 minutes for large CLIs/libraries |
| Documentation and parity | Generated references, contracts, links, shared CLI behavior, and Bun smoke where configured | Seconds to a few minutes |
| Platform/install checks | Windows/macOS/Linux behavior, supported Node versions, package installation | Several minutes; queues and cold installs vary |
| Site browsers/export | Browser flows, responsive behavior, accessibility/SEO/link checks, and production export | Several minutes; a full site pipeline can take 10–20 minutes |
| Release security | Dependency/workflow audits, full source scanning such as CodeQL, and the full-history secret scan | Seconds to several minutes; source scanning can dominate |

Each pull request and each merge to `main` run full validation on Linux, without the
platform/install checks and without publishing; the run on `main` catches merge skew between
pull requests (WC-CI-5 and [WC-CI-7](https://github.com/WireCatLabs/cli-base/blob/main/docs/standards/ci.md)). cli-docs runs its full validation
before each deployment instead, and community has no build to validate. Releases, monthly
runs and manual requests add the platform suites.

For context, earlier local coverage runs took about 3 seconds for cli-base,
1 second for cli-meetings, 1 minute each for Telegram/MAX, and 2–3 minutes for
cli-messaging. The docs unit suite took about 8 seconds. These are observations
from one machine, not predictions for every runner.

Before package publication, full validation packs its checked Linux build once and emits a
SHA-256 digest. The release handoff verifies and publishes that same immutable tarball, without a second install, full suite,
build, or repack. MAX/Telegram release-specific checks remain before packing.
Platform jobs can run in parallel; their times should not simply be added together.
Allow minutes for a full release, particularly for larger CLIs and the docs site.

Site deployment is a publication operation and still performs full validation.
It can run after a main-branch merge or a released-tool update; it does not block
the ordinary PR fast-check job. Native wrappers keep their full OS probes in their
manual publish workflows. MAX, Telegram and Zoom also run offline metadata/error/help/MCP
contracts in full validation (roughly 2.2, 3.0 and 0.7 seconds locally). No workflow starts a live
messenger test on its own.

Npm upload, registry propagation, and deployment are separate from the check
budget and can add time after validation passes.

Each project also runs full validation and release-grade security on the first day of each month,
staggered between 02:17 and 03:20 UTC. Native wrapper probes and community security follow afterward.
Monthly jobs never publish packages or deploy the site. They become active after merge.
The cross-project [timing table](https://github.com/WireCatLabs/cli-testing/blob/main/docs/ci/TIMINGS.md)
and [monthly runbook](https://github.com/WireCatLabs/cli-testing/blob/main/docs/ci/MONTHLY.md)
record the schedule and failure handling.
