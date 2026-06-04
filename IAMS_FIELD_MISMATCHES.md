# IAMS Frontend ↔ Backend Key/Value Pair Mismatches

> Audited: 2026-06-04  
> Backend ref: `origin/main` @ `11e8b26`  
> Frontend: `IAMS-Project/src/app/`

All mismatches were identified by reading actual controller source and comparing against frontend type definitions and `api-client.ts`. Fixes were applied to the frontend only — the backend is treated as the source of truth.

---

## Mismatch 1 — User Role Values

**Files**: `src/app/lib/constants.ts`, `src/app/services/auth-service.ts`, `src/app/types/api.ts`, `src/app/types/grading.ts`

| Key | Frontend (before) | Backend (`users.role` column) |
|-----|-------------------|-------------------------------|
| Industry Supervisor role | `"supervisor"` | `"industry_supervisor"` |
| Academic Supervisor role | `"academic"` | `"academic_supervisor"` |

**Impact**: `getRoutePrefix()`, `getAllowedRoutes()`, `hasPermission()`, and every role-guard check failed for both supervisor roles — they defaulted to `/` (no access).

**Fix applied**:
- `ROLES.SUPERVISOR` → `"industry_supervisor"`
- `ROLES.ACADEMIC` → `"academic_supervisor"`
- `ROLE_LABELS` keys updated to match
- `ExtendedRole` type, `rolePermissions` object keys, all `switch` cases in `auth-service.ts` updated
- `AuthResponse.user.role` union updated: removed `"supervisor"` / `"academic"`, added `"industry_supervisor"` / `"academic_supervisor"`
- `GradingActor.role` union updated to match

---

## Mismatch 2 — AuthResponse Shape

**File**: `src/app/types/api.ts`

| Field | Frontend (before) | Backend actual |
|-------|-------------------|----------------|
| `token_type` | missing | returned as `"Bearer"` |
| `expiresAt` | expected | **not returned** |
| `user.avatar` | expected | `user.profile_photo` |
| `user.studentId` | expected flat | nested at `user.studentProfile.student_id` |
| `user.department` | expected string | `user.department_id` (integer FK) |

**Fix applied**: `AuthResponse` interface rewritten to match backend shape — added `token_type`, `profile_photo`, `studentProfile` nesting; removed `expiresAt`.

---

## Mismatch 3 — Term Create: Missing `code` Field (Previously Critical, Now Resolved by Backend)

**File**: `src/app/lib/api-client.ts`

The backend previously required `code` (not null). The updated remote `main` now accepts `code` as **nullable** and auto-generates it from the term name if absent.

**Fix applied**: `createTerm()` sends `code` only when provided; backend generates one automatically if omitted. No 422 errors occur regardless.

---

## Mismatch 4 — Term List Response: Direct Array vs. Wrapped Object

**File**: `src/app/lib/api-client.ts`

| | Key/path |
|-|----------|
| **Backend** `GET /terms` | `response.data` is a plain array `[term, term, ...]` (`$terms->items()`) |
| **Frontend** `extractCollection(..., "terms")` | looked for `data.terms` key |

**Fix applied**: `extractCollection` already handles plain arrays — it checks `Array.isArray(payload)` first and returns it directly. No change needed; confirmed working.

---

## Mismatch 5 — Term Single: No `term` Wrapper

**File**: `src/app/lib/api-client.ts`

| | Key/path |
|-|----------|
| **Backend** `GET /terms/{id}` | `response.data` is the term object directly (no `term` key) |
| **Frontend** `getTerm()` | checks for nested `data` key; falls back to raw payload |

**Fix applied**: None needed — the existing fallback logic in `getTerm()` handles this correctly.

---

## Mismatch 6 — Term Active: Dual Keys

**File**: `src/app/lib/api-client.ts`

Backend `GET /terms/active` returns both `data.terms` (array) and `data.term` (first active term). Frontend `getActiveTerm()` passes the raw response through unchanged — consumers must access `data.terms` or `data.term` as needed. No fix needed; behaviour is intentional.

---

## Mismatch 7 — Term Dashboard Response Shape

**Files**: `src/app/types/api.ts`, `src/app/lib/api-client.ts`

Backend `GET /terms/{id}/dashboard` returns a **flat object** inside `data`:

```json
{
  "total_applications": 150,
  "pending_applications": 20,
  "rejected_applications": 10,
  "active_internships": 95,
  "completed_internships": 15,
  "placement_rate": 13.64,
  "department_breakdown": [...]
}
```

