# Contributing to WireCat

Thank you for helping improve WireCat projects. These guidelines apply unless the
repository provides more specific instructions.

## Before you start

Search the project's issues and pull requests for related work. Open an issue in
the affected repository before making a large change so maintainers can discuss
the scope. Small fixes can go straight to a pull request.

Read that repository's README, contributor instructions, and development scripts.
Use its documented runtime and package manager. Run the checks required for your
change, and include the commands and results in your pull request. Do not run
tests against real accounts or services unless the repository explicitly explains
how to do so safely and you are authorized to use those accounts.

## Changes and pull requests

- Keep each pull request focused on one problem and explain the resulting behavior.
- Add a regression test when it meaningfully demonstrates a bug fix. Use synthetic data.
- Update user documentation when commands, configuration, or behavior change.
- Preserve third-party copyright, license, and attribution notices. Identify the
  source and license of any code, data, model, image, or other material you add.
- Never submit credentials, tokens, session files, private conversations, personal
  information, or recordings from real users. Redact diagnostics before sharing them.
- Review all submitted code, including code produced with AI tools. You remain
  responsible for its correctness, provenance, and permissions.

Maintainers review contributions and decide whether and when to merge them. A
pull request does not guarantee acceptance, a release date, or ongoing support.

## License and your right to contribute

Contributions are submitted under the license applicable to the target project
or file, unless explicitly agreed otherwise with its maintainers. The current
WireCat CLI projects use Apache-2.0 for their original code; separately licensed
third-party material retains its own terms. Check the target repository's LICENSE
and file notices rather than assuming all WireCat repositories share one license.

Only submit material you have the right to contribute, including any required
permission from your employer or other rights holders. Do not remove attribution
or relicense someone else's work without permission under its existing terms.
Contributing does not transfer your copyright to WireCat.

## Developer Certificate of Origin

For new contributions, sign off each commit to certify the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).
Read the certificate before signing. A sign-off is a certification of your right
to contribute; it is distinct from a cryptographic Git signature.

```sh
git commit -s
```

Git adds a `Signed-off-by: Your Name <your-email>` trailer using your configured
identity. Use an identity you are entitled to use; a GitHub noreply email is fine.
Your commit identity and sign-off become part of the public project history.
If a sign-off is missing, maintainers may ask you to add it to your own commits
before merging. Do not sign on behalf of another contributor or rewrite their
commits to add a certification they have not made.

## Security and conduct

Report vulnerabilities privately using the project's Security tab or
[the shared security policy](https://github.com/WireCatLabs/community/blob/main/security/README.md).
Follow the [code of conduct](https://github.com/WireCatLabs/community/blob/main/contributing/CODE_OF_CONDUCT.md)
in issues, reviews, and other project spaces.
