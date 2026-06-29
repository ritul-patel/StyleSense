# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ Yes |
| Older branches | ❌ No |

Only the latest code on `main` receives security fixes. Please update to the latest version before reporting a vulnerability.

---

## Reporting a Vulnerability

**Do not open a public GitHub Issue for security vulnerabilities.** Doing so exposes the vulnerability to all users before a fix is available.

To report a security vulnerability, please:

1. **Email** the maintainer directly using the contact information on the GitHub profile.
2. **Include** the following in your report:
   - A clear description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact (what an attacker could achieve)
   - Any suggested mitigations (optional)

You will receive an acknowledgment within **48 hours** and a status update within **7 days**.

---

## What Qualifies as a Security Vulnerability?

- Authentication bypass or privilege escalation
- Server-Side Request Forgery (SSRF)
- SQL injection or data exposure
- Cross-Site Scripting (XSS) via API-sourced data
- Improper rate limiting allowing abuse
- Exposure of API keys, secrets, or user data

---

## Security Measures in This Project

The following controls are already implemented. Reports about known, accepted limitations are not considered vulnerabilities.

| Control | Implementation |
|---|---|
| Secure HTTP headers | Helmet.js on all Express responses |
| CORS | Allowlist of trusted origins only |
| Rate limiting | 100 req/min general; 10 req/min on analysis/AI routes |
| SSRF protection | `validateImageUrl()` blocks private/loopback IPs before download |
| Input validation | Zod on all API request bodies |
| EXIF stripping | Sharp removes image metadata before storage |
| JWT verification | Supabase service role key validates all protected routes |
| No secrets in source | All keys loaded from environment variables |
| Image deduplication | SHA-256 content hash prevents malicious re-uploads |

---

## Disclosure Policy

Once a fix is available and deployed, the vulnerability will be disclosed in the [CHANGELOG.md](CHANGELOG.md) with credit to the reporter (unless the reporter requests anonymity).
