# ToyKart Email Authentication

## Folder structure

```
server/
├── .env.example              # Gmail + JWT + Mongo vars
├── src/
│   ├── models/User.js        # isVerified, tokens, OTP fields
│   ├── routes/authRoutes.js  # Auth API routes
│   ├── controllers/authController.js
│   ├── controllers/orderController.js  # triggers order email
│   ├── middleware/authMiddleware.js    # JWT protect
│   ├── middleware/authRateLimit.js     # brute-force limits
│   └── utils/
│       ├── sendEmail.js          # Nodemailer (Gmail)
│       ├── emailTemplates.js     # HTML templates
│       ├── generateToken.js      # JWT, OTP, hashes
│       └── notifyOrderEmail.js   # Order placed email
```

## Install

```bash
cd server
npm install nodemailer bcryptjs jsonwebtoken dotenv express mongoose cookie-parser express-rate-limit
```

Already listed in `server/package.json`.

## Gmail setup

1. Google Account → Security → 2-Step Verification ON
2. App passwords → create "Mail" app password (16 chars)
3. Add to `server/.env`:

```env
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=ToyKart <you@gmail.com>
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_long_secret
OTP_EXPIRE_MINUTES=10
```

## API endpoints (base: `/api/auth`)

| Method | Path | Body / params |
|--------|------|----------------|
| POST | `/register` | name, email, phone, password |
| POST | `/login` | email, password (no verification required) |
| POST | `/forgot-password` | email |
| POST | `/verify-reset-otp` | email, otp |
| POST | `/reset-password` | email, password (after OTP verified) |
| GET | `/verify-email/:token?email=` | link from email |
| POST | `/resend-verification` | email |

## Postman examples

**Register**
```json
POST http://localhost:5000/api/auth/register
{ "name": "Ada", "email": "ada@test.com", "phone": "+8801712345678", "password": "Test@1234" }
```

**Login** (403 until verified)
```json
POST http://localhost:5000/api/auth/login
{ "email": "ada@test.com", "password": "Test@1234" }
```

**Verify email** — open link from inbox or:
```
GET http://localhost:5000/api/auth/verify-email/TOKEN?email=ada@test.com
```

**Forgot password**
```json
POST http://localhost:5000/api/auth/forgot-password
{ "email": "ada@test.com" }
```
Check server console in dev for OTP if Gmail not configured.

**Verify OTP**
```json
POST http://localhost:5000/api/auth/verify-reset-otp
{ "email": "ada@test.com", "otp": "482913" }
```

**Reset password**
```json
POST http://localhost:5000/api/auth/reset-password
{ "email": "ada@test.com", "password": "NewPass@99" }
```

## Local test

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

1. Register → check email (or dev console log)
2. (Optional) Click verify link → `isVerified: true`
3. Login anytime with valid credentials → JWT in response
4. Forgot password → enter OTP → verify → new password
5. Place order → confirmation email to shipping/user email

## Order & refund notifications

See `server/src/utils/notifyUserEmail.js` for all customer notification hooks (order placed, payment, status, cancel, refund, returns).

## Frontend (axios)

```js
await api.post("/auth/register", { name, email, phone, password });
await api.post("/auth/login", { email, password });
await api.post("/auth/forgot-password", { email });
await api.post("/auth/verify-reset-otp", { email, otp });
await api.post("/auth/reset-password", { email, password });
await api.get("/auth/verify-email", { params: { email, token } });
```

## Security notes

- OTP and email tokens are **hashed** (SHA-256) before saving — not stored in plain text.
- Email verification is optional; only sent after registration.
- Rate limits: 8 OTP requests/hour, 40 auth requests/15 min.
