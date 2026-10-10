# WireCat community

Shared policies, contributor resources, and maintainer guidance for WireCat
projects. This repository can grow to include organization resources beyond CLIs.

- [Contributing](CONTRIBUTING.md): development, contribution licensing, and DCO sign-off.
- [Security](SECURITY.md): private vulnerability reporting.
- [Support](SUPPORT.md): usage questions and bug reports.
- [Code of conduct](CODE_OF_CONDUCT.md): community expectations and moderation.
- [Maintainer checklist](MAINTAINERS.md): licensing, attribution, branding, and release controls.

## GitHub defaults

This repository is the source of truth for shared policies. GitHub automatically
inherits community files only from a public repository named `.github`. The
[WireCatLabs/.github](https://github.com/WireCatLabs/.github) repository therefore
holds copies of the four policy files above.

Repository-local policies override those defaults. Shared defaults are displayed
by GitHub but are not included in individual repository clones or packages. Each
project must keep its own LICENSE and any required distribution notices.
See [GitHub's inheritance rules](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file).

After changing a shared policy on the main branch, synchronize the defaults:

```sh
python3 scripts/sync-defaults.py --check
python3 scripts/sync-defaults.py --apply
```

The command uses your existing GitHub CLI authentication and ordinary Git access.
It does not require a stored cross-repository token. `--check` makes no changes;
`--apply` commits and pushes only the four managed policy files to the defaults
repository. Synchronization is manual; there is no automatic deployment workflow.

## License

Original material in this repository is licensed under [Apache-2.0](LICENSE).
Linked external documents retain their own terms. A project's own license governs
contributions to that project; these defaults do not change it.
