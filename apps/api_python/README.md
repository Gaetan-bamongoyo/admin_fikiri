# Fikiri Traffic — Python API

FastAPI microservice for **dynamic routing** and **traffic incident reporting**. It complements the main NestJS backend (`@fikiri/api`, port `7540`) by handling GraphHopper-based route computation with real-time incident penalties and direct incident creation in PostgreSQL.

> Part of the [Fikiri Traffic monorepo](../../README.md). This service is started manually and is not yet wired into Turborepo / `pnpm dev`.

---

## Table of Contents

- [Role in the Platform](#role-in-the-platform)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Endpoints](#endpoints)
- [Dynamic Routing](#dynamic-routing)
- [Authentication](#authentication)
- [Testing](#testing)
- [Development](#development)

---

## Role in the Platform

```text
Flutter Mobile ──► NestJS API (:7540)   auth, users, gamification, …
               └──► Python API (:8000)  dynamic routing, incident reports
                              │
                              ├── PostgreSQL (shared with NestJS)
                              └── GraphHopper Cloud (external routing engine)
```

| Service | Port | Responsibility |
|---------|------|----------------|
| `@fikiri/api` (NestJS) | `7540` | Core backend, JWT issuance, business logic |
| `api_python` (FastAPI) | `8000` | Route computation with incident avoidance, incident creation |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web framework | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| ORM | [SQLAlchemy](https://www.sqlalchemy.org/) 2.x |
| Validation | [Pydantic](https://docs.pydantic.dev/) v2 |
| Database | PostgreSQL + PostGIS (`GEOGRAPHY(Point, 4326)`) |
| Routing engine | [GraphHopper](https://www.graphhopper.com/) (REST API) |
| Auth | JWT (`python-jose`), shared secret with NestJS |

---

## Project Structure

```text
api_python/
├── main.py                  # App entry point, CORS, health check
├── requirements.txt         # Python dependencies
├── database/
│   ├── config.py            # SQLAlchemy engine & session
│   └── models.py            # ORM models (Incident, IncidentConfirmation)
├── routes/
│   ├── routing.py           # POST /api/v1/routing/compute
│   └── incidents.py         # POST /api/incidents
├── schemas/
│   ├── routing.py           # RouteRequest / RouteResponse DTOs
│   └── incident.py          # IncidentCreate / IncidentResponse DTOs
├── services/
│   ├── routing_service.py   # GraphHopper integration & penalty logic
│   ├── incidents.py         # Incident persistence
│   └── auth.py              # JWT validation (NestJS tokens)
└── tests/
    ├── conftest.py          # Test client with mocked DB
    └── test_routing.py      # Unit & HTTP tests for routing
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | Runtime |
| PostgreSQL + PostGIS | 16+ | Shared database with NestJS |
| GraphHopper API key | — | Route computation ([sign up](https://www.graphhopper.com/)) |
| NestJS API (optional) | — | Required to obtain a JWT when testing incident creation |

Start the shared database from the repo root:

```bash
pnpm docker:db
```

---

## Installation

```bash
cd apps/api_python

# Create and activate a virtual environment
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in `apps/api_python/` (see [Environment Variables](#environment-variables)).

---

## Environment Variables

Create `apps/api_python/.env` locally. `.env` files are git-ignored.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/fikiri_traffic` |
| `JWT_SECRET` | Prod | `change-me-in-production` | Must match NestJS `JWT_SECRET` |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `GRAPHHOPPER_API_KEY` | **Yes** | — | GraphHopper Cloud API key |
| `GRAPHHOPPER_URL` | No | `https://graphhopper.com/api/1/route` | GraphHopper route endpoint |
| `GRAPHHOPPER_TIMEOUT_SECONDS` | No | `15` | Request timeout (seconds) |
| `GRAPHHOPPER_CUSTOM_MODEL` | No | `true` | Apply incident penalty custom model |
| `CORS_ORIGINS` | No | `*` | Allowed origins (comma-separated) or `*` for Flutter dev |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Push | — | Chemin vers le JSON du compte de service Firebase |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Push | — | Alternative : JSON du compte de service en une ligne |
| `NOTIFICATIONS_TEST_ENABLED` | No | `false` | Active `POST /api/v1/notifications/test` |

Example `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fikiri_traffic

JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256

GRAPHHOPPER_API_KEY=your-graphhopper-api-key
GRAPHHOPPER_URL=https://graphhopper.com/api/1/route
GRAPHHOPPER_TIMEOUT_SECONDS=15
GRAPHHOPPER_CUSTOM_MODEL=true

CORS_ORIGINS=*
```

### Notifications (étape 2–4)

Appliquer la migration SQL `device_tokens` :

```bash
cd apps/api_python
python scripts/apply_migrations.py
```

Endpoints (JWT Bearer requis sauf health) :

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/notifications/device-token` | Enregistrer un token FCM |
| `DELETE` | `/api/v1/notifications/device-token` | Supprimer token(s) |
| `GET` | `/api/v1/notifications/device-token` | Lister ses tokens |
| `GET` | `/api/v1/notifications/preferences` | Lire les prefs notification |
| `POST` | `/api/v1/notifications/test` | Push de test (`NOTIFICATIONS_TEST_ENABLED=true`) |

---

## Running the Server

### Development (hot reload)

```bash
cd apps/api_python
fastapi dev main.py
```

Or with Uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Verify the service is up:

```bash
curl http://localhost:8000/
curl http://localhost:8000/api/health
```

---

## API Documentation

Once the server is running:

| Resource | URL |
|----------|-----|
| Swagger UI | [http://localhost:8000/docs](http://localhost:8000/docs) |
| ReDoc | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## Endpoints

### `GET /`

Health banner with a link to the docs.

```bash
curl http://localhost:8000/
```

### `GET /api/health`

Checks API and PostgreSQL connectivity.

```bash
curl http://localhost:8000/api/health
```

### `POST /api/v1/routing/compute`

Computes a dynamic route between two GPS points, applying penalties around active incidents.

**Auth:** none  
**Coordinates:** `[longitude, latitude]` (GeoJSON / GraphHopper convention)

**Request body:**

```json
{
  "start": [15.3100, -4.3200],
  "end": [15.3180, -4.3250]
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `distance_metres` | float | Total route distance |
| `temps_secondes` | float | Estimated travel time |
| `trajet_coordonnees` | `[[lon, lat], …]` | Route polyline |
| `instructions` | string[] | Turn-by-turn instructions (French locale) |
| `alerte_incident_inevitable` | bool | Route crosses a blocking incident despite penalties |
| `penalites_incidents_appliquees` | bool | GraphHopper custom model was applied |

**Example:**

```bash
curl -X POST http://localhost:8000/api/v1/routing/compute \
  -H "Content-Type: application/json" \
  -d '{"start": [15.3100, -4.3200], "end": [15.3180, -4.3250]}'
```

**HTTP errors:**

| Code | Cause |
|------|-------|
| `404` | No route found between the two points |
| `502` | GraphHopper returned an error |
| `503` | GraphHopper unreachable |
| `504` | GraphHopper request timed out |

### `POST /api/incidents`

Reports a new traffic incident. Requires a valid JWT issued by the NestJS API.

**Auth:** `Authorization: Bearer <token>`

**Incident types:** `congestion`, `accident`, `roadwork`, `checkpoint`, `danger`, `clear`

**Request body:**

```json
{
  "type": "congestion",
  "latitude": -4.3214,
  "longitude": 15.3045,
  "description": "Heavy traffic near the roundabout",
  "address": "Avenue de la Justice, Kinshasa"
}
```

**Behavior:**

- Incident is stored with status `active`
- Reporter receives an automatic confirmation (`confirmation_count = 1`)
- Default TTL: **4 hours** (`expires_at`)
- PostGIS `location` field is populated from coordinates

**Example:**

```bash
curl -X POST http://localhost:8000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "type": "checkpoint",
    "latitude": -4.3214,
    "longitude": 15.3045,
    "description": "Police checkpoint"
  }'
```

---

## Dynamic Routing

The routing pipeline works as follows:

```text
1. Fetch active incidents (today, not expired) from PostgreSQL
        ↓ (fallback: simulated Kinshasa incidents if DB unavailable)
2. Build a GraphHopper custom_model with penalty zones around each incident
        ↓
3. POST to GraphHopper (car profile, French instructions)
        ↓ (fallback: standard routing if free plan rejects custom_model)
4. Detect blocking incidents still on the returned path
        ↓
5. Return structured response to the mobile client
```

**Penalty weights by incident type:**

| Type | Cost multiplier | Buffer radius |
|------|-----------------|---------------|
| `checkpoint` | 0.02 (near-block) | 150 m |
| `danger` | 0.10 | 100 m |
| `accident` | 0.15 | 100 m |
| `congestion` | 0.30 | 100 m |
| `roadwork` | 0.50 | 80 m |
| `clear` | ignored | — |

Blocking types (`checkpoint`, `danger`, `accident`) trigger `alerte_incident_inevitable` when the final path still passes within the incident radius.

---

## Authentication

Incident creation validates JWT tokens issued by the NestJS API. Both services must share the same `JWT_SECRET`.

- **Header:** `Authorization: Bearer <token>`
- **Payload claim:** `sub` — user UUID
- **Errors:** `401 Unauthorized` for invalid, expired, or missing tokens

Obtain a token via the NestJS auth endpoints (`POST /api/v1/auth/login`) documented at [http://localhost:7540/api/docs](http://localhost:7540/api/docs).

---

## Testing

From `apps/api_python/`:

```bash
# Run all tests (DB is mocked — no PostgreSQL required)
pytest

# Verbose output
pytest -v

# Routing module only
pytest tests/test_routing.py -v
```

For a manual end-to-end check against GraphHopper (requires a real API key and network):

```bash
python test_routing_integration.py
```

---

## Development

### Code style

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints on function signatures
- Document non-obvious logic with docstrings

### Tooling (included in `requirements.txt`)

```bash
black .
flake8 .
mypy .
```

### Mobile integration

The Flutter app (`apps/mobile`) will consume this service for intelligent routing. The mobile `RoutingService` should target `http://localhost:8000/api/v1/routing/compute` (use `http://10.0.2.2:8000` from the Android emulator).

---

## Contributing

Follow the monorepo workflow described in the [root README](../../README.md): branch from `develop`, run tests before pushing, open a PR with a clear summary and test plan.

---

## License

Proprietary — Fikiri Traffic
