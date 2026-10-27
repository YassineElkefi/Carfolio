# Carfolio

Carfolio is a personal vehicle-management app for keeping a car's important
records in one place. Add vehicles to your garage, track mileage and fuel,
record maintenance and repairs, plan upcoming deadlines, and review ownership
costs over time.

The project is split into a React web frontend and a NestJS REST API backed by
PostgreSQL. Prisma manages the database schema and migrations.

## Features

- **Garage:** Add, view, edit, and remove vehicles, including make, model, year,
  license plate, and current mileage.
- **Mileage history:** Record odometer readings and optional notes.
- **Fuel tracking:** Keep dated fuel entries with odometer readings, liters,
  fuel type, notes, and total cost.
- **Maintenance records:** Track maintenance items, categories, dates, mileage,
  parts and labor costs, mechanic, and notes.
- **Repair recommendations:** Save mechanic-recommended parts and track whether
  each recommendation has been bought or installed.
- **Deadlines:** Manage vehicle-related reminders by date and/or mileage, mark
  them complete, and retain completion details.
- **Vehicle logs:** Record dated vehicle events with a type, optional mileage,
  amount, and notes.
- **Statistics:** Review mileage, fuel, and maintenance histories, ownership
  costs, and a six-month fuel and maintenance spending summary.

The interface includes separate, lazy-loaded pages for the garage, mileage,
fuel, maintenance, repair recommendations, logs, deadlines, and statistics.
Navigation, responsive styling, motion effects, and confirmation/toast
notifications are provided in the frontend.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| UI | Tailwind CSS, Framer Motion, Lucide icons, SweetAlert2 |
| Backend | NestJS 12, TypeScript, class-validator |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 with the PostgreSQL driver adapter |
| Tests | Jest and Supertest (backend); ESLint (frontend) |

## Project layout

```text
.
├── backend/
│   ├── prisma/             # Prisma schema and database migrations
│   ├── src/
│   │   ├── deadlines/      # Vehicle deadline API
│   │   ├── fuel/           # Fuel log API
│   │   ├── health/         # API/database health check
│   │   ├── maintenance/    # Maintenance and repair recommendations
│   │   ├── mileage/        # Mileage history API
│   │   ├── statistics/     # Vehicle summaries and spending
│   │   ├── vehicle-logs/   # Vehicle event log API
│   │   ├── vehicles/       # Garage / vehicle CRUD
│   │   └── prisma/         # Prisma client service and module
│   └── test/               # End-to-end tests
├── frontend/
│   └── src/
│       ├── components/     # Shared interface components
│       ├── lib/            # API client and feature-level API helpers
│       ├── pages/          # Vehicle feature pages
│       └── types/          # Frontend data types
└── docker-compose.yml      # Local PostgreSQL service
```

## Requirements

- Node.js and npm
- Docker with Docker Compose, or a separately managed PostgreSQL 17 database

The frontend and backend are independent npm projects, so install dependencies
in both directories. There is no root-level npm workspace.

## Run locally

### 1. Configure PostgreSQL

From the repository root, create a `.env` file for Docker Compose:

```dotenv
POSTGRES_PASSWORD=local_dev_password
```

This value is for local development only. Start the database from the
repository root:

```sh
docker compose up -d
```

Compose exposes PostgreSQL on `localhost:5432` and persists its data in the
`carfolio_postgres_data` Docker volume.

### 2. Configure and start the backend

Create `backend/.env` with a connection string that uses the same password as
the root `.env` file:

```dotenv
DATABASE_URL="postgresql://carfolio:local_dev_password@localhost:5432/carfolio?schema=public"
PORT=4000
```

Install dependencies and apply the Prisma migrations:

```sh
cd backend
npm install
npx prisma migrate dev
npx prisma generate
```

Start the API in watch mode:

```sh
npm run start:dev
```

The API listens on `http://localhost:4000` by default. The health endpoint,
`http://localhost:4000/health`, reports whether the API can reach PostgreSQL.

### 3. Configure and start the frontend

