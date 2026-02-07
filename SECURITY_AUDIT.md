# Security Audit Report - qanimeranker

**Date:** February 7, 2026
**Auditor:** Claude
**Version:** 1.0.0

---

## Executive Summary

The codebase has a solid security foundation with proper OAuth implementation, parameterized queries, and httpOnly cookies. However, there are several areas that need improvement, primarily around security headers, rate limiting, and input validation.

---

## Findings

### 🔴 CRITICAL - None Found

No critical vulnerabilities identified. The core security architecture is sound.

---

### 🟠 HIGH Priority

#### H1: Missing Security Headers
**File:** `server/src/index.ts`
**Issue:** No security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP)
**Risk:** XSS, clickjacking, MIME-type sniffing attacks
**Fix:** Add helmet.js middleware

```typescript
import helmet from 'helmet';
app.use(helmet());
```

#### H2: No Rate Limiting
**File:** `server/src/index.ts`
**Issue:** API endpoints have no rate limiting
**Risk:** Brute force attacks, DoS, API abuse
**Fix:** Add express-rate-limit

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});
app.use('/api/auth/login', authLimiter);
```

#### H3: No Request Body Size Limit
**File:** `server/src/index.ts`
**Issue:** `express.json()` has no size limit
**Risk:** Large payload DoS attacks
**Fix:**

```typescript
app.use(express.json({ limit: '1mb' }));
```

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

### Immediate (This Session)
1. [ ] Install and configure helmet.js
2. [ ] Add express-rate-limit
3. [ ] Add body size limit to express.json()

### Soon (Next Week)
4. [ ] Add Zod validation for ranking data
5. [ ] Consider GraphQL query complexity limits

### Future (At Scale)
6. [ ] Migrate state tokens to Redis
7. [ ] Add comprehensive CSP policy
8. [ ] Set up security monitoring/alerting

---

## Dependencies Check

```bash
npm audit
```

Run this regularly. Dependabot is configured to auto-update patch versions.

---

## Conclusion

The application has a **solid security foundation**. The main gaps are missing security headers and rate limiting, which are straightforward to add. No critical vulnerabilities were found.

**Overall Security Grade: B+**

After implementing the HIGH priority fixes, the grade would be **A-**.
