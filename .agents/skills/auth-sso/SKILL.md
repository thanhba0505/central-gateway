---
name: gateway-auth-sso
description: Standards, protocols, and architectural specifications for Central Gateway's Single Sign-On (SSO) and Identity Access Management (IAM) engine. Enforces OAuth2 Authorization Code flow with PKCE, session security, cross-domain token exchange, and client app whitelisting.
---

# Central Gateway SSO & IAM Architecture Standards

This skill governs the implementation and maintenance of Central Gateway as the centralized Identity Provider (IdP) and Single Sign-On (SSO) broker for the Prism engineering ecosystem.

---

## 1. Protocol Standard: OAuth2 with PKCE

Central Gateway implements the **OAuth2 Authorization Code Flow with PKCE (RFC 7636)** as the standard protocol for all web and mobile child applications:

1. **Authorization Request (`GET /api/v1/auth/oauth/authorize`)**:
   - Query Parameters:
     - `client_id`: Unique identifier of registered child application (e.g. `wonderlab`).
     - `redirect_uri`: Must exactly match one of the client's pre-registered `redirect_uris`.
     - `response_type`: Must be `code`.
     - `state`: Cryptographically random string provided by the client to prevent CSRF.
     - `code_challenge`: SHA-256 hash of the client's `code_verifier`, base64url-encoded.
     - `code_challenge_method`: Must be `S256`.
2. **Session Verification & User Consent**:
   - If the user has an active `gateway_session` cookie, Gateway auto-issues the `authorization_code` and immediately redirects back to `redirect_uri`.
   - If unauthenticated, user is presented with the Cosmic Violet Login view. Upon successful credentials check, session cookie is set and the code is generated.
3. **Token Exchange (`POST /api/v1/auth/oauth/token`)**:
   - Payload:
     - `grant_type`: `authorization_code`
     - `code`: Single-use authorization code (valid for 5 minutes).
     - `client_id`: Client identifier.
     - `code_verifier`: Plaintext secret matching the original `code_challenge`.
   - Gateway verifies `SHA256(code_verifier) === code_challenge`, marks code as `usedAt`, and issues:
     - `access_token`: Signed JWT token.
     - `user`: Sanitized profile object (`id, username, email, role, avatarUrl`).

---

## 2. Cookie & Session Security Policy

1. **Gateway Session Cookie (`gateway_session`)**:
   - Scoped strictly to the Gateway domain.
   - `HttpOnly: true` (prevents XSS extraction).
   - `SameSite: Lax` (permits top-level redirects from child apps while preventing CSRF).
   - `Secure: true` in production environments.
2. **Child Application Cookies**:
   - Child apps (e.g. Wonderlab) do not share cookie domain with Gateway.
   - Child apps receive user identity via the server-to-server token exchange and set their own independent local session cookie.
   - Logouts at the child app do not automatically revoke Gateway SSO session unless explicit Single Log-Out (SLO) is triggered.

---

## 3. Database Integrity & Error Handling

- **Single-Use Codes**: Authorization codes must be invalidated immediately upon use (`usedAt != null`) or after 5 minutes.
- **Fail-Fast Error Responses**:
  - `invalid_client`: Unrecognized or inactive `client_id`.
  - `invalid_redirect_uri`: Mismatched redirect URL.
  - `invalid_grant`: Expired or already used authorization code.
  - `invalid_verification`: PKCE `code_verifier` hash mismatch.
