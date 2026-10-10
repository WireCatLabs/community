# WireCat community

Shared policies, contributor resources, and development standards for WireCat
projects, including future projects beyond CLIs.

| Folder | Contents |
| --- | --- |
| [contributing/](contributing/README.md) | Contribution workflow, licensing, DCO sign-off, code of conduct |
| [legal/](legal/README.md) | Ownership, attribution, licensing, branding, maintainer checklist |
| [security/](security/README.md) | Private vulnerability reporting |
| [support/](support/README.md) | Usage questions and bug reports |
| [standards/](standards/README.md) | Shared linters, formatting, spelling, Git hooks, tool versions, CI template |
| [scripts/](scripts/) | Standards adoption and GitHub-default synchronization |

## GitHub entry points

Root CONTRIBUTING, SECURITY, SUPPORT, and CODE_OF_CONDUCT files are short entry
points to the structured policies. They are mirrored to
[WireCatLabs/.github](https://github.com/WireCatLabs/.github), the public repository
GitHub requires for organization defaults. Repository-local policies override them.
GitHub defaults are not included in individual clones or packages; each project
must retain its own LICENSE and required distribution notices.

After merging policy changes to main:

```sh
python3 scripts/sync-defaults.py --check
python3 scripts/sync-defaults.py --apply
```

The command uses existing GitHub CLI and Git authentication. Synchronization is
manual and changes only the four managed entry-point files. It does not store a
cross-repository token. See [GitHub's inheritance rules](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file).

## Shared tooling

See [standards/](standards/README.md) for the baseline and adoption command.
Project-specific framework configuration, runtime tests, and architectural lint
rules remain in their own repositories. Shared copies record their source revision
and hashes so updates can be reviewed and drift detected.

## License

Original material is licensed under [Apache-2.0](LICENSE). Linked external
materials retain their own terms. These policies do not change other projects'
licenses or establish completed ownership or trademark audits.
