# LU48 — Session Authentication

## Setup

```bash
npm install
Copy-Item .env.example .env
npm run setup
npm run dev
```

Before starting the server, replace the placeholder `COOKIE_SECRET` in `.env` with a secret of at least 32 characters. In PowerShell, generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep `COOKIE_SECURE=false` for local HTTP. Set it to `true` in production and serve the API over HTTPS. `SESSION_TTL_MS` controls both the cookie lifetime and server-side session lifetime. `.env` and the local SQLite database are ignored by Git; never commit real secrets.

Seeded demo account: `sam@example.com` / `SessionDemo!48`.

## Endpoints

- `POST /auth/login` accepts `{ "email": "sam@example.com", "password": "SessionDemo!48" }`. A successful response returns only public user fields and sets a signed, `httpOnly` `sid` cookie.
- `GET /auth/me` returns the authenticated user after validating the signed cookie, live session, and user record.
- `POST /auth/logout` revokes the server-side session and clears the cookie. It returns `204`, including when called repeatedly.

User lookup is isolated in `src/db/userRepository.js`; session lifecycle is isolated in `src/session/sessionStore.js`. The session store is an in-memory `Map` for learning and local execution only. It loses sessions on restart and is not shared between app processes. Production should use a shared expiring store such as Redis.

## Verify Locally

With the server running, use `curl.exe` to preserve and replay the cookie:

```powershell
# Login; inspect Set-Cookie for sid, HttpOnly, and SameSite=Lax.
curl.exe -i -c cookies.txt -H "Content-Type: application/json" -d '{"email":"sam@example.com","password":"SessionDemo!48"}' http://localhost:3000/auth/login

# Authenticated identity.
curl.exe -i -b cookies.txt http://localhost:3000/auth/me

# Missing and malformed cookies both return generic 401 AUTH_REQUIRED.
curl.exe -i http://localhost:3000/auth/me
curl.exe -i -H "Cookie: sid=not-a-valid-signed-cookie" http://localhost:3000/auth/me

# Preserve a copy, then logout; the response expires sid.
Copy-Item cookies.txt old-cookies.txt
curl.exe -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout

# A copied pre-logout cookie is rejected because its server session was destroyed.
curl.exe -i -b old-cookies.txt http://localhost:3000/auth/me
```

To confirm `Secure`, set `COOKIE_SECURE=true` and inspect the login response while using HTTPS. A client should not be expected to send a `Secure` cookie over local plain HTTP.
