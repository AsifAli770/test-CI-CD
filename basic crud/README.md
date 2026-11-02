# Dairy Manager – Backend

Express + MongoDB API. Customers and suppliers each have a name, mobile number and milk rate (₹/kg).
Their ledger holds milk entries (quantity × rate) and payments.

```
npm install
npm run dev
```

`.env`:

```
PORT=3001
MONGODB_URI=...
DB_NAME=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
JWT_SECRET=long-random-string        # e.g. node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_EXPIRES_IN=7d                    # optional
CORS_ORIGIN=                         # optional
```

## Auth

`POST /api/auth/login { username, password }` returns `{ token, user }`. Every other `/api` route needs
`Authorization: Bearer <token>`. `GET /api/auth/me` returns the logged-in user.

## API

`GET /api/dashboard` returns `{ customers, suppliers }` (active counts, archived not included).

Same routes under `/api/customers` and `/api/suppliers`:

| Method | Path | Body / query |
|---|---|---|
| GET | `/` | active list with current balance |
| POST | `/` | `{ name, mobile, rate }` |
| PATCH | `/:id` | `{ name, mobile, rate }` |
| DELETE | `/:id` | moves to the archive; MongoDB deletes it and its entries 30 days later (TTL index) |
| GET | `/archive` | archived list with `purgeAt` and `daysLeft` |
| POST | `/:id/restore` | bring back from the archive |
| DELETE | `/:id/permanent` | delete an archived person and their entries now |
| GET | `/:id/ledger` | `?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| POST | `/:id/entries` | `{ kind: "milk", date, quantity, rate? }` or `{ kind: "payment", date, amount, method: "cash" \| "online" }` |
| DELETE | `/:id/entries/:entryId` | |

Bulk orders under `/api/orders`: `GET /?status=open|done`, `POST /`, `PATCH /:id` with
`{ name, mobile, date, items: [{ name, quantity, rate }], paid (advance), note }`. Items without a quantity are dropped and amounts are calculated on the server.
Later payments: `POST /:id/payments { date, amount, method }`, `DELETE /:id/payments/:paymentId`; `totalPaid` = advance + payments.
`POST /:id/done` moves an order to Bulk Done, `POST /:id/reopen` moves it back, and `DELETE /:id` (done orders only) deletes it permanently.

Credit sales (items on credit, paid later) under `/api/credit`: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` with
`{ name, mobile, date, items: [{ name, quantity, rate }], note }`, plus `POST /:id/payments { date, amount, method }`
and `DELETE /:id/payments/:paymentId`. Each record returns `total`, `paid` and its `payments`.
