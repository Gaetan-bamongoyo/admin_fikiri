# FIKIRI Traffic API — Frontend Integration

This guide explains how to connect the monorepo frontend applications to the NestJS API (`@fikiri/api`):

| Application | Path | Stack | Dev port |
|-------------|------|-------|----------|
| **Admin** (web) | `apps/admin` | Next.js 16, React 19 | `7541` |
| **Mobile** | `apps/mobile` | Flutter | — |

The API runs by default at **http://localhost:7540**. All business routes are prefixed with **`/api/v1`**.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Configuration](#configuration)
3. [Authentication (JWT)](#authentication-jwt)
4. [Response and error format](#response-and-error-format)
5. [Pagination](#pagination)
6. [Endpoint reference](#endpoint-reference)
7. [Business rules for the UI](#business-rules-for-the-ui)
8. [Examples — Next.js (admin)](#examples--nextjs-admin)
9. [Examples — Flutter (mobile)](#examples--flutter-mobile)
10. [Swagger and manual testing](#swagger-and-manual-testing)

---

## Quick start

```bash
# From the monorepo root
pnpm install
cp apps/api/.env.example apps/api/.env   # adjust as needed
pnpm docker:db                            # PostgreSQL (if used)
pnpm --filter @fikiri/api dev             # API → :7540
pnpm --filter @fikiri/admin dev           # Admin → :7541
```

Verify the API is up:

```bash
curl -s http://localhost:7540/api/docs
```

Interactive OpenAPI documentation: **http://localhost:7540/api/docs**

---

## Configuration

### Base URL

| Environment | Base URL |
|-------------|----------|
| Local development | `http://localhost:7540/api/v1` |
| Production | TBD (e.g. `https://api.fikiri.example/api/v1`) |

Build the full URL as: `{BASE_URL}/{resource}`  
Example: `POST http://localhost:7540/api/v1/auth/login`

### Frontend environment variables

**Admin (`apps/admin`)** — create e.g. `apps/admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:7540/api/v1
```

The `NEXT_PUBLIC_` prefix is required to expose the variable to the browser in Next.js.

**Mobile (`apps/mobile`)** — use `--dart-define` or a config file (e.g. `lib/core/config/api_config.dart`):

```dart
// Example with dart-define at launch:
// flutter run --dart-define=API_BASE_URL=http://10.0.2.2:7540/api/v1
// (10.0.2.2 = host machine localhost from the Android emulator)
static const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:7540/api/v1',
);
```

### CORS

The API enables `enableCors()` without restrictions in development. In production, configure allowed origins on the API if needed.

### Common headers

| Header | Value | When |
|--------|-------|------|
| `Content-Type` | `application/json` | All requests with a JSON body |
| `Authorization` | `Bearer <accessToken>` | Protected routes (see below) |

---

## Authentication (JWT)

### Model

- All routes are **protected by default**, except those marked `@Public()` on the API.
- After `register` or `login`, store `accessToken` and send it on every authenticated request.
- Token lifetime: configurable via `JWT_EXPIRES_IN` (default **7 days**).

### Public routes (no token)

| Method | Route |
|--------|-------|
| `POST` | `/auth/register` |
| `POST` | `/auth/login` |
| `GET` | `/incidents` |
| `GET` | `/incidents/:id` |
| `GET` | `/traffic/reports` |
| `GET` | `/traffic/summary` |

All other routes listed in this document require a valid JWT.

### Register — `POST /auth/register`

**Body:**

```json
{
  "email": "driver@example.com",
  "password": "SecurePass123",
  "firstName": "Jean",
  "lastName": "Kabila",
  "phone": "+243900000000"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `email` | yes | Valid email |
| `password` | yes | 8–72 characters |
| `firstName`, `lastName`, `phone` | no | Strings (max 100 / 100 / 20) |

**Response `201`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "driver@example.com",
    "firstName": "Jean",
    "lastName": "Kabila",
    "phone": "+243900000000",
    "role": "user",
    "loyaltyPoints": 0,
    "createdAt": "2026-05-31T12:00:00.000Z",
    "preferences": {
      "homeLatitude": null,
      "homeLongitude": null,
      "workLatitude": null,
      "workLongitude": null,
      "notificationsEnabled": true,
      "anticipatoryAlertsEnabled": true
    }
  }
}
```

### Login — `POST /auth/login`

**Body:**

```json
{
  "email": "driver@example.com",
  "password": "SecurePass123"
}
```

**Response `200`:** same shape as register (`accessToken` + `user`).

**Error `401`:** message `"Email ou mot de passe incorrect"` (French, returned by the API).

### Token storage (recommendations)

| Platform | Recommended storage |
|----------|----------------------|
| Next.js (admin) | `httpOnly` cookie via Route Handler, or `sessionStorage` for an MVP |
| Flutter (mobile) | `flutter_secure_storage` |

Never expose the JWT in logs or URLs.

---

## Response and error format

### Success

- Direct JSON body (object or paginated list).
- Geographic coordinates are often returned as **strings** (`latitude`, `longitude` on incidents and reports); send them as **numbers** in requests.

### Errors

Uniform format (global filter):

```json
{
  "statusCode": 400,
  "message": "Error description or validation array",
  "timestamp": "2026-05-31T12:00:00.000Z"
}
```

**Validation (`400`)** — `message` may be an array:

```json
{
  "statusCode": 400,
  "message": [
    "latitude must be a latitude string or number",
    "password must be longer than or equal to 8 characters"
  ],
  "timestamp": "2026-05-31T12:00:00.000Z"
}
```

| Code | Typical meaning |
|------|-----------------|
| `400` | Invalid data / business rule violation |
| `401` | Not authenticated or invalid token |
| `404` | Resource not found |
| `409` | Conflict (e.g. already confirmed an incident) |

---

## Pagination

Lists use this format:

```json
{
  "data": [ /* items */ ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Common query params:**

| Param | Default | Range |
|-------|---------|-------|
| `page` | `1` | ≥ 1 |
| `limit` | `20` | 1–100 |

---

## Endpoint reference

Base: `{API_URL}` = `http://localhost:7540/api/v1`

### Users — authentication required

#### `GET /users/me`

Profile of the signed-in user. Response: `User` object (same as the `user` field in auth responses).

#### `PATCH /users/me/preferences`

Updates mobility preferences.

**Body (all fields optional):**

```json
{
  "homeLatitude": -4.3217,
  "homeLongitude": 15.3125,
  "workLatitude": -4.4419,
  "workLongitude": 15.2663,
  "notificationsEnabled": true,
  "anticipatoryAlertsEnabled": false
}
```

**Response `200`:** full user object with updated `preferences`.

---

### Incidents

#### `POST /incidents` — authentication required

Report an incident.

**Body:**

```json
{
  "type": "congestion",
  "latitude": -4.3217,
  "longitude": 15.3125,
  "description": "Heavy traffic on Commerce Avenue",
  "address": "Gombe, Kinshasa"
}
```

**Types (`type`):**

| Value | Description |
|-------|-------------|
| `congestion` | Traffic jam |
| `accident` | Accident |
| `roadwork` | Road work |
| `checkpoint` | Checkpoint / control |
| `danger` | Road hazard |
| `clear` | Clear traffic reported |

**Statuses (`status`) in responses:**

| Value | Description |
|-------|-------------|
| `active` | Ongoing |
| `resolved` | Resolved |
| `expired` | Expired |
| `disputed` | Disputed by the community |

**Response `201` — example:**

```json
{
  "id": "uuid",
  "type": "congestion",
  "status": "active",
  "latitude": "-4.3217",
  "longitude": "15.3125",
  "description": "Heavy traffic on Commerce Avenue",
  "address": "Gombe, Kinshasa",
  "reporterId": "uuid",
  "confirmationCount": 1,
  "expiresAt": "2026-05-31T16:00:00.000Z",
  "resolvedAt": null,
  "createdAt": "2026-05-31T12:00:00.000Z"
}
```

#### `GET /incidents` — public

Paginated list of incidents (map / navigation).

**Query params:**

| Param | Default | Description |
|-------|---------|-------------|
| `page`, `limit` | see pagination | |
| `type` | — | Filter by incident type |
| `status` | — | Filter by status |
| `latitude`, `longitude` | — | Search area center |
| `radiusKm` | `5` | Search radius (km) |

#### `GET /incidents/:id` — public

Incident details.

#### `POST /incidents/:id/confirm` — authentication required

Confirm or dispute an incident.

**Body:**

```json
{
  "isConfirm": true
}
```

- `true`: confirm  
- `false`: dispute  

**Possible errors:** `409` if the user already responded; `400` if the incident is no longer active.

#### `PATCH /incidents/:id/resolve` — authentication required

Mark an incident as resolved.

---

### Traffic

#### `POST /traffic/reports` — authentication required

Report traffic conditions at a point.

**Body:**

```json
{
  "latitude": -4.3217,
  "longitude": 15.3125,
  "condition": "heavy"
}
```

**Conditions (`condition`):**

| Value | Meaning |
|-------|---------|
| `fluid` | Free-flowing |
| `moderate` | Moderate |
| `heavy` | Heavy |
| `blocked` | Blocked |

#### `GET /traffic/reports` — public

Reports from the **last 2 hours**, optionally filtered geographically.

**Query params:** `page`, `limit`, `latitude`, `longitude`, `radiusKm` (default `3`).

#### `GET /traffic/summary` — public

Summary for map display (dominant condition around a point).

**Required query params:** `latitude`, `longitude`  
**Optional:** `radiusKm` (default `3`)

**Response `200`:**

```json
{
  "dominantCondition": "heavy",
  "reportCount": 12,
  "latitude": -4.3217,
  "longitude": 15.3125
}
```

If there are no recent reports: `dominantCondition` = `moderate`, `reportCount` = `0`.

---

### Gamification — authentication required

#### `GET /gamification/loyalty`

Points balance and recent history.

**Response `200`:**

```json
{
  "loyaltyPoints": 150,
  "recentTransactions": [
    {
      "id": "uuid",
      "points": 10,
      "reason": "incident_report",
      "referenceId": "uuid-incident",
      "createdAt": "2026-05-31T12:00:00.000Z"
    }
  ]
}
```

**Reasons (`reason`):**

| Value | Event |
|-------|-------|
| `incident_report` | Incident reported |
| `incident_confirm` | Incident confirmed |
| `traffic_report` | Traffic report |
| `daily_login` | Daily login |

---

### User roles

| Value | Usage |
|-------|-------|
| `user` | Driver / contributor |
| `admin` | Admin dashboard (future) |

The `role` field is included in the JWT and in `UserResponseDto`.

---

### Uploads

The `uploads` module exists on the API (Cloudinary) but **no HTTP routes are exposed yet**. Media is not required for current flows.

---

## Business rules for the UI

| Domain | Behavior |
|--------|----------|
| **Incidents** | Default TTL **4 h** (`expiresAt`); reporting counts as the first confirmation (`confirmationCount` starts at 1). |
| **Confirmations** | Community threshold: ≥ **3** confirmations reinforce reliability; ≤ **-2** sets status to `disputed`. |
| **Traffic** | Listed reports are younger than **2 h**; summary aggregates up to 100 reports within the radius. |
| **Coordinates** | Kinshasa: lat ~ **-4.3**, lng ~ **15.3** (examples in Swagger). |
| **Password** | Minimum **8** characters. |

---

## Examples — Next.js (admin)

### Minimal API client

Create e.g. `apps/admin/lib/api-client.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7540/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(
  path: string,
  { token, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}
```

### Login (Client Component or Server Action)

```typescript
type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string; loyaltyPoints: number };
};

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
```

### Map — public incidents

```typescript
type PaginatedIncidents = {
  data: Array<{ id: string; latitude: string; longitude: string; type: string }>;
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export async function fetchIncidentsNear(
  lat: number,
  lng: number,
  token?: string,
) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radiusKm: '5',
    limit: '50',
  });
  return apiFetch<PaginatedIncidents>(`/incidents?${params}`, { token });
}
```

### Server Components vs client

- **Public data** (map, incident list): calls without a token from server or client.
- **Private data** (`/users/me`, reports): pass the token from a cookie/session; avoid storing the JWT only in React memory if the user may reload the page.

---

## Examples — Flutter (mobile)

Recommended structure (see `apps/mobile/README.md`): `lib/core/network/`, `lib/features/*/data/`.

### Dio client

```dart
import 'package:dio/dio.dart';

class FikiriApiClient {
  FikiriApiClient({required String baseUrl, String? token})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
        ));

  final Dio _dio;

  void setToken(String? token) {
    if (token == null) {
      _dio.options.headers.remove('Authorization');
    } else {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> createIncident({
    required String type,
    required double latitude,
    required double longitude,
    String? description,
  }) async {
    final res = await _dio.post('/incidents', data: {
      'type': type,
      'latitude': latitude,
      'longitude': longitude,
      if (description != null) 'description': description,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }
}
```

### Dio error handling

```dart
try {
  await client.createIncident(/* ... */);
} on DioException catch (e) {
  final data = e.response?.data;
  if (data is Map && data['message'] != null) {
    // Show data['message'] to the user
  }
}
```

### Android emulator

Use `http://10.0.2.2:7540/api/v1` instead of `localhost` to reach the API on the development machine.

---

## Swagger and manual testing

| Resource | URL |
|----------|-----|
| Swagger UI | http://localhost:7540/api/docs |
| OpenAPI JSON schema | Generated by Swagger (Export button in the UI) |

**Manual test flow:**

```bash
# 1. Register
curl -s -X POST http://localhost:7540/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"SecurePass123"}' | jq .

# 2. Copy accessToken, then:
export TOKEN="eyJ..."

# 3. Profile
curl -s http://localhost:7540/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. Public incidents (no token)
curl -s "http://localhost:7540/api/v1/incidents?limit=5" | jq .
```

---

## Integration checklist

- [ ] `API_URL` / `NEXT_PUBLIC_API_URL` set per environment
- [ ] Register/login flow + `accessToken` persistence
- [ ] `Authorization: Bearer` header on protected routes
- [ ] Handle `400` / `401` / `409` errors with user-facing messages
- [ ] Parse `latitude` / `longitude` from `string` to `double` when reading
- [ ] Pagination on lists (`meta.totalPages`)
- [ ] Map: `GET /incidents` + `GET /traffic/summary` for the traffic layer
- [ ] Reports: `POST /incidents`, `POST /traffic/reports` (signed-in user)
- [ ] Loyalty: `GET /gamification/loyalty` after contributor actions

For API changes, the source of truth remains the code in `apps/api/src/modules/**` and the auto-generated Swagger documentation.
