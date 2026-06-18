# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | Yes |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email: admin@immersio.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We aim to respond within 72 hours and patch critical issues within 7 days.

## Security Practices

- JWT tokens expire after 15 minutes; refresh tokens after 7 days
- All user input validated at API boundary
- Secrets managed via environment variables (never committed)
- Dependencies scanned via Dependabot
- HTTPS enforced in production via Nginx
