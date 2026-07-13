# Trekking Management Application V2

TMA V2 is a decoupled client-server trekking management platform.

## Structure

- `backend/` - FastAPI async API, SQLAlchemy async ORM, Alembic, PostgreSQL, Redis, APScheduler.
- `frontend/` - Vite React SPA, React Router, Redux Toolkit auth state, Tailwind CSS, Chart.js.

## Backend highlights

- JWT auth with Argon2id password hashing.
- RBAC dependencies for Admin, Staff, and User workflows.
- PostgreSQL models for users, staff profiles, treks, and bookings.
- Redis caching for `GET /api/v1/treks/` using `cache:treks:difficulty:location:page` keys and 300 second TTL.
- Row-level locks with `SELECT FOR UPDATE` for booking creation and cancellation slot restoration.
- FastAPI `BackgroundTasks` for booking export.
- APScheduler daily trek reminders and monthly admin activity reports.

## Frontend highlights

- Protected routes based on JWT user role.
- Debounced trek search by difficulty, location, and duration.
- Booking modal with live cost calculation and simulated payment.
- Admin dashboard with Chart.js metrics.
- Staff portal for assigned treks and slot availability updates.
