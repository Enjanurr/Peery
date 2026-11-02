# Peery — Peer Evaluation & Team Assessment Platform

Peery automates confidential peer ratings, score summaries, and instructor grade overrides for university team projects.

- **CSIT321**: Spring Boot backend
- **CSIT340**: React frontend

---

## 1. Tech Stack

| Layer | Tech |
|---|---|
| Backend | Java 17/21, Spring Boot 3, Maven, Spring Security 6 (stateless JWT), Spring Data JPA (Hibernate), Jakarta Validation |
| Frontend | React 18 (Vite), React Router v6, Tailwind CSS (dark slate: `bg-slate-900` base, `bg-slate-800` cards), Axios, Recharts |
| DB | MySQL or PostgreSQL (pick one; H2 for tests only) |

## 2. Core Rules (Non-Negotiable)

1. **Strict student anonymity.** Student-facing endpoints use `StudentResultSummaryDTO`. Raw evaluator IDs/names never leave the backend for students. Only instructors see full rater attribution.
2. **Unique pairing.** One evaluation per `(projectId, evaluatorId, evaluateeId)`, enforced in the DB and the service layer.
3. **Deadline lock.** No create or edit after `evalEndDate`. No create before `evalStartDate`.
4. **Instructor overrides** require a mandatory non-blank reason string.
5. **Identity comes from the JWT**, never from the request body.

---

## 3. Current Feature: Phase 3 — Submit Peer Evaluations

### 3.1 Scope

**In (MVP)**
- Student sees the teammates they still need to evaluate for a project
- Student submits one evaluation per teammate (ratings per criterion + optional comment)
- Student edits their own evaluation until `evalEndDate`
- Student lists evaluations they have *given*
- Validation: rating range, duplicates, self-evaluation, team membership, deadline window

**Out (later phases)**
- Aggregation and `StudentResultSummaryDTO` results (Phase 4)
- Instructor attribution view and grade overrides (Phase 5)
- Email reminders, draft autosave, CSV export

### 3.2 Assumptions (change before coding if wrong)

- A project has a fixed team via `ProjectMember` (student ↔ project).
- Criteria are defined per project (seeded with defaults), each scored 1–5 integer.
- An evaluation is "submitted" immediately (no draft state) and stays editable until the deadline.
- Server time in UTC (`Instant`) is the only clock used for deadline checks.

---

### 3.3 Board Alignment — Epic 3: Confidential Peer Evaluation Engine

This phase maps to the third column of the project board. Each feature below lists its backend and frontend tasks (same order as the board) and where it lives in this document.

#### Feature 3.1 — Pending Evaluation Tracker & Teammate Selector

| Layer | Task | Spec |
|---|---|---|
| React | Pending Evaluations Queue & Teammate Cards UI | §8.1 `EvaluationDashboardPage`, `TeammateCard` |
| Spring | Pending Evaluations Query API (`GET /evaluations/pending`) | §7.3 |
| Spring | Teammate Completion Status Badge & Progress Logic | `PendingEvaluationDTO.status` + a `completedCount / totalCount` progress field on the response |
| Test | Pending Task Retrieval & **Nov 5 Milestone Verification (50%)** | §10 + milestone checklist below |

Notes:
- The queue excludes the caller and returns only teammates from the same project.
- Progress = `SUBMITTED teammates / total teammates`, calculated server-side so the UI never trusts its own count.

#### Feature 3.2 — Rubric Rating & Qualitative Feedback Submission

| Layer | Task | Spec |
|---|---|---|
| React | Interactive Rubric Rating Form & Comment Form UI | §8.1 `EvaluationForm`, `RatingInput` |
| Spring | Evaluation Submission API (`POST /api/evaluations`) | §7.4 |
| Spring | Enforce Mandatory Fields, Valid Score Ranges & Unique Pairings | §6.1 steps 5–8, `EvaluationValidator`, DB unique constraint |
| Test | Evaluation Submission Validation & Duplicate Prevention | §10 |

