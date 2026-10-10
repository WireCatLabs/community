# Maintainer checklist

These are review steps, not a certification that every WireCat project has
completed a legal or security audit. Record findings in the affected repository;
keep confidential ownership or legal material out of public issues.

## Copyright and licensing

- Confirm the rights to original code and contributions, including employer rights
  where relevant. A new root LICENSE cannot resolve uncertain provenance.
- Inventory copied source, bundled dependencies and binaries, models, fonts,
  images, datasets, and documentation. Check redistribution and attribution terms
  for what is actually shipped, not just direct package dependencies.
- Preserve applicable third-party notices. Include licenses and inherited NOTICE
  attribution in packages and other distributions where their terms require it.
  A new original-project NOTICE is optional under Apache-2.0.
- Verify packaged artifacts contain the project's LICENSE and required notices.
  Preserve licenses of historical releases; do not claim a license change revokes
  permissions already granted for earlier distributions.
- Review new commit sign-offs under the [DCO](https://developercertificate.org/).
  A sign-off records a contributor's certification; it does not prove ownership
  or replace review of third-party material. No automated DCO merge check is
  installed by this repository.

Apache permits commercial redistribution and proprietary derivatives subject to
its conditions. Its contribution patent grant is limited to the claims specified
in the license, and its warranty and liability provisions have exceptions. Read
the [license](https://www.apache.org/licenses/LICENSE-2.0.html) when assessing obligations.

## Branding

Software licensing and brand protection are separate. Apache-2.0 does not grant
general trademark permission, and publishing this repository does not register
WireCat as a trademark or establish ownership of a mark.

Before publishing a trademark policy or claiming exclusive brand rights, establish
the rights holder and check existing marks in the relevant markets. Get advice
for any registration, dispute, or uncertain rights. Do not describe a mark as
registered unless that registration has been verified. A future branding guide
should allow truthful references while addressing misleading claims of affiliation.

## Repository and release controls

- Enable private vulnerability reporting and maintain a monitored contact channel.
- Use appropriate branch rules, review requirements, and required CI checks.
- Limit repository administration and release credentials to people who need them.
- Prefer npm trusted publishing for CI releases where supported. Verify the
  configured organization, repository, workflow, and environment, including after
  the first manual publication of a package.
- Review dependency alerts and shipped-artifact provenance where available.
- Use synthetic tests and fixtures; avoid publishing account data or credentials.
- Synchronize policy changes to the GitHub defaults repository and review any local
  overrides that may need the same change.

These controls are recommendations to verify per project, not settings enabled
automatically by adding documentation. A separate CLA, automatic DCO enforcement,
trademark registration, and a full historical provenance audit are not established
by this repository.
