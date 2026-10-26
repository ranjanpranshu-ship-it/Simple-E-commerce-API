# Simple E-Commerce API

A production-ready e-commerce REST API built with **NestJS**, featuring multi-strategy authentication, role-based access control, shopping cart, Razorpay payment integration, Docker deployment, and CI/CD via Jenkins.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 12 |
| Language | TypeScript (ESM) |
| Auth | JWT + Refresh Token Rotation, Google OAuth 2.0 |
| Database (Auth) | PostgreSQL (TypeORM) |
| Database (Products/Cart) | MongoDB (TypeORM) |
| Payment | Razorpay |
| Validation | class-validator + class-transformer |
| Rate Limiting | @nestjs/throttler |
| API Docs | Swagger / OpenAPI 3.0 |
| Testing | Vitest (unit + controller) |
| Containerization | Docker + Docker Compose |
| CI/CD | Jenkins Pipeline + GitLab Webhook |

## Features

- **Multi-strategy Authentication**
  - Local (email + password) with bcrypt hashing
  - Google OAuth 2.0 (login + account linking/unlinking)
  - JWT access tokens (15 min) + rotating refresh tokens (7 days)
  - Token version-based revocation (invalidates all sessions on password reset)

- **Role-Based Access Control**
  - `user` and `admin` roles
  - `@Roles()` decorator + `RolesGuard` (applied to admin-only endpoints)

- **Account Management**
  - Email verification (single-use token)
  - Password reset (single-use token, 7-day expiry)
  - Google account linking (one-shot intent token, 5-min expiry)

- **Product Management**
  - Full CRUD (MongoDB)
  - Admin-only create/update/delete

- **Shopping Cart**
  - Add, update, remove items
  - Per-user isolation (each user only sees and mutates their own cart)
  - Automatic price recalculation on quantity update
  - Stock validation against product price

- **Payment (Razorpay)**
  - Server-side order creation (prevents price manipulation)
  - HMAC-SHA256 signature verification
  - Idempotent payment verification (prevents double payment)
  - Automatic cart status update on success
  - Cart ownership checks on every operation

- **API Documentation**
  - Interactive Swagger UI at `/api/docs`
  - Bearer token auth integration
  - Request/response examples for every endpoint

- **Testing**
  - Unit tests for all services (auth, products, cart, payment, user)
  - Controller tests with mocked dependencies
  - 67 test cases covering happy paths, edge cases, and error scenarios
  - Runs in CI via Jenkins

- **Containerization**
  - Multi-stage Docker build (build → production)
  - Docker Compose for local dev (API + PostgreSQL + MongoDB)
  - Healthchecks on database services
  - Secrets managed via `.env` (never committed)

- **CI/CD Pipeline**
  - Jenkins declarative pipeline
  - GitLab webhook trigger (instant build on push)
  - Stages: Install → Lint → Test → Build
  - No secrets in pipeline (Jenkins credentials)

## Project Structure

```
simple-e-commerce-api/
├── .env.example
├── .env (gitignored)
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── docker-compose.jenkins.yml
├── Jenkinsfile
├── README.md
├── package.json
├── tsconfig.json
├── nest-cli.json
├── vitest.config.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   └── pipes/
│   │       └── parse-object-id.pipe.ts
│   ├── DB/
│   │   ├── postgres.ts
│   │   ├── product-orm.factory.ts
│   │   └── cart-orm.factory.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.spec.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   ├── forget-password.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   ├── entities/
│   │   │   ├── refresh-token.entity.ts
│   │   │   ├── password-reset.entity.ts
│   │   │   ├── email-verification.entity.ts
│   │   │   ├── oauth-identity.entity.ts
│   │   │   └── linking-intent.entity.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── local.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── local.strategy.ts
│   │   │   └── google.strategy.ts
│   │   └── decorators/
│   │       └── roles.decorator.ts
│   ├── users/
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── user.service.spec.ts
│   │   └── user.entity.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.controller.spec.ts
│   │   ├── products.service.ts
│   │   ├── products.service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   └── update-product.dto.ts
│   │   └── entities/
│   │       └── product.entity.ts
│   ├── shopping-cart/
│   │   ├── shopping-cart.module.ts
│   │   ├── shopping-cart.controller.ts
│   │   ├── shopping-cart.controller.spec.ts
│   │   ├── shopping-cart.service.ts
│   │   ├── shopping-cart.service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-shopping-cart.dto.ts
│   │   │   └── update-shopping-cart.dto.ts
│   │   └── entities/
│   │       └── shopping-cart.entity.ts
│   └── payment/
│       ├── payment.module.ts
│       ├── payment.controller.ts
│       ├── payment.controller.spec.ts
│       ├── payment.service.ts
│       └── payment.service.spec.ts
└── dist/
```

## API Endpoints

