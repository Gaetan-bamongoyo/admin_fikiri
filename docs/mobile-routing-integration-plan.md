# Implementation Plan — Python Routing Service → Flutter Mobile

> **Status:** Draft — awaiting validation  
> **Scope:** Replace direct GraphHopper routing calls with the Fikiri Python API (`POST /api/v1/routing/compute`)  
> **Out of scope:** Geocoding, address search, incident reporting (already on NestJS)

---

## 1. Context

### Current state

| Layer | File | Behavior |
|-------|------|----------|
| Service | `apps/mobile/lib/data/services/routing_service.dart` | Calls **GraphHopper Cloud directly** via a standalone `Dio` instance |
| Endpoints | `apps/mobile/lib/data/network/api_endpoints.dart` | NestJS base URL (`7540`); GraphHopper full URL for routing |
| Repository | `apps/mobile/lib/features/maps/repositories/map_repository.dart` | Delegates `getRoute()` to `RoutingService`; keeps GraphHopper geocode for search |
| State | `apps/mobile/lib/features/maps/cubit/map_cubit.dart` | `validerEtTracerItineraire()` → stores `List<LatLng>` in `MapState.routePoints` |
| UI | `apps/mobile/lib/features/maps/pages/map_page.dart` | Draws a blue `PolylineLayer`; no distance / ETA / alerts |

### Target state

```
MapCubit → MapRepository → RoutingService → Python API (:8000)
                                              POST /api/v1/routing/compute
                                              (incident-aware routing via GraphHopper custom_model)
```

NestJS (`7540`) remains unchanged for auth and incidents.  
GraphHopper geocoding in `MapRepository.getSearchSuggestions()` stays external (search only).

---

## 2. Goals

| # | Goal | Priority |
|---|------|----------|
| G1 | Route computation goes through the Python API | **Must** |
| G2 | Remove hardcoded GraphHopper API key from `routing_service.dart` | **Must** |
| G3 | Typed Dart models aligned with Python Pydantic schemas | **Must** |
| G4 | Configurable Python API base URL (emulator / physical device / prod) | **Must** |
| G5 | Surface route metadata (distance, duration, unavoidable incident flag) | **Should** |
| G6 | User-facing error messages for routing failures (502/503/504/404) | **Should** |
| G7 | Unit tests for models + `RoutingService` parsing | **Nice to have** |

---

## 3. API Contract Mapping

### Request — `POST /api/v1/routing/compute`

**Python schema:** `apps/api_python/schemas/routing.py → RouteRequest`

```json
{
  "start": [15.3100, -4.3200],
  "end": [15.3180, -4.3250]
}
```

> **Critical:** coordinates are `[longitude, latitude]`, not Flutter's `LatLng(lat, lng)`.

### Response — `RouteResponse`

```json
{
  "distance_metres": 2500.0,
  "temps_secondes": 300.0,
  "trajet_coordonnees": [[15.3100, -4.3200], [15.3180, -4.3250]],
  "instructions": ["Tournez à droite sur ..."],
  "alerte_incident_inevitable": false,
  "penalites_incidents_appliquees": true
}
```

### Coordinate conversion

| Source | Format | Example |
|--------|--------|---------|
| Flutter `LatLng` | `(latitude, longitude)` | `LatLng(-4.32, 15.31)` |
| Python API request | `[longitude, latitude]` | `[15.31, -4.32]` |
| Python API response polyline | `[longitude, latitude]` per point | → `LatLng(coord[1], coord[0])` |

### Auth

No JWT required for `/routing/compute` (unlike `POST /api/incidents` on Python).

---

## 4. Architecture Decisions

### 4.1 Dual base URL

The monorepo runs two backends:

| Service | Default dev URL (Android emulator) |
|---------|----------------------------------|
| NestJS | `http://10.0.2.2:7540/api/v1` |
| Python | `http://10.0.2.2:8000/api/v1` |

**Decision:** add `pythonBaseUrl` in `ApiEndpoints`, keep existing `baseUrl` for NestJS.

Physical device dev: replace `10.0.2.2` with the machine's LAN IP (e.g. `192.168.x.x`).

### 4.2 Extend `ApiClient` vs new client

**Decision:** extend `ApiClient.post()` with an optional `baseUrl` parameter (defaults to NestJS).

```dart
Future<Response> post(
  String endpoint, {
  Map<String, dynamic>? data,
  String? token,
  String? baseUrl,  // NEW — override for Python API
});
```

Also fix the existing bug where `Authorization: Bearer null` is always sent in `post()` even when `token` is null.

**Alternative rejected:** a separate `PythonApiClient` class — unnecessary duplication for a single endpoint today.

### 4.3 Return type change

**Decision:** `RoutingService.getRoute()` returns a `RouteResponse` model (not `List<LatLng>`).

Add a convenience getter on the model:

```dart
List<LatLng> get polylinePoints => ...
```

`MapRepository.getRoute()` propagates `RouteResponse` upward; `MapCubit` extracts polyline + metadata.

