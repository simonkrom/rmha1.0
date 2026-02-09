# GitHub Copilot Instructions for LABORATOIRE

## Project Overview
LABORATOIRE is a medical concierge application with a **Node.js backend + PostgreSQL** + **static HTML/CSS/JS frontend**. It handles patient registration, appointment management, and real-time communication via Socket.IO.

**Key Architecture:**
- Backend (Node.js/Express) serves both API (`/api/*`) and static frontend files
- Frontend is vanilla HTML/JS deployed to the same origin (no separate build step)
- Authentication uses JWT (8h expiry) with bcrypt password hashing (SALT_ROUNDS=12)
- Role-based access control: `admin`, `manager`, `pharmacien`, `coursier`, `user`
- Immutable audit logging with DB triggers preventing modifications
- Socket.IO for real-time notifications (newRegistration, activity broadcasts)

## Core Technology Stack
- **Backend:** Node.js, Express, PostgreSQL, bcrypt, JWT, Socket.IO
- **Frontend:** Vanilla HTML/CSS/JS (no framework)
- **Database:** PostgreSQL with immutable audit table (triggers enforce read-only)
- **Deployment:** Docker containers, Render (backend web service + frontend static site)
- **Testing:** Jest + Supertest

## Critical Workflows

### 1. Local Development
```powershell
cd server
npm install
npm run migrate  # Apply schema from migrations/create_tables.sql
npm start        # Runs on http://localhost:4000
```
Visit `http://localhost:4000/index.html` to access full app locally.

### 2. Testing
```powershell
# Local (requires Node.js)
cd server && npm test

# Docker (no local Node needed)
docker run --rm -v "C:\path\to\server":/usr/src/app -w /usr/src/app node:20-alpine sh -lc "npm ci && npm test"
```

### 3. Database Migrations
- Migrations live in `server/migrations/create_tables.sql`
- Run via `npm run migrate` (triggered on app startup if needed)
- Core tables: `users` (auth), `audit` (immutable), `patients` (registrations)

### 4. Deployment
- Backend: Render Web Service with build command `cd server && npm install`
- Frontend: Render Static Site (root directory, no build needed)
- Update CORS in `server/src/index.js` for production domains
- Required env vars: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Key Architectural Patterns

### Authentication & Authorization
- **File:** [server/src/services/auth.js](server/src/services/auth.js)
- Register user with bcrypt hash, login returns JWT token (8h expiry)
- **Middleware:** [server/src/middleware/permissions.js](server/src/middleware/permissions.js)
  - `requireAuth`: Extracts JWT from Authorization header, sets `req.user`
  - `requireRole(...roles)`: Checks if user role is in allowed list
- Example: `app.get('/api/admin/users', requireAuth(auth), requireRole('admin'), ...)`

### Immutable Audit Log
- Inserts logged to `audit` table via `audit.log({ action, resource, meta })`
- Database triggers (`audit_no_update`, `audit_no_delete`) prevent any modifications
- Called when important actions occur (registrations, admin updates)
- **File:** [server/src/services/audit.js](server/src/services/audit.js)

### Socket.IO Real-Time Broadcasting
- Rooms by role: `socket.join(role)` (e.g., 'admin', 'manager', 'coursier')
- Events: `newRegistration` → broadcasts to 'admin' and 'manager' rooms
- Always wrap in try-catch and log errors; don't fail the response if socket fails
- **File:** [server/src/index.js](server/src/index.js) (lines 53-82)

### Database Pool Connection
- Uses PostgreSQL pool from [server/src/db.js](server/src/db.js)
- Query pattern: `pool.query(sql, [params])` returns `{ rows: [...] }`
- Connection string from env var `DATABASE_URL` or default `postgres://lab_user:lab_pass@localhost:5432/laboratoire`

### Frontend Configuration
- Dynamic API endpoint detection in [assets/js/config.js](assets/js/config.js)
- Localhost → `http://localhost:4000/api`, Production → `https://laboratoire-backend.onrender.com/api`
- All frontend files served from root or `/assets/` path (set up in Express static handlers)

## Common Patterns to Follow

1. **Error Handling in Routes:** Always wrap async operations in try-catch, return JSON errors with appropriate HTTP status
2. **Audit Logging:** Call `audit.log()` for registrations, admin actions, and permission changes
3. **Role-Based Routes:** Chain `requireAuth(auth)` then `requireRole('role')` middleware
4. **Socket Events:** Keep payloads minimal; emit only after database insert succeeds
5. **Passwords:** Never log, never send in responses; always use bcrypt for hashing
6. **JWT Secret:** Must be strong; change before production (currently in env var)

## Testing Patterns
- Tests use Jest + Supertest against the Express app
- Test files: [server/test/patients.test.js](server/test/patients.test.js), [server/test/health.test.js](server/test/health.test.js)
- Mock database: Use real pool connection in test setup
- Example: `request(app).post('/api/register').send({ username, password })`

## File Structure Quick Reference
```
server/
  src/
    index.js          → Express app setup, routes mounting
    db.js             → PostgreSQL pool initialization
    auth.js           → Auth service (register, login, verify)
    audit.js          → Audit logging to DB
    middleware/
      permissions.js  → requireAuth, requireRole middleware
    services/
      auth.js, audit.js
    routes/
      auth.js, admin.js, patients.js
  migrations/
    create_tables.sql → Schema for users, audit, patients tables
  package.json        → Dependencies & scripts
  
pages/
  index.html, coursier.html, admin.html, etc.  → Frontend
assets/
  js/config.js        → API & Socket.IO URL configuration
  css/, images/
```

## Deployment Notes
- **Render Backend URL:** `https://laboratoire-backend.onrender.com`
- **Render Frontend URL:** `https://laboratoire-frontend.onrender.com`
- Both must whitelist each other in CORS
- Secrets (JWT_SECRET, Supabase keys) stored in Render environment (never in code)
- Production checklist in [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