> Interactive docs: `http://localhost:3004/api/docs`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register (email + password) |
| POST | `/auth/login` | — | Login (local) |
| POST | `/auth/logout` | JWT | Logout (revoke refresh tokens) |
| POST | `/auth/refresh` | — | Rotate refresh token |
| GET | `/auth/me` | JWT | Get current user profile |
| GET | `/auth/google` | — | Initiate Google OAuth |
| GET | `/auth/google/callback` | — | Google OAuth callback |
| POST | `/auth/forget-password` | — | Request password reset email |
| POST | `/auth/reset-password` | — | Reset password with token |
| GET | `/auth/verify-email` | — | Verify email with token |
| POST | `/auth/link/google` | JWT | Get Google linking URL |
| GET | `/auth/link/google/callback` | — | Google linking callback |
| POST | `/auth/unlink/google` | JWT | Unlink Google account |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/products/create` | JWT (admin) | Create product |
| GET | `/products/listAll` | JWT | List all products |
| GET | `/products/findone/:id` | JWT | Get product by ID |
| PATCH | `/products/update/:id` | JWT (admin) | Update product |
| DELETE | `/products/remove/:id` | JWT (admin) | Delete product |

### Shopping Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/shopping-cart/create` | JWT | Add item to cart |
| GET | `/shopping-cart/listAll` | JWT | Get user's cart |
| GET | `/shopping-cart/findone/:id` | JWT | Get cart item by ID |
| PATCH | `/shopping-cart/update/:id` | JWT | Update quantity |
| DELETE | `/shopping-cart/remove/:id` | JWT | Remove item from cart |

### Payment

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payment/create-order` | JWT | Create Razorpay order |
| POST | `/payment/verify` | JWT | Verify payment signature |
| GET | `/payment/test` | JWT | Razorpay test page (dev only) |

## Setup

### Prerequisites

- Node.js 22+
- pnpm
- Docker + Docker Compose
- PostgreSQL 16
- MongoDB 7
- Razorpay account (test mode)
- Google OAuth 2.0 credentials

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd simple-e-commerce-api

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
# Edit .env with your secrets
```

### Run with Docker (recommended)

```bash
# Start API + PostgreSQL + MongoDB + Jenkins
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f api

# Stop everything
docker compose down

# Stop + remove volumes (nukes DB data)
docker compose down -v
```

### Run locally (without Docker)

```bash
# Start PostgreSQL and MongoDB separately, then:
pnpm run start:dev
```

### Production

```bash
pnpm run build
node dist/main.js
```

### Seed demo data

With PostgreSQL and MongoDB running (e.g. via Docker Compose):

```bash
pnpm run seed
```

Creates two demo accounts and five sample products:

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | admin |
| user@demo.com | user123 | user |

### Postman collection

Import `postman_collection.json` (at the repo root) into Postman. Set the `baseUrl` variable (defaults to `http://localhost:3004`). Login requests automatically capture `accessToken`/`refreshToken` into collection variables.


## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | API port | 3004 |
| NODE_ENV | Environment | development |
| POSTGRES_HOST | Postgres host | postgres (Docker) / localhost |
| POSTGRES_PORT | Postgres port | 5432 |
| POSTGRES_USER | Postgres user | postgres |
| POSTGRES_PASSWORD | Postgres password | — |
| POSTGRES_DATABASE | Postgres DB name | ecommerce_auth |
| MONGODB_HOST | Mongo host | mongo (Docker) / localhost |
| MONGODB_PORT | Mongo port | 27017 |
| MONGODB_PRODUCT | Products DB name | product |
| MONGODB_CART | Cart DB name | shopping-cart |
| JWT_SECRET | JWT signing secret | — |
| GOOGLE_CLIENT_ID | Google OAuth client ID | — |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | — |
| GOOGLE_CALLBACK_URL | Google OAuth redirect | http://localhost:3004/auth/google/callback |
| GOOGLE_LINKING_CALLBACK_URL | Google linking redirect | http://localhost:3004/auth/link/google/callback |
| API_KEY_ID | Razorpay key ID | rzp_test_... |
| SECRET_KEY | Razorpay key secret | — |
| FRONTEND_URL | Frontend base URL | http://localhost:5173 |
| API_BASE_URL | Base URL for the payment test page | http://localhost:3004 |

