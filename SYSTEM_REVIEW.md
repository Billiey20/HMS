# System Review Instructions: Security & Production Readiness

## Context
I am building a system using Supabase (Postgres) and a frontend framework. I need a rigorous audit focusing on security, data integrity, and error handling.

## Review Pillars
### 1. Supabase & Database Security
- Check for `enable row level security` on all tables mentioned.
- Look for "Service Role" key usage in frontend files (Critical Fail).
- Identify any direct Postgres queries that don't use the Supabase Client (SQL Injection risk).

### 2. Frontend Validation & Sanitization
- Flag any forms (Email, Phone, Password) missing regex or validation logic.
- Look for `dangerouslySetInnerHTML` or similar sinks for XSS.

### 3. Error Management
- Identify "Silent Fails": `catch (e) { console.log(e) }` with no user feedback.
- Ensure API calls have try/catch blocks and user-facing error messages.

### 4. Environment Safety
- Check for hardcoded API keys, passwords, or URLs.
- Verify that a `.gitignore` is present and covering `.env` files.

## Output Format
Provide a table of "Critical Issues" (Must fix), "Warnings" (Should fix), and "Optimizations" (Best practices).