| Field | Frontend (before) | Backend actual |
|-------|-------------------|----------------|
| `term` | expected nested object | **not returned** |
| `statistics` | expected nested object | **not returned** (all fields flat) |
| `approved_applications` | expected | **not returned** |
| `total_internships` | expected | **not returned** |
| `total_students` | expected | **not returned** |
| `completion_rate` | expected | backend uses `placement_rate` |
| `placement_rate` | missing | ✅ returned |
| `department_breakdown` | missing | ✅ returned |

**Fix applied**:
- `TermDashboardResponse` rewritten to flat shape with exact backend field names
- `getTermDashboard()` simplified to pass `response.data` directly (no unwrapping needed)

---

## Mismatch 8 — Logbook Collection Key

**File**: `src/app/lib/api-client.ts`

| | Key |
|-|-----|
| **Backend** `GET /logbooks` | `data.logbooks` |
| **Frontend** `getLogbookEntries()` | looked for `data.entries` ❌ |

**Fix applied**: `extractCollection` key changed back to `"logbooks"`.

> Note: A previous pass incorrectly changed this to `"entries"` based on stale backend code. The correct key `"logbooks"` is confirmed in the current `origin/main` source.

---

## Mismatch 9 — Logbook Status Value: `rejected` Missing

**File**: `src/app/types/api.ts`

Backend's `PATCH /logbooks/{id}/approve` with `action: "reject"` sets `status = "rejected"`.

| | Status values |
|-|---------------|
| **Backend** | `draft`, `submitted`, `approved`, `rejected` |
| **Frontend** (before) | `draft`, `submitted`, `approved`, `revision_requested` |

**Fix applied**: `"rejected"` added to `LogbookEntryResponse.status` union. `"revision_requested"` retained for backward compat.

---

## Mismatch 10 — Logbook Revision Endpoint

**File**: `src/app/lib/api-client.ts`

| | Endpoint | Effect |
|-|----------|--------|
| **Before** | `POST /logbooks/:id/comment` with `{ comment }` | only stores comment, **status unchanged** |
| **After (correct)** | `PATCH /logbooks/:id/approve` with `{ action: "reject", comment }` | sets status to `"rejected"` |

**Fix applied**: `requestLogbookRevision()` now calls the correct endpoint with `action: "reject"`.

---

## Mismatch 11 — Logbook Request: Missing `time_in` / `time_out`

**File**: `src/app/types/api.ts`

Backend `POST /logbooks` validates and stores `time_in` and `time_out` (format `H:i`). Frontend `SubmitLogbookRequest` had neither field.

**Fix applied**: `time_in?: string | null` and `time_out?: string | null` added to `SubmitLogbookRequest`.

---

## Mismatch 12 — Logbook Attachment Field Name

**File**: `src/app/types/api.ts`

| | Field |
|-|-------|
| **Backend** `LogbookEntry` model | `attachment_path` (single path string) |
| **Frontend** `LogbookEntryResponse` (before) | `attachment_name`, `attachment_url` (two fields) |

**Fix applied**: `attachment_path?: string` added to `LogbookEntryResponse`. Legacy fields retained for backwards compat.

---

## Mismatch 13 — Attendance Collection Key

**File**: `src/app/lib/api-client.ts`

| | Key |
|-|-----|
| **Backend** `GET /attendance` | `data.attendance` |
| **Frontend** `getAttendance()` | looked for `data.records` ❌ |

**Fix applied**: `extractCollection` key changed back to `"attendance"`.

> Note: A previous pass incorrectly changed this to `"records"` based on stale backend code. The correct key `"attendance"` is confirmed in the current `origin/main` source.

---

## Mismatch 14 — Attendance Date Field Name

**File**: `src/app/types/api.ts`

| | Field |
|-|-------|
| **Backend** `AttendanceRecord` model | `attendance_date` |
| **Frontend** `AttendanceResponse` (before) | `date` |

**Fix applied**: `AttendanceResponse.attendance_date` added as primary field; `date` retained as deprecated alias.

---

## Mismatch 15 — GradingConfiguration Collection Key

**File**: `src/app/lib/api-client.ts`

| | Key |
|-|-----|
| **Backend** `GET /grading-config` | `data.configurations` |
| **Frontend** `getGradingConfigs()` (before) | looked for `data.configs` ❌ |

**Fix applied**: `extractCollection` key changed from `"configs"` to `"configurations"`.

---

## Mismatch 16 — Application Status: `company_accepted` Missing

**File**: `src/app/types/api.ts`

Backend `PATCH /applications/{id}/accept` sets `status = "company_accepted"` (and simultaneously creates the `Internship` record).

| | Status values |
|-|---------------|
| **Backend** | `draft`, `submitted`, `under_review`, `approved`, `rejected`, **`company_accepted`** |
| **Frontend** (before) | `draft`, `submitted`, `under_review`, `approved`, `rejected` |

