# Security Audit Report - qanimeranker

**Date:** February 7, 2026 (Updated)
**Auditor:** Claude
**Version:** 1.1.0

---

## Executive Summary

The codebase has a solid security foundation with proper OAuth implementation, parameterized queries, and httpOnly cookies. All HIGH priority issues from the initial audit have been resolved.

---

## Findings

### 🔴 CRITICAL - None Found

No critical vulnerabilities identified. The core security architecture is sound.

---

### 🟠 HIGH Priority - ALL RESOLVED ✅

#### H1: Missing Security Headers ✅ FIXED
**File:** `server/src/index.ts`
**Issue:** No security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP)
**Status:** ✅ Fixed - helmet.js added with custom CSP configuration

#### H2: No Rate Limiting ✅ FIXED
**File:** `server/src/index.ts`
**Issue:** API endpoints have no rate limiting
**Status:** ✅ Fixed - Multiple rate limiters added:
- `apiLimiter`: 100 req/15min for API routes
- `authLimiter`: 10 req/15min for login
- `healthLimiter`: 60 req/min for health checks
- `staticLimiter`: 300 req/min for static assets/SPA fallback

#### H3: No Request Body Size Limit ✅ FIXED
**File:** `server/src/index.ts`
**Issue:** `express.json()` has no size limit
**Status:** ✅ Fixed - Body limit set to 1MB

#### H4: Missing CSRF Protection ✅ FIXED
**File:** `server/src/index.ts`
**Issue:** No CSRF token validation for state-changing requests
**Status:** ✅ Fixed - Origin/Referer header validation added as defense-in-depth alongside SameSite cookies

---

### 🟡 MEDIUM Priority

#### M1: In-Memory State Token Storage
**File:** `server/src/routes/auth.ts` (line 12)
**Issue:** OAuth state tokens stored in Map (memory)
**Risk:** Lost on server restart, doesn't scale horizontally
**Current mitigation:** Tokens expire in 10 minutes
**Recommended:** Use Redis for production at scale

#### M2: GraphQL Proxy Has No Query Limits
**File:** `server/src/routes/proxy.ts`
**Issue:** No depth/complexity limits on proxied GraphQL queries
**Risk:** Nested query attacks could cause high AniList API usage
**Recommended:** Add query complexity analysis or whitelist allowed queries

#### M3: Ranking Data Not Validated
**File:** `server/src/routes/rankings.ts` (line 34)
**Issue:** `data` from request body is saved without schema validation
**Risk:** Malformed data could cause frontend issues
**Recommended:** Add Zod or Joi schema validation

```typescript
import { z } from 'zod';

const RankingSchema = z.object({
  ranking_order: z.array(z.number()),
  folders: z.array(z.object({
    id: z.string(),
    name: z.string(),
    items: z.array(z.number())
  })).optional()
});
```

#### M4: Error Messages Could Leak Info
**Files:** Various route files
**Issue:** `console.error` logs full errors, but response is generic
**Risk:** Low - responses don't leak info, but logs could be verbose
**Status:** ✅ Acceptable - errors are logged but not exposed to users

---

### 🟢 LOW Priority

#### L1: Cookie SameSite Could Be Stricter
**File:** `server/src/routes/auth.ts` (line 142)
**Issue:** `sameSite: 'lax'` is used
**Note:** 'strict' would break OAuth redirect flow, 'lax' is correct here
**Status:** ✅ Correct implementation

#### L2: No CSP Header for Frontend
**Issue:** No Content-Security-Policy header
**Risk:** XSS mitigation layer missing
**Fix:** Configure CSP via helmet

#### L3: Consider Adding Subresource Integrity
**Issue:** If using any CDN resources, SRI hashes should be added
**Status:** ✅ Currently no CDN dependencies in frontend

---

## Security Positives ✅

| Feature | Implementation | Status |
|---------|----------------|--------|
| OAuth state validation | Crypto random tokens, validated on callback | ✅ Secure |
| SQL injection prevention | mysql2 parameterized queries (`pool.execute`) | ✅ Secure |
| JWT in httpOnly cookie | `httpOnly: true, secure: true (prod)` | ✅ Secure |
| CORS restriction | Single origin whitelist | ✅ Secure |
| CLIENT_SECRET server-side | Never exposed to frontend | ✅ Secure |
| Password storage | N/A - OAuth only | ✅ N/A |
| XSS in responses | JSON responses only, no HTML rendering | ✅ Secure |

---

## Recommended Actions

### Completed ✅
1. [x] Install and configure helmet.js
2. [x] Add express-rate-limit (API, auth, health, static routes)
3. [x] Add body size limit to express.json()
4. [x] Add CSRF protection via Origin/Referer validation
5. [x] Add input validation to optionalAuthMiddleware
6. [x] Add defense-in-depth for SQL injection prevention
7. [x] Fix log injection vulnerability
8. [x] CodeQL security scanning (weekly + on push)
9. [x] Dependabot for dependency updates (weekly)
10. [x] Dependabot auto-merge for patch/minor updates

### CodeQL Alerts - Reviewed & Dismissed
The following alerts were reviewed and dismissed as false positives or intentional design:
- **js/missing-token-validation** - CSRF protection via Origin validation + SameSite cookies (appropriate for SPA)
- **js/user-controlled-bypass** - `optionalAuthMiddleware` intentionally allows unauthenticated access for public routes
- **js/sql-injection** - False positive; using parameterized queries with mysql2

### Soon (Next Week)
11. [ ] Add Zod validation for ranking data
12. [ ] Consider GraphQL query complexity limits

### Future (At Scale)
13. [ ] Migrate state tokens to Redis
14. [ ] Set up security monitoring/alerting

---

## Infrastructure Security

### Server Hardening (CT 130 - anime-ranker.lab.qstivi.com)

| Component | Status | Notes |
|-----------|--------|-------|
| Unattended upgrades | ✅ Enabled | Auto-installs security updates daily at 6 AM |
| Backups | ✅ Scheduled | Daily at 5 AM (before auto-updates) |
| SSH access | ✅ Key-only | Password auth disabled |
| Firewall | ✅ Proxmox | Only required ports exposed |
| Cloudflare Tunnel | ✅ Configured | Secure CI/CD access without port forwarding |

### Auto-Update Configuration

Unattended upgrades configured to:
- Install security updates automatically
- Run daily at 6:00 AM (after 5 AM backups)
- Auto-remove unused dependencies
- Reboot if required (at 6:00 AM)

```bash
# Check status
systemctl status unattended-upgrades

# View logs
cat /var/log/unattended-upgrades/unattended-upgrades.log
```

---

## Dependencies Check

```bash
npm audit
```

Run this regularly. Dependabot is configured to auto-update patch/minor versions.

---

## Conclusion

The application has a **solid security foundation**. The main gaps are missing security headers and rate limiting, which are straightforward to add. No critical vulnerabilities were found.

**Overall Security Grade: A-**

All HIGH priority issues have been addressed. Remaining items are optional hardening for scale.
