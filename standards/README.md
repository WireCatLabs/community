# Development standards

Use these presets for WireCat JavaScript and TypeScript repositories. They bring
the tools used by cli-docs into one reviewed baseline, while keeping application
rules and generated-file exclusions in each project's root configuration.

| Tool | Shared settings | Project settings |
| --- | --- | --- |
| Biome | Formatting, recommended rules, strict unused-code and type rules | Architecture boundaries, framework options, generated files |
| markdownlint-cli2 | Tabs, blank lines, fenced-code languages, empty links | Documents to check and additional rules |
| CSpell | English, British English, Russian, Spanish, WireCat vocabulary | Documentation scope and project vocabulary |
| Lefthook | Staged Biome and optional secret scan; typecheck before push | Additional project hooks |
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

The [CI template](templates/standards.yml) runs standards verification and the
shared Markdown check. Each repository's existing CI keeps code lint, typecheck,
tests, coverage, builds, and any specialized documentation checks. Spell checking
is available consistently but is not a universal CI gate yet: scopes and accepted
vocabulary must be reviewed per project before making it required.

Install local hooks with `pnpm exec lefthook install`. The staged secret check
warns if gitleaks is unavailable; it is not a substitute for a CI secret scan.
Run `docs:spell` when changing public documentation. A successful standards check
does not certify a repository is free of security issues or license problems.

Node 24 is used in the CI template; projects retain their own minimum Node runtime
and TypeScript build settings. Next.js, Tailwind, browser tests, documentation-site
generation, and CLI runtime tests stay with the projects that need them.