### 4.4 Configuration strategy

**Phase 1 (minimal):** constants in `ApiEndpoints` (same pattern as NestJS today).

**Phase 2 (recommended follow-up):** `--dart-define=PYTHON_API_URL=...` read via `String.fromEnvironment`.

This plan implements **Phase 1** only to keep the diff small.

---

## 5. Files to Create / Modify

### 5.1 New files

| File | Purpose |
|------|---------|
| `apps/mobile/lib/features/maps/models/route_request.dart` | `toJson()` with `[lng, lat]` conversion |
| `apps/mobile/lib/features/maps/models/route_response.dart` | `fromJson()`, `polylinePoints` getter |

### 5.2 Modified files

| File | Change |
|------|--------|
| `lib/data/network/api_endpoints.dart` | Add `pythonBaseUrl`, `routingCompute = '/routing/compute'`; remove unused `routing` GraphHopper URL |
| `lib/data/network/api_client.dart` | Optional `baseUrl` on `post()`; fix null token header |
| `lib/data/services/routing_service.dart` | Full rewrite: POST to Python API via `ApiClient` + `DioClient` |
| `lib/features/maps/repositories/map_repository.dart` | Return `RouteResponse`; update doc comment |
| `lib/features/maps/cubit/map_state.dart` | Add route metadata fields |
| `lib/features/maps/cubit/map_cubit.dart` | Store metadata; map API errors to French messages |
| `lib/features/maps/pages/map_page.dart` | Display distance/ETA banner; incident warning snackbar |

### 5.3 Unchanged (explicitly)

| File | Reason |
|------|--------|
| `map_repository.dart` → `getSearchSuggestions()` | Still uses GraphHopper geocode |
| `geocoding_service.dart` | Photon geocoding unchanged |
| `incident_repository.dart` | NestJS incidents unchanged |
| `main.dart` | No new cubit needed |

---

## 6. Implementation Phases

### Phase 1 — Network & models (foundation)

**Estimated effort:** ~1 h

1. Add `pythonBaseUrl` and `routingCompute` to `ApiEndpoints`.
2. Extend `ApiClient.post()` with optional `baseUrl`; fix Authorization header.
3. Create `RouteRequest` and `RouteResponse` models.
4. Rewrite `RoutingService.getRoute()`:
   - Build `RouteRequest` from two `LatLng` points.
   - `POST` to Python API (no token).
   - Parse `RouteResponse.fromJson()`.
   - Throw typed exceptions or return `Result` on failure (see §7).

**Acceptance criteria:**
- Manual curl-equivalent call works from emulator when Python API is running on `:8000`.
- No GraphHopper key in `routing_service.dart`.

---

### Phase 2 — State & repository wiring

**Estimated effort:** ~45 min

1. Update `MapRepository.getRoute()` return type → `RouteResponse`.
2. Extend `MapState` with:

```dart
final double? distanceMetres;
final double? tempsSecondes;
final List<String> instructions;
final bool alerteIncidentInevitable;
final bool penalitesIncidentsAppliquees;
```

3. Update `MapState.copyWith()` and `MapState.initial()`.
4. Update `MapCubit.validerEtTracerItineraire()`:
   - Set `routePoints` from `response.polylinePoints`.
   - Store metadata fields.
   - Clear route metadata in `effacerRecherche()`.

**Acceptance criteria:**
- Polyline still renders on the map after destination validation.
- State holds distance and duration after a successful route.

---

### Phase 3 — UI feedback

**Estimated effort:** ~1 h

1. **`map_page.dart`** — route summary chip/banner above the map (when `routePoints.isNotEmpty`):
   - Distance formatted: `"2.5 km"` (from `distanceMetres`).
   - Duration formatted: `"5 min"` (from `tempsSecondes`).
2. **Incident warning** — if `alerteIncidentInevitable == true`, show an orange `SnackBar`:
   - *"Votre itinéraire traverse une zone d'incident. Aucun contournement disponible."*
3. **Loading state** — existing `isLoadingRoute` spinner remains unchanged.

**Acceptance criteria:**
- User sees distance + ETA after route computation.
- Unavoidable incident flag triggers a visible warning.

**Optional (deferred):** turn-by-turn instructions bottom sheet — not in initial scope.

---

### Phase 4 — Error handling

**Estimated effort:** ~30 min

Map Python HTTP errors to user-facing French messages in `MapCubit`:

| HTTP code | User message |
|-----------|--------------|
| `404` | Aucun itinéraire trouvé entre ces deux points. |
| `502` | Le service de routage a rencontré une erreur. |
| `503` | Le service de routage est indisponible. Vérifiez votre connexion. |
| `504` | Le calcul de l'itinéraire a expiré. Réessayez. |
| Network / timeout | Impossible de joindre le serveur de routage. |
| Empty polyline | Aucun tracé disponible pour cet itinéraire. |

**Acceptance criteria:**
- Failed routing shows a `SnackBar` via existing `errorMessage` flow (already wired in `MapPage` listener).

