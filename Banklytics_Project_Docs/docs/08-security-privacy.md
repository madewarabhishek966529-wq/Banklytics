# 08 — Security and Privacy Requirements

Bank statements are highly sensitive financial documents. Treat the project as a privacy-sensitive application from day one.

## 1. Upload security
- Allow only required formats (PDF and CSV).
- Enforce strict file-size and row/page limits.
- Check extension, MIME type, and file signature; do not trust the browser's content type.
- Store temporary files outside the public web directory.
- Generate server-side random file names.
- Never execute uploaded content.
- Consider malware scanning before processing in production.
- Rate-limit upload and parsing endpoints.

## 2. Authentication and authorization
- Hash passwords with Argon2id or bcrypt using appropriate settings.
- Use secure, HttpOnly, SameSite cookies if using cookie-based JWT/session auth.
- Protect against CSRF where applicable.
- Apply authorization checks to every statement and transaction query.
- Never accept user identity from request body as the authorization source.
- Add login and password-reset rate limits.

## 3. Data protection
- Use HTTPS in production.
- Encrypt database storage and backups using deployment-provider capabilities.
- Avoid storing original statement files longer than necessary.
- Mask account identifiers; avoid storing full account numbers.
- Do not store PINs, passwords, OTPs, CVVs, or online banking credentials.
- Keep secrets in environment variables or a secrets manager.
- Restrict database network access and credentials.

## 4. Logging and monitoring
- Do not log statement text, full transaction descriptions, account numbers, or raw request bodies.
- Log request IDs, user IDs where appropriate, parser version, status, duration, and error codes.
- Sanitize errors before returning them to users.
- Audit sensitive actions such as export and deletion without logging financial payloads.

## 5. User controls
- Explain what is stored and for how long.
- Provide statement deletion and account deletion workflows.
- Delete derived transactions when a statement is deleted, unless the user has explicitly chosen a different data-retention model.
- Provide data export where appropriate.
- Document backup deletion/retention timelines.

## 6. Production readiness
This document is an engineering checklist, not legal advice or a compliance certification. Before public launch, obtain an appropriate security review and assess applicable privacy, consumer-protection, and financial-data obligations in the countries where the product operates.