Notes:
- The rubric (criteria and min/max scale) comes from Epic 2's rubric builder. This phase only *reads* it via `GET /api/projects/{projectId}/criteria`.
- "Mandatory fields" = every criterion scored exactly once and `evaluateeId` + `projectId` present. The comment is optional unless the instructor's rubric config later requires it (open question #6).

#### Feature 3.3 — Pre-Deadline Editing & Anonymity Protection

| Layer | Task | Spec |
|---|---|---|
| React | Editable Submission View & Cutoff Lock States | §8.3 `DeadlineBanner`, form disabled when `CLOSED` |
| Spring | Pre-Deadline Edit API (`PUT /api/evaluations/{id}`) | §7.5 |
| Spring | Student-Facing DTO Anonymizer (hide rater identity) | §5 note + anonymity rules below |
| Test | Verify Evaluator Anonymity in Student API Responses & Payloads | §10 anonymity cases |

Anonymity rules for this phase:
- Student endpoints only return evaluations the caller *authored*. No endpoint exposes evaluations a student *received*.
- Anything aggregate (Phase 4) goes through `StudentResultSummaryDTO`, which carries no evaluator IDs, names, or per-rater comments.
- Add an automated test that serializes every student-facing response and asserts no field named `evaluatorId` / `evaluatorName` exists, and that other users' evaluations return 404.

#### Milestone checklist (Nov 5, 50% target)

- [ ] `GET /evaluations/pending` returns correct statuses and progress for a seeded team
- [ ] `POST /api/evaluations` works end to end with duplicate, range, and deadline validation
- [ ] `PUT /api/evaluations/{id}` works before the deadline and is locked after
- [ ] Pending queue, rating form, and edit view are wired to the live API
- [ ] Anonymity test passes (no evaluator identity in any student response)

---

## 4. Data Model

### 4.1 Entities (`model/`)

**User** *(existing)*: `id`, `name`, `email`, `passwordHash`, `role` (`STUDENT` | `INSTRUCTOR`)

**Project** *(existing, extend)*: `id`, `title`, `instructor` (FK User), `evalStartDate` (Instant), `evalEndDate` (Instant)

**ProjectMember** *(new or confirm exists)*: `id`, `project` (FK), `student` (FK User)
- Unique: `(project_id, student_id)`

**Criterion** *(new)*: `id`, `project` (FK), `name`, `description`, `minScore` (default 1), `maxScore` (default 5), `displayOrder`
- Unique: `(project_id, name)`

**Evaluation** *(new)*

| Column | Type | Notes |
|---|---|---|
| id | Long PK | |
| project_id | FK | not null |
| evaluator_id | FK User | not null, set from JWT |
| evaluatee_id | FK User | not null |
| comment | varchar(1000) | nullable, trimmed |
| submitted_at | Instant | set on create |
| updated_at | Instant | set on edit |
| version | Long | `@Version` optimistic locking |

- **Unique constraint:** `(project_id, evaluator_id, evaluatee_id)`
- **Check constraint:** `evaluator_id <> evaluatee_id`
- **Index:** `(project_id, evaluator_id)` for "my evaluations" queries; `(project_id, evaluatee_id)` for Phase 4 aggregation

**EvaluationScore** *(new, child of Evaluation)*

| Column | Type | Notes |
|---|---|---|
| id | Long PK | |
| evaluation_id | FK | cascade delete |
| criterion_id | FK | not null |
| score | int | validated against criterion min/max |

- **Unique:** `(evaluation_id, criterion_id)`

### 4.2 Schema management

Use **Flyway** migrations rather than `ddl-auto=update` so unique/check constraints are explicit and versioned.

---

## 5. DTOs (`dto/`)

**Requests**

`CreateEvaluationRequest`
- `projectId` — `@NotNull`
- `evaluateeId` — `@NotNull`
- `scores` — `@NotEmpty` list of `ScoreInput`
- `comment` — `@Size(max = 1000)`, optional

