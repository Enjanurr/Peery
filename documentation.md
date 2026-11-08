# Peery: Team Testing & Exploration Guide

Peery is a peer evaluation platform. Instructors create projects and teams. Students rate their teammates confidentially. Instructors view anonymized results, see who said what (audited), and apply grade overrides.

This guide is for teammates who want to run the app, write test cases, and find bugs.

---

## 1. Stack

| Layer | Tech |
|---|---|
| Backend | Spring Boot 3.2.5, Java 17, package `com.peery.app` |
| Database | Supabase Postgres, schema managed by Flyway (V1 to V5) |
| Auth | Stateless JWT. The token subject is the user's **email** |
| Frontend | React 18, Vite, TypeScript, Tailwind v4 |
| Tests | Vitest integration tests (live backend), Postman (optional), manual UI testing |

---

## 2. Running it locally

### Backend (`/backend`)
1. Create `backend/.env` (never commit it):
   ```
   DB_URL=jdbc:postgresql://<host>:5432/postgres
   DB_USERNAME=<user>
   DB_PASSWORD=<password>
   JWT_SECRET=<long random string, 32+ chars>
   INSTRUCTOR_INVITE_CODE=<code instructors need to register>
   ```
   `DB_URL` must start with `jdbc:` and must **not** contain `user:password@`.
2. Start it (Windows PowerShell): `.\mvnw.cmd spring-boot:run`
3. It listens on `http://localhost:8080`. Flyway should log migrations up to `5 - profiles password reset`.

### Frontend (`/frontend`)
```
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
```

### Automated integration tests (backend must be running)
Create `frontend/.env.test.local`:
```
VITE_TEST_INVITE_CODE=<same as INSTRUCTOR_INVITE_CODE>
```
Then run `npm run test:integration`. These tests create `it_*` accounts in the database each run.

### Password reset in development
No email server is configured. When someone requests a reset link, **the link is printed in the backend console** as `PASSWORD RESET LINK for <email> ... <url>`. Copy it from there.

---

## 3. Suggested test accounts

Register these through the UI (`/register`). Use throwaway emails.

