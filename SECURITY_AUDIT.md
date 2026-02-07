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
2. [x] Add express-rate-limit
3. [x] Add body size limit to express.json()
4. [x] Add CSRF protection via Origin validation
5. [x] Add input validation to optionalAuthMiddleware
6. [x] Add defense-in-depth for SQL injection prevention

### Soon (Next Week)
7. [ ] Add Zod validation for ranking data
8. [ ] Consider GraphQL query complexity limits

### Future (At Scale)
9. [ ] Migrate state tokens to Redis
10. [ ] Set up security monitoring/alerting

---

## Dependencies Check

```bash
npm audit
```

Run this regularly. Dependabot is configured to auto-update patch versions.

---

## Conclusion

The application has a **solid security foundation**. The main gaps are missing security headers and rate limiting, which are straightforward to add. No critical vulnerabilities were found.

**Overall Security Grade: A-**

All HIGH priority issues have been addressed. Remaining items are optional hardening for scale.
