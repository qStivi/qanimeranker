# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **Do NOT** create a public GitHub issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include as much detail as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Measures

This project implements the following security measures:

- **OAuth secrets server-side only**: AniList CLIENT_SECRET never exposed to frontend
- **httpOnly cookies**: JWT tokens stored in httpOnly cookies (not localStorage)
- **CORS protection**: Strict origin checking
- **Input validation**: All user inputs validated
- **Dependency scanning**: Dependabot monitors for vulnerable dependencies
- **Code analysis**: CodeQL scans for security vulnerabilities
- **No sensitive data storage**: Only stores user IDs, folder structure, ranking order (no anime metadata)

## Dependencies

Security updates for dependencies are managed via Dependabot and reviewed weekly.
