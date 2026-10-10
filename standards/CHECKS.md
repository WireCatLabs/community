# Check schedule and rough timings

This is the proposed development policy in
[community PR2](https://github.com/WireCatLabs/community/pull/2) and the ten project
rollout PRs. It takes effect in a project when its changes are merged and its
local hooks are synchronized. Timing ranges are a guide, not a deadline guarantee.

## Local development

| When | Check | What it examines | Rough cost |
| --- | --- | --- | --- |
| Commit | Biome | Only staged JS, TS, and JSON files; formatting, syntax, lint rules, and project import restrictions | Usually well under 1 second |
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

## Pull requests and ordinary main-branch CI

| Check | Purpose | Rough cost after setup |
| --- | --- | --- |
| Config integrity | Verify copied preset hashes, pinned tools, and root config bindings | Less than 1 second |
| Repository Biome | Apply the shared code rules and local architecture restrictions | About 1–3 seconds |
| Markdown lint | Check configured documentation for missing code-fence languages, tabs, and empty links | About 1–3 seconds |
| New-commit secret scan | Scan the PR or push commit range, rather than all historical commits | About 1–3 seconds, including fetching the scanner |

The job does one cached dependency installation with lifecycle scripts disabled.
Checkout, Node/pnpm setup, cache restoration, and installation dominate its time.
Observed complete jobs across the ten projects took about 15–40 seconds; the
community job took about 13 seconds. Runner queues and cold downloads can add time.
Superseded fast runs are cancelled when another commit arrives.

PRs do not run full typechecking, tests, coverage, builds, generation, parity,
browser suites, OS matrices, or native-library builds. Third-party security apps
may post their own independent checks; these are outside the shared workflow.

The five-minute job timeout is a failure ceiling for stalled setup, not an expected
duration. A cold install is not promised to finish within the observed range.

## Releases and explicitly requested full validation

| Check group | What it covers | Rough scale |
| --- | --- | --- |
| Typecheck and build | Production code, tests/scripts where configured, compiled artifacts | A few seconds to about a minute per project |
| Full tests and coverage | Complete synthetic test suites and coverage floors | Seconds for small packages; roughly 1–3 minutes for large CLIs/libraries |
| Documentation and parity | Generated references, contracts, links, shared CLI behavior, and Bun smoke where configured | Seconds to a few minutes |
| Platform/install checks | Windows/macOS/Linux behavior, supported Node versions, package installation | Several minutes; queues and cold installs vary |
| Site browsers/export | Browser flows, responsive behavior, accessibility/SEO/link checks, and production export | Several minutes; a full site pipeline can take 10–20 minutes |
| Release security | Dependency/workflow audits and the existing full-history secret scan | Seconds to a few minutes |

For context, earlier local coverage runs took about 3 seconds for cli-core,
1 second for cli-meetings, 1 minute each for Telegram/MAX, and 2–3 minutes for
cli-messaging. The docs unit suite took about 8 seconds. These are observations
from one machine, not predictions for every runner.

Full validation is required before package publication. Existing release-build
checks are retained as well, so some tests/builds currently repeat during a release.
Platform jobs can run in parallel; their times should not simply be added together.
Allow minutes for a full release, particularly for larger CLIs and the docs site.

Site deployment is a publication operation and still performs full validation.
It can run after a main-branch merge or a released-tool update; it does not block
the ordinary PR fast-check job. Native wrappers keep their full OS probes in their
manual publish workflows. No workflow starts a live messenger test on its own.

Npm upload, registry propagation, and deployment are separate from the check
budget and can add time after validation passes.