In another terminal, create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:4000
```

Then install dependencies and start the Vite development server:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend currently allows browser requests
from this development origin, so use `localhost` (rather than a different
hostname or port) unless you also update the backend CORS configuration.

## Configuration reference

| Variable | Used by | Purpose |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Docker Compose, repository root `.env` | Password assigned to the local PostgreSQL container |
| `DATABASE_URL` | Backend, `backend/.env` | PostgreSQL connection string used by Prisma |
| `PORT` | Backend, `backend/.env` | API listening port; defaults to `4000` |
| `VITE_API_URL` | Frontend, `frontend/.env` | Base URL used by the frontend API client |

Do not commit `.env` files or real credentials. Environment files are ignored
by Git; use local development values and configure secrets through your
deployment environment for any hosted setup.

## API overview

All routes are served from the backend origin (default `http://localhost:4000`).
Vehicle-specific routes use the vehicle UUID in the URL.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check API and database connectivity |
| `GET` | `/vehicles` | List vehicles |
| `POST` | `/vehicles` | Create a vehicle |
| `GET` | `/vehicles/:id` | Get a vehicle |
| `PATCH` | `/vehicles/:id` | Update a vehicle |
| `DELETE` | `/vehicles/:id` | Delete a vehicle |
| `GET`, `POST` | `/vehicles/:vehicleId/mileage` | List or add mileage records |
| `GET`, `POST` | `/vehicles/:vehicleId/fuel` | List or add fuel records |
| `GET`, `POST` | `/vehicles/:vehicleId/maintenance` | List or add maintenance records |
| `GET` | `/vehicles/:vehicleId/maintenance/:id` | Get a maintenance record |
| `PATCH`, `DELETE` | `/vehicles/:vehicleId/maintenance/:id` | Update or delete a maintenance record |
| `GET`, `POST` | `/vehicles/:vehicleId/repair-recommendations` | List or add repair recommendations |
| `PATCH`, `DELETE` | `/vehicles/:vehicleId/repair-recommendations/:id` | Update or delete a recommendation |
| `GET`, `POST` | `/vehicles/:vehicleId/deadlines` | List or add deadlines |
| `GET` | `/vehicles/:vehicleId/deadlines/:id` | Get a deadline |
| `PATCH`, `DELETE` | `/vehicles/:vehicleId/deadlines/:id` | Update or delete a deadline |
| `PATCH` | `/vehicles/:vehicleId/deadlines/:id/complete` | Mark a deadline complete |
| `GET`, `POST` | `/vehicles/:vehicleId/logs` | List or add vehicle log entries |
| `PATCH`, `DELETE` | `/vehicles/:vehicleId/logs/:id` | Update or delete a log entry |
| `GET` | `/vehicles/:vehicleId/statistics` | Get vehicle, mileage, fuel, maintenance, and cost summaries |

The API validates request bodies and rejects unknown properties. Resource
identifiers are validated as UUIDs. Costs are stored as integer millimes in
the database.

## Database

The Prisma schema is in `backend/prisma/schema.prisma`. Its main entities are
`Vehicle`, `MileageRecord`, `FuelLog`, `MaintenanceRecord`,
`RepairRecommendation`, `VehicleDeadline`, and `VehicleLog`. Vehicle records
own their related history; deleting a vehicle cascades to its related records.

For subsequent schema changes, update the Prisma schema and create a migration
from the `backend` directory:

```sh
npx prisma migrate dev --name describe_the_change
npx prisma generate
```

Prisma Client is generated into `backend/generated/prisma` according to the
schema generator configuration.

## Development commands

Run these commands from the indicated project directory.

### Frontend (`frontend/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create the production frontend build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Backend (`backend/`)

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start NestJS in watch mode |
| `npm run build` | Compile the backend |
| `npm run start:prod` | Run the compiled backend from `dist/` |
| `npm run lint` | Run Oxlint |
| `npm test` | Run backend unit tests |
| `npm run test:e2e` | Run backend end-to-end tests |
| `npm run test:cov` | Run backend tests with coverage |

The backend tests use Jest. End-to-end tests are configured separately in
`backend/test/`; database-backed test execution requires a reachable database
and appropriate test configuration.

## Important deployment note

This version does not implement user authentication or authorization. Do not
expose the API or stored vehicle data to untrusted networks without adding
appropriate access controls, production CORS configuration, and deployment
secrets management. The included Docker Compose file provides a local database,
not a complete production deployment.