## Auth Flow

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL AUTH                                             │
│                                                         │
│  Client ──POST /auth/login──▶ Server                    │
│         ◀── { access_token, refresh_token } ──          │
│                                                         │
│  Client ──GET /auth/me (Bearer token)──▶ Server         │
│         ◀── { id, email, roles, verified } ──           │
│                                                         │
│  Client ──POST /auth/refresh──▶ Server                  │
│         ◀── { access_token, new_refresh_token } ──      │
│         (old refresh token is deleted)                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GOOGLE OAUTH                                           │
│                                                         │
│  Client ──GET /auth/google──▶ Redirect to Google        │
│  User authorizes ──▶ Google redirects to callback       │
│  Server verifies ID token, finds/creates user           │
│  Server redirects to Frontend with tokens               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GOOGLE LINKING                                         │
│                                                         │
│  Client ──POST /auth/link/google (Bearer)──▶ Server     │
│         ◀── { url } ── (one-shot linking intent)        │
│  Client opens URL ──▶ Google consent ──▶ callback       │
│  Server verifies intent + Google code                   │
│  Server creates OAuthIdentity row                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PAYMENT                                                │
│                                                         │
│  Client ──POST /payment/create-order──▶ Server          │
│         ◀── Razorpay Order (amount from cart) ──        │
│  Client opens Razorpay Checkout                         │
│  Client ──POST /payment/verify──▶ Server                │
│  Server verifies HMAC signature                         │
│  Server marks cart as "paid"                            │
└─────────────────────────────────────────────────────────┘
```

## Security

| Concern | Implementation |
|---------|----------------|
| JWT Revocation | tokenVersion in payload; incremented on password reset, invalidates all sessions |
| Refresh Token Rotation | Old token deleted on every refresh; stored as SHA-256 hash |
| Rate Limiting | ThrottlerGuard (global) + per-route `@Throttle()` overrides |
| Input Validation | class-validator with global ValidationPipe + whitelist |
| Payment Integrity | Server-side price calc, HMAC-SHA256 signature, idempotency check, cart ownership |
| OAuth Security | State parameter, one-shot linking intent (5-min), email_verified check |
| Secrets | `.env` gitignored; Docker `env_file`; Jenkins credentials for CI |
| Password Storage | bcrypt hashing; hashed password never returned in responses |

## Testing

```bash
# Run all tests
pnpm run test

# Watch mode
pnpm run test:watch

# With coverage
pnpm run test:cov
```

Coverage:

| Module | Tests | What's covered |
|--------|-------|----------------|
| Auth Service | 16 | Register, login, refresh rotation, logout, password reset, email verify, Google linking |
| Auth Controller | 10 | All endpoint delegation, request/response shapes |
| Products Service | 6 | CRUD, not-found, update |
| Products Controller | 5 | All endpoints |
| Shopping Cart Service | 7 | Create, update (price recalc), remove, not-found, per-user isolation |
| Shopping Cart Controller | 5 | All endpoints |
| Payment Service | 6 | Order creation, ownership, signature verify, already-paid, invalid sig |
| Payment Controller | 2 | Order + verify delegation |
| User Service | 6 | Create (hash), validate, hasPassword |

All external dependencies (JWT, Razorpay, Google OAuth, DB) are mocked — no network calls in tests.

## CI/CD

### Jenkins Pipeline

```
┌──────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│ Install  │───▶│  Lint  │───▶│  Test  │───▶│ Build  │
│ pnpm ci  │    │ oxlint │    │ vitest │    │ nest   │
└──────────┘    └────────┘    └────────┘    └────────┘
```

Trigger: GitLab webhook → instant build on every push to main.

Setup:

1. Create a GitLab Personal Access Token (scope: read_repository)
2. Add it as a Jenkins credential
3. Configure the Jenkins job with "Pipeline from SCM" pointing to your repo's Jenkinsfile
4. Add a GitLab webhook: http://your-jenkins/generic-webhook-trigger/invoke?token=<job-token>

Jenkins is now included in the default `docker-compose.yml` stack and starts automatically with the API and databases. It reuses the existing external `jenkins_home` volume, so create it once if it does not already exist:

```bash
docker volume create jenkins_home
docker compose up -d
```

The Jenkins UI is available at `http://localhost:8080` once the stack is up.

(For a standalone Jenkins instance, `docker-compose.jenkins.yml` is still provided as an optional override.)

## Docker

```
┌─────────────────────┐       ┌─────────────────────────┐
│  Build Stage        │       │  Production Stage        │
│  node:22-alpine     │       │  node:22-alpine          │
│  pnpm install       │──▶    │  pnpm install --prod     │
│  pnpm run build     │       │  COPY dist/              │
└─────────────────────┘       │  CMD node dist/main.js   │
                              └─────────────────────────┘
```

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| api | Built from Dockerfile | 3004 | NestJS application |
| postgres | postgres:16-alpine | 5432 (internal) | Auth data |
| mongo | mongo:7 | 27017 (internal) | Products + Cart |
| jenkins | Built from Dockerfile.jenkins | 8080, 50000 | CI/CD pipeline (Jenkins) |

Both databases have healthchecks — the API waits until they're ready before starting. Jenkins starts alongside the rest of the stack.

## Scripts

| Command | Description |
|---------|-------------|
| pnpm run start:dev | Start in watch mode |
| pnpm run build | Compile to dist/ |
| pnpm run start:prod | Run production build |
| pnpm run lint | Run oxlint (type-aware) |
| pnpm run test | Run all unit tests |
| pnpm run test:watch | Tests in watch mode |
| pnpm run test:cov | Tests with coverage report |
| pnpm run format | Prettier |
| pnpm run seed | Seed demo users + sample products |