`UpdateEvaluationRequest`
- `scores` — `@NotEmpty` list of `ScoreInput`
- `comment` — `@Size(max = 1000)`, optional
- `version` — `@NotNull` (optimistic lock token from the last read)

`ScoreInput`
- `criterionId` — `@NotNull`
- `score` — `@NotNull`, `@Min(1)`, `@Max(5)` (the service re-checks against the criterion's own min/max)

**Responses**

`EvaluationResponse` (returned only to the evaluator who owns it)
- `id`, `projectId`, `evaluateeId`, `evaluateeName`, `scores[]` (`criterionId`, `criterionName`, `score`), `comment`, `submittedAt`, `updatedAt`, `version`, `editable` (boolean)

`PendingEvaluationDTO`
- `evaluateeId`, `evaluateeName`, `status` (`NOT_STARTED` | `SUBMITTED`), `evaluationId` (nullable)

`EvaluationWindowDTO`
- `projectId`, `evalStartDate`, `evalEndDate`, `state` (`NOT_OPEN` | `OPEN` | `CLOSED`), `serverTime`

`CriterionDTO`
- `id`, `name`, `description`, `minScore`, `maxScore`

`ErrorResponse` (use Spring's `ProblemDetail`, RFC 7807)
- `status`, `title`, `detail`, `code` (machine-readable), `fieldErrors` (optional)

> Anonymity check: nothing in this phase exposes *received* evaluations to students. `EvaluationResponse` only ever shows evaluations the caller authored.

---

## 6. Backend Components

| Package | Class | Responsibility |
|---|---|---|
| `model` | `Evaluation`, `EvaluationScore`, `Criterion`, `ProjectMember` | Entities and constraints |
| `repository` | `EvaluationRepository` | exists-by pairing, find by project + evaluator, find by id + evaluator |
| `repository` | `CriterionRepository`, `ProjectMemberRepository` | criteria by project; membership checks and teammate lists |
| `service` | `EvaluationService` | Orchestrates create/update/list; owns all business rules |
| `service` | `EvaluationWindowPolicy` | Single place for deadline logic (injectable `Clock` for testing) |
| `service` | `EvaluationValidator` | Cross-field rules: all criteria covered, no duplicate criterion IDs, score within criterion range |
| `controller` | `EvaluationController` | Student endpoints, `@PreAuthorize("hasRole('STUDENT')")` |
| `exception` | `EvaluationWindowClosedException`, `DuplicateEvaluationException`, `NotTeamMemberException`, `SelfEvaluationException`, `ResourceNotFoundException` | Mapped in `GlobalExceptionHandler` |
| `config` | `ClockConfig` | Exposes a `Clock` bean (UTC) |

### 6.1 Business rules (executed in this order in `EvaluationService`)

1. Resolve the current user from the security context (never from the body).
2. Load the project (404 if missing).
3. Confirm the caller is a `ProjectMember` (403 otherwise).
4. Confirm the evaluatee is a `ProjectMember` of the same project (403/400).
5. Reject `evaluatee == evaluator`.
6. `EvaluationWindowPolicy`: must be `OPEN` (otherwise 422 with `NOT_OPEN` / `WINDOW_CLOSED`).
7. Validate scores: every project criterion present once, each within range.
8. Create: check for an existing pairing (409), then save. Also catch `DataIntegrityViolationException` from the unique constraint to handle race conditions and map it to the same 409.
9. Update: load by `id AND evaluator_id = currentUser` (404 if not owner, so existence isn't leaked). Re-check the window. Check `version` (409 on a stale version).
10. All of the above run in a single `@Transactional` method.

### 6.2 Security

- `/api/**` requires a valid JWT. Evaluation endpoints are student-only.
- Return **404 rather than 403** for evaluations that exist but belong to someone else (avoids IDOR enumeration).
- Do not log comment text or scores at INFO level.
- Rate-limit the write endpoints (e.g., Bucket4j or a gateway rule) as a later hardening step.
- Comments are stored as plain text, trimmed and length-capped. React escapes on render; never use `dangerouslySetInnerHTML`.
- CORS: allow only the frontend origin from config.

### 6.3 Maven dependencies

Confirm these are in `pom.xml`:

- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-security`
- `spring-boot-starter-validation` (Jakarta Validation; needed for `@Valid`)
- DB driver (MySQL or PostgreSQL)
- `jjwt` (api/impl/jackson) or your existing JWT lib

New/recommended:

- `flyway-core` (+ `flyway-mysql` if using MySQL)
- `springdoc-openapi-starter-webmvc-ui` (API docs, for the frontend team)
- Test scope: `spring-boot-starter-test`, `spring-security-test`, optionally Testcontainers

---

## 7. API Contract

Base path: `/api`. All requests need `Authorization: Bearer <jwt>`. All times are ISO-8601 UTC.

### 7.1 `GET /api/projects/{projectId}/evaluation-window`
Returns the evaluation window state.

**200**
```json
{
  "projectId": 12,
  "evalStartDate": "2026-11-10T00:00:00Z",
  "evalEndDate": "2026-11-17T15:59:59Z",
  "state": "OPEN",
  "serverTime": "2026-11-12T08:30:00Z"
}
```

### 7.2 `GET /api/projects/{projectId}/criteria`
**200**
```json
[
  { "id": 1, "name": "Contribution", "description": "Quality and quantity of work", "minScore": 1, "maxScore": 5 },
  { "id": 2, "name": "Reliability", "description": "Meets deadlines", "minScore": 1, "maxScore": 5 }
]
```

### 7.3 `GET /api/evaluations/pending?projectId={projectId}`
Lists teammates (excluding self) with submission status and overall progress.

**200**
```json
{
  "projectId": 12,
  "completedCount": 1,
  "totalCount": 2,
  "teammates": [
    { "evaluateeId": 34, "evaluateeName": "Maria Santos", "status": "SUBMITTED", "evaluationId": 101 },
    { "evaluateeId": 35, "evaluateeName": "Jun Reyes", "status": "NOT_STARTED", "evaluationId": null }
  ]
}
```
**Errors:** 403 not a member · 404 project

### 7.4 `POST /api/evaluations`
**Request**
```json
{
  "projectId": 12,
  "evaluateeId": 35,
  "scores": [
    { "criterionId": 1, "score": 4 },
    { "criterionId": 2, "score": 5 }
  ],
  "comment": "Reliable and communicative."
}
```
**201** + `Location: /api/evaluations/102`
```json
{
  "id": 102,
  "projectId": 12,
  "evaluateeId": 35,
  "evaluateeName": "Jun Reyes",
  "scores": [
    { "criterionId": 1, "criterionName": "Contribution", "score": 4 },
    { "criterionId": 2, "criterionName": "Reliability", "score": 5 }
  ],
  "comment": "Reliable and communicative.",
  "submittedAt": "2026-11-12T08:31:00Z",
  "updatedAt": null,
  "version": 0,
  "editable": true
}
```

### 7.5 `PUT /api/evaluations/{evaluationId}`
**Request**
```json
{
  "scores": [
    { "criterionId": 1, "score": 5 },
    { "criterionId": 2, "score": 5 }
  ],
  "comment": "Updated after final demo.",
  "version": 0
}
```
**200** returns `EvaluationResponse` with an incremented `version`.

### 7.6 `GET /api/evaluations/mine?projectId={projectId}`
Evaluations the caller has **given**. **200:** `EvaluationResponse[]`

### 7.7 `GET /api/evaluations/{evaluationId}`
Owner only. **200:** `EvaluationResponse`. **404** if not found *or* not owned.

### 7.8 Error contract

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Bean validation, missing/duplicate criteria, score out of range, self-evaluation |
| 401 | `UNAUTHENTICATED` | Missing/invalid JWT |
| 403 | `NOT_TEAM_MEMBER` | Caller or evaluatee not in the project; wrong role |
| 404 | `NOT_FOUND` | Project/evaluation missing or not owned |
| 409 | `DUPLICATE_EVALUATION` | Pairing already exists |
| 409 | `STALE_VERSION` | Optimistic lock mismatch on update |
| 422 | `EVALUATION_NOT_OPEN` | Before `evalStartDate` |
| 422 | `EVALUATION_WINDOW_CLOSED` | After `evalEndDate` |

Example:
```json
{
  "status": 422,
  "title": "Evaluation window closed",
  "detail": "Evaluations for this project closed on 2026-11-17T15:59:59Z.",
  "code": "EVALUATION_WINDOW_CLOSED"
}
```

---

## 8. Frontend Plan

### 8.1 Folder additions

```
frontend/src/
├── api/
│   └── evaluationApi.js          # window, criteria, pending, create, update, mine
├── components/
│   ├── RatingInput.jsx           # 1–5 selector, keyboard accessible
│   ├── DeadlineBanner.jsx        # OPEN / NOT_OPEN / CLOSED state + countdown
│   ├── TeammateCard.jsx          # name + status badge + action button
│   └── EvaluationForm.jsx        # criteria list + comment + submit
├── hooks/
│   ├── useEvaluationWindow.js
│   ├── usePendingEvaluations.js
│   └── useEvaluationForm.js      # form state, validation, submit/update
├── pages/student/
│   ├── EvaluationDashboardPage.jsx   # list of teammates for a project
│   └── EvaluateTeammatePage.jsx      # create/edit form
└── utils/
    └── evaluationValidators.js   # mirrors backend rules for instant feedback
```

### 8.2 Routes (React Router v6)

- `/student/projects/:projectId/evaluations` → `EvaluationDashboardPage`
- `/student/projects/:projectId/evaluations/:evaluateeId` → `EvaluateTeammatePage` (loads existing evaluation if `status = SUBMITTED`)

### 8.3 UX rules

- Disable the form and show `DeadlineBanner` when state ≠ `OPEN`. The backend remains the source of truth.
- Block submit until every criterion has a score; show the 1000-char counter on the comment.
- Map error `code`s to friendly messages (409 duplicate → switch to edit mode; 409 stale → prompt reload; 422 → locked state).
- Confirm dialog on submit ("You can edit until <deadline>").
- Tailwind: page `bg-slate-900`, cards `bg-slate-800 rounded-xl`, text `text-slate-100/300`, accent `indigo`/`emerald` for status badges.

---

## 9. Step-by-Step Implementation Plan

**Backend**
1. Add/confirm Maven dependencies (validation, Flyway, springdoc).
2. Create Flyway migration: `criterion`, `evaluation`, `evaluation_score` with unique + check constraints and indexes.
3. Add JPA entities and repositories.
4. Add `ClockConfig` and `EvaluationWindowPolicy` (+ unit tests with a fixed clock).
5. Add DTOs with Jakarta Validation annotations.
6. Add custom exceptions and extend `GlobalExceptionHandler` to return `ProblemDetail` with `code`.
7. Implement `EvaluationValidator` and `EvaluationService` (rules in §6.1).
8. Implement `EvaluationController` with `@PreAuthorize` and `@Valid`.
9. Seed default criteria for each new project.
10. Write tests (see §10).
11. Verify the OpenAPI docs match §7.

**Frontend**
12. Add `evaluationApi.js` and the Axios 401 interceptor (if not present).
13. Build hooks, then `RatingInput`, `DeadlineBanner`, `TeammateCard`, `EvaluationForm`.
14. Build the two pages and wire the routes behind a student-only guard.
15. Handle error codes and loading/empty states.
16. Manual end-to-end test against the running backend.

---

## 10. Test Checklist

**Unit / service**
- [ ] Window policy: before start, exactly at start, during, exactly at end, after end
- [ ] Self-evaluation rejected
- [ ] Non-member evaluator / evaluatee rejected
- [ ] Missing criterion, duplicate criterion, score 0 and 6 rejected
- [ ] Duplicate pairing → 409

**Integration (MockMvc + test DB)**
- [ ] Create → 201; second create same pair → 409
- [ ] Two concurrent creates for the same pair → one 201, one 409
- [ ] Update with stale `version` → 409
- [ ] Update after deadline → 422
- [ ] User B cannot `GET`/`PUT` user A's evaluation (404)
- [ ] Instructor token on student endpoints → 403
- [ ] No response in this phase contains evaluator identity for received evaluations

---

## 11. Edge Cases & Risks

- **Clock and timezone:** compare `Instant`s only; show local time in the UI. Decide whether `evalEndDate` is inclusive (assumed: inclusive up to the stored instant).
- **Deadline race:** the user opens the form before the deadline and submits after. The server check at submit time wins (422), and the UI must handle it gracefully.
- **Team changes mid-window:** if a member is removed, keep their existing evaluations but block new ones; decide handling in Phase 4.
- **Criteria changed after submissions:** lock criteria edits once the window opens.
- **Double submit:** disable the button while pending; the DB constraint is the backstop.
- **Small teams:** a team of 2 means the received score is trivially attributable; consider a minimum team size warning for instructors.
- **Comment privacy:** comments are attributable to the evaluator by instructors only; never include them in any student-facing DTO.

---

## 12. Backend Folder Structure (Spring Boot + Maven)

`(new)` = added in this phase. `(ext)` = existing file extended. Everything else is from earlier phases or later ones.

```
backend/
├── pom.xml                                          (ext) add flyway-core, springdoc, test deps
└── src/
    ├── main/
    │   ├── java/com/peery/backend/
    │   │   ├── PeeryApplication.java
    │   │   │
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java              # filter chain, role rules, stateless sessions
    │   │   │   ├── CorsConfig.java                  # allowed frontend origin from properties
    │   │   │   ├── OpenApiConfig.java               # Swagger/OpenAPI + bearer auth scheme
    │   │   │   └── ClockConfig.java                 (new) UTC Clock bean for deadline checks
    │   │   │
    │   │   ├── security/
    │   │   │   ├── JwtTokenProvider.java            # create/validate tokens
    │   │   │   ├── JwtAuthenticationFilter.java     # reads Bearer token, sets SecurityContext
    │   │   │   ├── CustomUserDetailsService.java
    │   │   │   └── CurrentUser.java                 (new) helper to resolve the authenticated user ID
    │   │   │
    │   │   ├── model/
    │   │   │   ├── User.java
    │   │   │   ├── Role.java                        # enum STUDENT, INSTRUCTOR
    │   │   │   ├── Project.java                     (ext) evalStartDate, evalEndDate
    │   │   │   ├── ProjectMember.java               (new or confirm)
    │   │   │   ├── Criterion.java                   (new)
    │   │   │   ├── Evaluation.java                  (new)
    │   │   │   └── EvaluationScore.java             (new)
    │   │   │
    │   │   ├── repository/
    │   │   │   ├── UserRepository.java
    │   │   │   ├── ProjectRepository.java
    │   │   │   ├── ProjectMemberRepository.java     (new or confirm)
    │   │   │   ├── CriterionRepository.java         (new)
    │   │   │   └── EvaluationRepository.java        (new)
    │   │   │
    │   │   ├── dto/
    │   │   │   ├── auth/                            # login/register request + response
    │   │   │   ├── project/
    │   │   │   ├── evaluation/                      (new)
    │   │   │   │   ├── CreateEvaluationRequest.java
    │   │   │   │   ├── UpdateEvaluationRequest.java
    │   │   │   │   ├── ScoreInput.java
    │   │   │   │   ├── EvaluationResponse.java
    │   │   │   │   ├── PendingEvaluationsResponse.java
    │   │   │   │   ├── PendingEvaluationDTO.java
    │   │   │   │   ├── EvaluationWindowDTO.java
    │   │   │   │   └── CriterionDTO.java
    │   │   │   └── result/
    │   │   │       └── StudentResultSummaryDTO.java # Phase 4: anonymized, no evaluator identity
    │   │   │
    │   │   ├── service/
    │   │   │   ├── AuthService.java
    │   │   │   ├── ProjectService.java
    │   │   │   ├── EvaluationService.java           (new) create/update/list, owns business rules
    │   │   │   ├── EvaluationValidator.java         (new) criteria coverage + score range checks
    │   │   │   ├── EvaluationWindowPolicy.java      (new) single source of deadline logic
    │   │   │   └── ScoreAggregationService.java     # Phase 4
    │   │   │
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   ├── ProjectController.java
    │   │   │   ├── EvaluationController.java        (new) student endpoints
    │   │   │   ├── ResultController.java            # Phase 4 student summaries
    │   │   │   └── InstructorController.java        # Phase 5 attribution + overrides
    │   │   │
    │   │   └── exception/
    │   │       ├── GlobalExceptionHandler.java      (ext) returns ProblemDetail with `code`
    │   │       ├── ResourceNotFoundException.java
    │   │       ├── NotTeamMemberException.java      (new)
    │   │       ├── SelfEvaluationException.java     (new)
    │   │       ├── DuplicateEvaluationException.java (new)
    │   │       ├── EvaluationWindowClosedException.java (new)
    │   │       ├── EvaluationNotOpenException.java  (new)
    │   │       └── StaleEvaluationException.java    (new)
    │   │
    │   └── resources/
    │       ├── application.yml                      # datasource, jwt secret/expiry, cors origin
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       └── db/migration/                        (new) Flyway
    │           ├── V1__init_users_projects.sql
    │           ├── V2__project_members.sql
    │           └── V3__evaluations.sql              (new) criterion, evaluation, evaluation_score
    │
    └── test/
        ├── java/com/peery/backend/
        │   ├── service/
        │   │   ├── EvaluationWindowPolicyTest.java  (new)
        │   │   ├── EvaluationValidatorTest.java     (new)
        │   │   └── EvaluationServiceTest.java       (new)
        │   ├── controller/
        │   │   └── EvaluationControllerIT.java      (new) MockMvc + security
        │   └── security/
        │       └── AnonymityContractTest.java       (new) no evaluator identity in student responses
        └── resources/
            └── application-test.yml
```

**Layering rules**
- Controllers: HTTP and `@Valid` only; no business logic.
- Services: all rules, transactions (`@Transactional`), and authorization checks that depend on data (membership, ownership).
- Repositories: queries only.
- Entities never leave the service layer; controllers return DTOs.
- Student-facing DTOs must never contain evaluator identity fields.

---

## 13. Open Questions (confirm before coding)

1. Fixed default criteria or instructor-defined per project?
2. Should students be able to *delete/withdraw* an evaluation before the deadline?
3. Is a draft state needed, or is submit-then-edit enough?
4. Should evaluating every teammate be mandatory, or is partial submission allowed?
5. Is `evalEndDate` inclusive?
6. Should the rubric be able to mark the qualitative comment as mandatory per project?

---

## 14. Roadmap


- [x] Phase 1: Auth & roles
- [] Phase 2: Projects & teams
- [ ] **Phase 3: Epic 3 — Confidential Peer Evaluation Engine (this document)**
  - [ ] 3.1 Pending Evaluation Tracker & Teammate Selector
  - [ ] 3.2 Rubric Rating & Qualitative Feedback Submission
  - [ ] 3.3 Pre-Deadline Editing & Anonymity Protection
- [ ] Phase 4: Score aggregation + `StudentResultSummaryDTO`
- [ ] Phase 5: Instructor view, rater attribution, grade overrides with mandatory reason