---

### Phase 5 — Tests (optional)

**Estimated effort:** ~1 h

| Test | File |
|------|------|
| `RouteRequest.toJson()` coordinate order | `test/features/maps/models/route_request_test.dart` |
| `RouteResponse.fromJson()` + polyline conversion | `test/features/maps/models/route_response_test.dart` |
| `RoutingService` with mocked `ApiClient` | `test/data/services/routing_service_test.dart` |

---

## 7. Detailed Code Sketches

### `RouteRequest`

```dart
class RouteRequest {
  final LatLng start;
  final LatLng end;

  Map<String, dynamic> toJson() => {
    'start': [start.longitude, start.latitude],
    'end': [end.longitude, end.latitude],
  };
}
```

### `RouteResponse`

```dart
class RouteResponse {
  final double distanceMetres;
  final double tempsSecondes;
  final List<LatLng> polylinePoints;
  final List<String> instructions;
  final bool alerteIncidentInevitable;
  final bool penalitesIncidentsAppliquees;

  factory RouteResponse.fromJson(Map<String, dynamic> json) { ... }
}
```

### `RoutingService` (core call)

```dart
class RoutingService {
  final ApiClient _apiClient;

  RoutingService({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<RouteResponse> getRoute(LatLng start, LatLng end) async {
    final response = await _apiClient.post(
      ApiEndpoints.routingCompute,
      baseUrl: ApiEndpoints.pythonBaseUrl,
      data: RouteRequest(start: start, end: end).toJson(),
    );
    return RouteResponse.fromJson(response.data);
  }
}
```

---

## 8. Environment & Dev Setup

For local testing, three services must run:

```bash
# 1. PostgreSQL (shared)
pnpm docker:db

# 2. NestJS API (auth + incidents list) — optional for routing-only test
pnpm --filter @fikiri/api dev

# 3. Python API (routing)
cd apps/api_python && fastapi dev main.py   # → :8000
```

**Android emulator:** `http://10.0.2.2:8000/api/v1`  
**iOS simulator:** `http://localhost:8000/api/v1`  
**Physical device:** `http://<your-lan-ip>:8000/api/v1`

> **Open question:** should we add a platform-aware default in `ApiEndpoints` (Android vs iOS)?  
> Recommendation: keep `10.0.2.2` as default (current NestJS pattern) and document iOS override.

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Python API not running during dev | Empty route / error | Clear SnackBar message; document dev setup |
| Coordinate order mix-up | Route in wrong location | Unit test on `RouteRequest.toJson()`; code review checklist |
| GraphHopper free plan (no custom_model) | Route works but no incident avoidance | Surface `penalitesIncidentsAppliquees: false` in debug banner (optional) |
| Slow routing (>15 s) | Bad UX | Existing 30 s Dio timeout; loading spinner already present |
| Hardcoded `10.0.2.2` breaks iOS | Routing fails on iOS sim | Document or add platform check in follow-up |

---

## 10. Validation Checklist (manual QA)

- [ ] Start Python API on port 8000 with valid `GRAPHHOPPER_API_KEY` and `DATABASE_URL`
- [ ] Launch Flutter app on Android emulator
- [ ] Open map → search destination → validate route
- [ ] Blue polyline appears between current position and destination
- [ ] Distance and duration displayed
- [ ] Stop Python API → user sees a clear error message
- [ ] Route with active incident in DB → polyline avoids zone (visual check)
- [ ] If unavoidable incident → orange warning SnackBar appears
- [ ] Clear search → polyline and metadata removed

---

## 11. Open Questions for Validation

Please confirm or adjust before implementation:

| # | Question | Proposed default |
|---|----------|------------------|
| Q1 | Plan language for UI strings — keep French? | **Yes** (consistent with app) |
| Q2 | Show distance/ETA banner in Phase 3? | **Yes** |
| Q3 | Show turn-by-turn instructions now? | **No** — defer to later iteration |
| Q4 | Platform-aware `pythonBaseUrl` (Android vs iOS)? | **No** in Phase 1 — document manual change |
| Q5 | Add `--dart-define` config now or later? | **Later** (Phase 2 follow-up) |
| Q6 | Write unit tests in same PR? | **Optional** — Phase 5 |
| Q7 | Fallback to direct GraphHopper if Python API fails? | **No** — fail explicitly (simpler, avoids key in mobile) |

---

## 12. Estimated Total Effort

| Phase | Time |
|-------|------|
| Phase 1 — Network & models | ~1 h |
| Phase 2 — State wiring | ~45 min |
| Phase 3 — UI feedback | ~1 h |
| Phase 4 — Error handling | ~30 min |
| Phase 5 — Tests (optional) | ~1 h |
| **Total (without tests)** | **~3 h 15 min** |

---

## 13. Next Step

Once this plan is validated, implementation will proceed in order **Phase 1 → 4** in a single focused PR. Phase 5 (tests) can be added if requested.
