# Backend — Template Reference

Node.js + Express REST API. Auth is fully delegated to Clerk — no passwords flow through this backend for social/OAuth users. MongoDB (via Mongoose) stores user records and app data.

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js (ESM, `"type": "module"`) |
| Framework | Express |
| Database | MongoDB via Mongoose |
| Auth | Clerk (`@clerk/backend`) — JWT verification + user sync |
| File uploads | Multer (memory storage) → AWS S3 |
| Payments | Stripe |
| Security | Helmet, HPP, cookie-parser, custom sanitizer |
| Logging | Morgan (dev), Winston (errors → `error.log`) |

---

## Project Structure

```
backend/
├── index.js                  # Entry point — connects DB, starts server
├── express-app.js            # Express setup: middleware, CORS, routes wired
├── nodemon.json              # Dev server config (NODE_ENV=dev)
│
├── api/                      # Route handlers (thin — delegate to services)
│   ├── auth.js               # POST /api/v1/auth/sync-user, GET /admin/me
│   └── user.js               # CRUD + notification prefs
│
├── services/                 # Business logic
│   ├── auth-service.js
│   └── user-service.js
│
├── database/
│   ├── connection.js         # Mongoose connect — reads MONGODB_URI from env
│   ├── models/
│   │   └── user.js           # User schema (see below)
│   └── repository/           # All DB queries — services call these
│       ├── auth-repository.js
│       └── user-repository.js
│
├── middlewares/
│   ├── protect.js            # Verifies Clerk JWT, syncs user into MongoDB
│   └── isAdmin.js            # Role check (role === "admin")
│
├── utils/
│   ├── app-errors.js         # Custom error classes (APIError, ValidationError…)
│   ├── error-handler.js      # Global Express error middleware
│   ├── index.js              # Shared helpers (pagination, sanitize, bcrypt…)
│   ├── S3Config.js           # AWS S3 — uploadFileToS3(), getPresignedUrl()
│   ├── stripe.js             # Stripe client stub
│   └── multer.js             # Multer memory storage (for S3 pipeline)
│
├── config/
│   └── index.js              # dotenv loader — picks .env.dev or .env.prod
│
├── .env.dev                  # Local dev env vars (never commit real values)
└── .env.prod                 # Production env vars (never commit)
```

---

## Environment Variables

Copy `.env.dev` and fill in real values. Never commit real credentials.

```env
PORT=5003
NODE_ENV=dev

MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>

CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=

STRIPE_SECRET_KEY=sk_test_...

CLIENT_URLS=http://localhost:3000,https://yourdomain.com
```

---

## Auth Flow

Every protected route runs through `protect` middleware:

1. Client sends `Authorization: Bearer <clerk-jwt>` header.
2. `protect.js` calls `verifyToken()` to validate the JWT against Clerk's JWKS.
3. Fetches the full Clerk user profile (`clerk.users.getUser`).
4. **Lazy-syncs** the user into MongoDB on first request — creates a local record with a random unusable password (so the schema doesn't break), copies name/email/role from Clerk.
5. Attaches `req.user = { userId, email, firstName, lastName, role, workspaceId }` — this is what all downstream services use.

Admin routes additionally pass through `isAdmin` after `protect`:
```js
app.get("/route", protect, isAdmin, handler)
```

---

## User Model (`database/models/user.js`)

```js
{
  userId:       String  // internal UUID (not Clerk's ID)
  email:        String  // unique
  firstName:    String
  middleName:   String
  lastName:     String
  DOB:          Date
  gender:       String
  profileImageUrl: String
  role:         String  // "user" | "admin"
  isVerified:   Boolean
  salt:         String  // bcrypt salt (kept for schema compat, not used for Clerk users)
  password:     String  // random hash (kept for schema compat, not used for Clerk users)
  notificationPrefs: {
    productUpdates: Boolean  // default true
    securityAlerts: Boolean  // default true
    marketing:      Boolean  // default false
    weeklyDigest:   Boolean  // default false
  }
}
```

---

## API Routes

All routes are prefixed `/api/v1/`.

### Auth (`api/auth.js`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/sync-user` | `protect` | Ensures current Clerk user exists in MongoDB. Called on first login. |
| GET | `/auth/admin/me` | `isAdmin` | Returns admin profile. |

### User (`api/user.js`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/user/fetch-users` | `protect + isAdmin` | Paginated user list with filters/sort. Body: `{ filters, page, limit, sort, excludeFields }` |
| GET | `/user/fetch-user-by-id/:userId` | `protect + isAdmin` | Single user by internal UUID. |
| PATCH | `/user/update-user` | `protect` | Update own profile fields: `firstName`, `middleName`, `lastName`, `DOB`, `gender`, `profileImageUrl`. |
| DELETE | `/user/delete-user` | `protect` | Delete own account. |
| GET | `/user/notification-prefs` | `protect` | Get notification preferences. |
| PATCH | `/user/notification-prefs` | `protect` | Update notification preferences. Body: `{ productUpdates, securityAlerts, marketing, weeklyDigest }` |

---

## Adding a New Feature

### 1. Add a route

Create or extend a file in `api/`. Keep handlers thin:
```js
app.post("/api/v1/thing/do-something", protect, async (req, res, next) => {
  try {
    const { status, ...rest } = await service.DoSomething(req.body);
    return res.status(status).json({ ...rest });
  } catch (err) { next(err); }
});
```

### 2. Add service logic

```js
// services/thing-service.js
async DoSomething(body) {
  const result = await this.repository.CreateThing(body);
  return { status: 201, data: result };
}
```

### 3. Add repository

All Mongoose queries go here. Never put `Model.find()` in services.

### 4. Wire it up

Import and call in `express-app.js`:
```js
import thing from "./api/thing.js";
// ...
thing(app);
```

---

## File Uploads (S3 Pipeline)

```js
import { upload } from "./utils/multer.js";       // multer memory storage
import { uploadFileToS3 } from "./utils/S3Config.js";

app.post("/upload", protect, upload.single("file"), async (req, res) => {
  const url = await uploadFileToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
  res.json({ url });
});
```

`getPresignedUrl(key)` — generates a time-limited read URL for private S3 objects.

---

## Stripe

```js
import stripe from "./utils/stripe.js";

// stripe is the initialized Stripe client
const session = await stripe.checkout.sessions.create({ ... });
```

---

## Error Handling

Throw from services/repositories:
```js
throw new APIError("Something broke", STATUS_CODES.INTERNAL_ERROR, err.message);
throw new ValidationError("Bad input");
throw new BadRequestError("Missing field");
```

The global `HandleErrors` middleware in `express-app.js` catches everything and formats the response. In `NODE_ENV=dev` it includes the stack trace; in production it sends only the message.

---

## Known Issues (fix before production)

- `backend/database/connection.js` line 6 has a hardcoded MongoDB URI — replace with `process.env.MONGODB_URI` and rotate the credentials.
- `express-mongo-sanitize` is installed but never wired up — `POST /user/fetch-users` passes raw `filters` to Mongoose (NoSQL injection risk). Wire it up in `express-app.js` or whitelist allowed filter keys.
- Body size limit is `10gb` globally — restrict to `1mb` globally and apply large limits only on upload routes.
- No rate limiting on any endpoint. Add `express-rate-limit` at minimum on auth routes.
- Production domain names are hardcoded in the CORS whitelist. Move them to `CLIENT_URLS` env var.