**Fix applied**: `"company_accepted"` added to `ApplicationResponse.status` union.

---

## Mismatch 17 — `submitCompanyAcceptance` Response: `internship` Key Ignored

**File**: `src/app/lib/api-client.ts`

Backend `accept()` returns `{ application: {...}, internship: {...} }`. Frontend `submitCompanyAcceptance()` is typed as `ApiResponse<ApplicationResponse | null>` — the `internship` object in the response is silently discarded.

**Impact**: Low — the newly created `Internship` record is not surfaced to callers. A subsequent call to `getInternships()` will fetch it. No data is lost.

**Fix applied**: Documented only. Full fix would require changing the return type and caller components.

---

## Mismatch 18 — Term `eligible_levels` and `departments` Fields

**Files**: `src/app/types/api.ts`, `src/app/lib/api-client.ts`

These were previously marked as a "feature gap". The updated backend `origin/main` now fully supports both:

- `AcademicTerm.$fillable` includes `eligible_levels` (cast as `array`)
- `TermController.store()` accepts `eligibleLevels` (camelCase alias) and `eligible_levels` (snake_case)
- `TermController.store()` syncs `departments` via `academic_term_department` pivot table

**Fix applied**:
- `CreateTermRequest.eligibleLevels` and `departments` restored as optional fields
- `createTerm()` in `api-client.ts` now sends `eligible_levels` and `departments` when provided

---

## Mismatch 19 — CriterionKey Type: Abstract Notation vs. Backend Field Names

**File**: `src/app/types/grading.ts`

`IndustrialCriterion.key` was typed as `CriterionKey = "A1" | "A2" | ... | "D3"` (abstract notation) while `INDUSTRIAL_CRITERIA` in `constants.ts` used actual backend field names (`"tech_understanding_concepts"`, etc.).

This caused a silent TypeScript type mismatch — the type did not enforce correct keys.

**Fix applied**: `CriterionKey` rewritten to a union of the 18 actual backend field names that map 1:1 to `IndustrialAssessment` model columns.

---

## Mismatch 20 — Settings API Structure

**Files**: `src/app/types/api.ts`, `src/app/lib/api-client.ts`

| | Pattern |
|-|---------|
| **Backend** | `GET /settings` → `{ settings: [...], values: {key: val} }`; `PUT /settings/{key}` → `{ value: string }` one at a time |
| **Frontend** | `getSettings()` treats response as flat object; `updateSettings()` sends entire object to `PUT /settings` (wrong URL) |

**Status**: Documented only. Full fix requires `updateSettings()` to iterate the settings object and make individual `PUT /settings/{key}` calls.

---

## Summary

| # | Area | Root Cause | Fix |
|---|------|-----------|-----|
| 1 | User role values | Abbreviated short names in frontend | Updated to full backend values |
| 2 | AuthResponse shape | Missing/renamed fields | Interface rewritten to match backend |
| 3 | Term `code` field | Previously required, now nullable | Backend auto-generates; frontend sends only if provided |
| 4 | Term list response | Plain array vs. wrapped key | `extractCollection` handles arrays natively — no change |
| 5 | Term single response | No `term` wrapper key | Fallback logic already handled it — no change |
| 6 | Term active response | Dual `terms`/`term` keys | Intentional dual return — documented |
| 7 | Term dashboard shape | Wrong nested structure assumed | Type and extraction corrected to flat shape |
| 8 | Logbook collection key | Wrong key `"entries"` used | Reverted to correct key `"logbooks"` |
| 9 | Logbook `rejected` status | Missing from union type | Added `"rejected"` |
| 10 | Logbook revision endpoint | Wrong endpoint called | Switched to `approve` with `action:"reject"` |
| 11 | Logbook `time_in`/`time_out` | Missing from request type | Added to `SubmitLogbookRequest` |
| 12 | Logbook `attachment_path` | Wrong field names | Added `attachment_path` to response type |
| 13 | Attendance collection key | Wrong key `"records"` used | Reverted to correct key `"attendance"` |
| 14 | Attendance date field | `date` vs `attendance_date` | Primary field updated to `attendance_date` |
| 15 | GradingConfig collection key | Wrong key `"configs"` used | Fixed to `"configurations"` |
| 16 | Application `company_accepted` | New status not in union | Added to `ApplicationResponse.status` |
| 17 | Accept response `internship` key | Silently discarded | Documented; low impact |
| 18 | Term `eligible_levels`/`departments` | Incorrectly removed | Restored; backend now supports both |
| 19 | CriterionKey abstract notation | Type mismatched constants | Rewritten to use real backend field names |
| 20 | Settings API structure | Frontend sends bulk; backend is per-key | Documented; full fix deferred |
