# Security Policy

## Reporting a Vulnerability

This is a personal educational project. If you discover a security vulnerability, please open an issue on GitHub or contact the repository owner directly.

## Known Dependencies Vulnerabilities

Last audit: January 2026

### Backend

**9 LOW severity vulnerabilities** (all in development dependencies):
- `diff` package (used by ts-node/jest)
- Affects: Testing environment only
- Status: Acceptable for development project
- Impact: No production impact (dev/test only)

### Web Admin

**16 MODERATE severity vulnerabilities**:

1. **esbuild** (used by Vite):
   - Issue: Development server can read responses
   - Affected: Development environment only
   - Status: Not affecting production builds
   - Mitigation: Only use dev server in trusted local environment

2. **undici** (used by Firebase SDK):
   - Issues:
     - Insufficiently Random Values
     - Denial of Service via bad certificate data
     - Unbounded decompression chain
   - Affected: Firebase client SDK dependencies
   - Status: Waiting for Firebase SDK updates
   - Mitigation: Using latest Firebase SDK version (10.7.2)

## Security Best Practices Implemented

✅ **Environment Variables**:
- No credentials committed to Git
- `.env.example` templates provided
- All sensitive data in `.gitignore`

✅ **Firebase Security**:
- Authentication required for all operations
- Firestore security rules in place (development mode)
- **Note**: Production deployment requires strict security rules update

✅ **Input Validation**:
- Zod schemas for all API inputs (backend)
- Type-safe TypeScript throughout

✅ **CI/CD**:
- Automated linting and testing
- Pre-deployment hooks prevent broken builds

## Production Deployment Checklist

Before deploying to production:

- [ ] Update Firestore security rules (see `CLAUDE.md`)
- [ ] Update Storage security rules if using file uploads
- [ ] Enable Firebase App Check
- [ ] Configure CORS properly for Cloud Functions
- [ ] Review and limit Firebase API key restrictions
- [ ] Enable Firebase Authentication email verification
- [ ] Set up proper monitoring and alerting
- [ ] Review and update npm dependencies
- [ ] Enable rate limiting on Cloud Functions

## Note for Contributors

This is a **prototype/educational project** not currently deployed in production. Security measures are appropriate for a development environment. For production deployment, additional hardening is required (see checklist above).

For questions about security, please refer to:
- Firebase Security Documentation: https://firebase.google.com/docs/rules
- OWASP Top 10: https://owasp.org/www-project-top-ten/
