# Reporting a security vulnerability

Please report suspected vulnerabilities privately, rather than in a public issue,
pull request, or support chat.

- In the affected repository, open **Security → Advisories → Report a vulnerability**
  if private reporting is available.
- Otherwise, email [hello@wirecat.dev](mailto:hello@wirecat.dev) with the repository
  name and a short description of the problem.

Include the affected version, operating system, expected and observed behavior,
and a minimal reproduction using synthetic data. Explain the possible impact.
Never send credentials, tokens, session files, private messages, or real user data.
If a reproduction requires sensitive material, describe that requirement first
so maintainers can discuss a safe way to investigate.

Do not access other people's accounts, run disruptive tests, or use services
without permission. This policy does not authorize testing third-party systems
and does not establish a bug bounty or a legal safe-harbor agreement.

## Handling reports

Maintainers assess the report, coordinate a fix where appropriate, and discuss
public disclosure with the reporter. Please allow that discussion before posting
exploit details publicly. There is no guaranteed response time or payment.

Unless a project documents a different support policy, fixes target the latest
release or current development branch; older releases have no guaranteed
backports. Please report problems in older versions too and identify the version.

Repository-specific security instructions take precedence over this shared policy.
For the Telegram and MAX tools' local storage and agent permissions, see
[WireCat security documentation](https://wirecat.dev/en/docs/security).
