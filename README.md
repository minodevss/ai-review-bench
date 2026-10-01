# order-service

Small order API for the storefront. Express + Postgres.

```bash
npm install
DATABASE_URL=postgres://localhost/orders npm run dev
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/orders` | List the current user's orders |
| GET | `/orders/:id` | Get one order owned by the current user |
| POST | `/orders/:id/checkout` | Compute the total and mark the order as paid |

All endpoints require the `x-user-id` header (set by the API gateway).

## Conventions

- Money is stored as integer cents.
- Every query that reads an order must scope by `user_id`.
- Use parameterized queries only (`$1`, `$2`, ...).