| Account | Role | Notes |
|---|---|---|
| Prof A | INSTRUCTOR | Needs the invite code |
| Prof B | INSTRUCTOR | Used to test ownership isolation (Prof B must not see Prof A's data) |
| Ann, Ben, Cara | STUDENT | Put all three on one team |
| Dan | STUDENT | Not on any team (access-control tests) |

---

## 4. Roles and routes

| Role | Can access |
|---|---|
| Public | `/login`, `/register`, `/forgot-password`, `/reset-password?token=...` |
| STUDENT | `/student`, `/student/projects`, `/student/projects/:projectId/evaluations`, `/student/projects/:projectId/evaluations/:evaluateeId`, `/student/projects/:projectId/results`, `/profile` |
| INSTRUCTOR | `/instructor`, `/instructor/projects`, `/instructor/projects/:projectId`, `.../results`, `.../attribution`, `.../grades`, `/profile` |

API prefixes: `/api/auth/**` is public, `/api/student/**` needs STUDENT, `/api/instructor/**` needs INSTRUCTOR, and everything else needs a valid token (for example `/api/users/**`).

**Things to try:** a student visiting an instructor URL (and the reverse), visiting a protected URL while logged out, and editing the URL to another project's id.

---

## 5. Features and business rules

### 5.1 Auth & roles
- Register as STUDENT, or as INSTRUCTOR with the invite code.
- Login returns a JWT. A 401 makes the frontend log the user out.
- Emails are case-insensitive.

### 5.2 Projects & teams (instructor)
- Create, edit and delete projects. Set up teams and members.
- An instructor only sees their own projects.

### 5.3 Peer evaluation (student)
- A student rates each teammate on rubric criteria, plus an optional comment.
- Evaluation window states: **NOT_OPEN**, **OPEN**, **CLOSED**. The end date is **inclusive**.
- Ratings can be edited until the window closes.
- A student cannot rate someone outside their team, and cannot rate when the window is not OPEN.

### 5.4 Results (anonymized)
- Students see their results **only after the window is CLOSED**.
- A result is shown only when there are **at least 2 responses**. Otherwise it is withheld.
- Comments are shown in **alphabetical order, with no timestamps and no names**.
- The student endpoint never returns who evaluated them.

### 5.5 Instructor attribution & grade overrides
- **Attribution view** (who rated whom): **CLOSED windows only**, and every view is logged.
- **Grade override**: the instructor sets a grade that replaces the computed one. A **reason is required**.
- Overrides are **append-only**. A change or revoke creates a new history row, and the database blocks edits and deletes.
- Override reasons are visible to instructors only. A student sees the effective grade but never the reason.

### 5.6 Profile
- Everyone edits full name and email.
- Students: optional student number and program.
- Instructors: optional employee/staff code and department. The registration invite code is never shown or editable.
- A role cannot set the other role's fields (`FIELD_NOT_FOR_ROLE`).
- **Changing email requires the current password** and signs the user out, because the email is the login identity.

### 5.7 Change password & forgot password
- Change password: current password required. New password must be 8 to 72 bytes and different from the current one.
- Forgot password: always answers the same message, whether or not the email exists. Sends at most **one link per account per 60 seconds**.
- Reset link: valid **30 minutes**, **single use**. A newer link cancels older ones.

---

## 6. API reference (endpoints we know exactly)

Check the controllers in `backend/src/main/java/com/peery/app/controller/` for the full list, especially Phases 1 to 4.

| Method | Path | Role | Success |
|---|---|---|---|
| GET | `/api/instructor/projects/{pid}/attribution` | INSTRUCTOR | 200 |
| GET | `/api/instructor/projects/{pid}/grades` | INSTRUCTOR | 200 |
| PUT | `/api/instructor/projects/{pid}/students/{sid}/override` | INSTRUCTOR | 200 |
| POST | `/api/instructor/projects/{pid}/students/{sid}/override/revoke` | INSTRUCTOR | 200 |
| GET | `/api/instructor/projects/{pid}/students/{sid}/override/history` | INSTRUCTOR | 200 |
| GET | `/api/student/projects/{pid}/grade` | STUDENT | 200 |
| GET | `/api/users/me/profile` | any signed in | 200 |
| PUT | `/api/users/me/profile` | any signed in | 200 |
| PUT | `/api/users/me/password` | any signed in | 204 |
| POST | `/api/auth/password/forgot` | public | 202 |
| POST | `/api/auth/password/reset` | public | 204 |

Auth header for protected calls: `Authorization: Bearer <token>`

### Error format
```json
{
  "timestamp": "...",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "...",
  "fieldErrors": { "email": "Enter a valid email address" }
}
```

### Common error codes
| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Field rules failed (see `fieldErrors`) |
| 400 | `MALFORMED_REQUEST` | Bad JSON |
| 400 | `MISSING_PARAMETER` / `INVALID_PARAMETER` | Bad query/path parameter |
| 400 | `CURRENT_PASSWORD_REQUIRED` | Email change without the password |
| 400 | `INVALID_CURRENT_PASSWORD` | Wrong current password (400 on purpose, so the app does not log out) |
| 400 | `PASSWORD_UNCHANGED` | New equals current |
| 400 | `PASSWORD_TOO_LONG` | Over 72 bytes |
| 400 | `FIELD_NOT_FOR_ROLE` | A field the role cannot set |
| 400 | `INVALID_RESET_TOKEN` | Reset link bad, used or expired |
| 401 | `UNAUTHENTICATED` / `INVALID_CREDENTIALS` | No or bad token / wrong login |
| 403 | `FORBIDDEN` | Wrong role |
| 404 | `NOT_FOUND` | Missing (also used for other people's data) |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method |
| 409 | `EMAIL_ALREADY_EXISTS` | Email taken |
| 409 | `STALE_VERSION` | Edited by someone else first |
| 500 | `INTERNAL_ERROR` | Unexpected server error. **Always report these** |

---

## 7. Test scenarios by area

Use these as a starting checklist. Add your own, and record the result of each (pass/fail).

### A. Auth
- [ ] Register a student. Log in. Land on the student dashboard.
- [ ] Register an instructor with the right invite code. Land on the instructor dashboard.
- [ ] Register an instructor with a wrong, empty or whitespace-padded invite code. Expect rejection.
- [ ] Register with an email that already exists, including different capitalisation.
- [ ] Register or log in with an invalid email format or a short password.
- [ ] Log in with a wrong password. Expect "invalid email or password".
- [ ] Open a protected URL while logged out. Expect a redirect to `/login`.
- [ ] Student opens an instructor URL, and the reverse.
- [ ] Delete the token from browser storage mid-session, then click around.

### B. Projects & teams
- [ ] Create a project with blank, very long and special-character titles.
- [ ] Set an end date in the past, and an end date before the start date.
- [ ] Edit and delete a project. Check teams and results afterwards.
- [ ] Prof B tries to open Prof A's project by URL. Expect denial.

### C. Evaluations
- [ ] Before the window opens: student cannot submit.
- [ ] While open: submit ratings for each teammate. Edit one. Check the edit saved.
- [ ] Boundary: ratings at the minimum and maximum values, and just outside them.
- [ ] Evaluate yourself, a non-teammate (Dan), or a non-existent id. Expect rejection.
- [ ] Submit on the last day of the window (end date is inclusive) and the day after.
- [ ] Open the same evaluation in two tabs, edit both, and check the stale-version handling.
- [ ] Very long comments, emoji, and `<script>` text. Check how they display.

### D. Results (anonymity)
- [ ] Before CLOSED: student sees no results.
- [ ] After CLOSED with only 1 response: results are withheld.
- [ ] With 2 or more responses: averages and per-criterion scores appear.
- [ ] Comments are alphabetical, with no names or times.
- [ ] Look at the browser Network tab for the student results response. **It must contain no evaluator ids or names.** This is the most important check.
- [ ] Ann should never see her own ratings of others, only what others gave her.

### E. Attribution & grades
- [ ] Attribution view is blocked while the window is not CLOSED.
- [ ] After CLOSED: instructor sees who rated whom.
- [ ] Prof B cannot view Prof A's attribution or gradebook.
- [ ] Override without a reason, or a whitespace-only reason: rejected.
- [ ] Valid override: the student sees the new effective grade but **not** the reason.
- [ ] Revoke an override: history shows a new row, and the old one is still there.
- [ ] Out-of-range grade values, decimals, negatives and non-numbers.
- [ ] Two override changes in quick succession: history order is correct.

### F. Profile
- [ ] Student saves number and program. Reload and check they persisted.
- [ ] Instructor saves employee code and department.
- [ ] Clearing an optional field saves it as empty.
- [ ] Blank name, 101-character name, invalid email: all rejected.
- [ ] Change the name. The dashboard greeting updates after the reload.
- [ ] Change email without the password, with a wrong password, and to an existing email.
- [ ] Change email correctly: signed out, old email fails, new email works.
- [ ] Open the instructor profile response in Network. **No invite code anywhere.**

### G. Passwords
- [ ] Change password with the wrong current password: error shown, still logged in.
- [ ] New password too short, same as current, mismatched confirmation.
- [ ] Valid change: log out, and only the new password works.
- [ ] Forgot password with an unknown email: same message, nothing in the console.
- [ ] Forgot password with a real email: link appears in the backend console.
- [ ] Request twice within 60 seconds: only one link is created.
- [ ] Use the link: works. Use it again: rejected.
- [ ] Request link 1, wait 60 seconds, request link 2, then use link 1: rejected. Link 2 works.
- [ ] Expired link (see the SQL below): rejected.
- [ ] `/reset-password` with no token: clear message.

Force a link to expire (Supabase SQL editor):
```sql
update password_reset_tokens set expires_at = now() - interval '1 minute' where used_at is null;
```

### H. UI & general
- [ ] Every page at phone width and desktop width.
- [ ] Loading, empty and error states on each list page.
- [ ] Browser back and forward after logging in and out.
- [ ] Double-click submit buttons. Check for duplicate records.
- [ ] Stop the backend while using the app. The error should be friendly, not a blank screen.

---

## 8. Security checks worth trying

- Change ids in URLs and API calls (`projectId`, `studentId`, `evaluateeId`) to ones you should not access.
- Call instructor APIs with a student token, and the reverse.
- Reuse an old token after changing the email.
- Send HTML or script text in names and comments.
- Confirm nothing sensitive (password hashes, reset tokens, invite code, evaluator identities) appears in any response.

---

## 9. Known limitations (do not report these as new bugs)

- Old JWTs stay valid after a password change or reset, because the tokens are stateless.
- Reset throttling is per account only, with no per-IP rate limit.
- Reset links are printed to the console in development. There is no real email yet.
- Changing the name needs a page reload to refresh the header (the app reloads automatically).
- Whether a hacker-supplied email format is deliverable is not checked.

---

## 10. Reporting a bug

Please open an issue (or message the team) using this template:

```
Title: <short summary>

Environment: local / <branch or commit>
Account/role used: <e.g. Ann (STUDENT)>

Steps to reproduce:
1.
2.
3.

Expected result:
Actual result:

Evidence: screenshot, and for API problems the Network tab request and response
          (status, body, and `code` field). Include backend console lines for any 500.

Severity: Blocker / Major / Minor / Cosmetic
```

Severity guide:
- **Blocker:** cannot log in, data loss, or any evaluator identity leaking to a student.
- **Major:** a feature does not work, or a role can reach something it should not.
- **Minor:** wrong message, wrong status code, odd edge case.
- **Cosmetic:** layout or wording.

**Never paste** real passwords, the JWT secret, the invite code or database credentials into a bug report.