# WHS Frontend Gemini Memory

## Mission
- Build and maintain the Angular 15 Warehouse Management System frontend in `src/app`.
- Prioritize safe, incremental, and testable changes over broad rewrites.

## Project Rules
- Follow `AGENTS.md` as the primary engineering contract.
- Keep code TypeScript strict and consistent with `.editorconfig` (2 spaces, final newline, trimmed trailing spaces).
- Use existing feature structure:
  - Pages: `src/app/pages`
  - Services: `src/app/service`
  - DTOs: `src/app/dto/request`, `src/app/dto/response`
  - Security: `src/app/security/guards`, `src/app/security/interceptors`
- Keep API endpoints centralized in `src/environments/BaseURL.ts`. Do not hardcode backend URLs.
- Reuse current auth flow, guards, and interceptors; do not bypass JWT/error handling patterns.
- For every non-trivial change, add or update unit tests next to changed files (`*.spec.ts`).

## Delivery Workflow
Use this sequence for feature work:
1. `/ba_spec <requirement>` to produce a clear BA spec and acceptance criteria.
2. `/plan <approved_spec>` to create an implementation plan with impacted files.
3. `/impl_guardrails <plan_or_ticket>` to implement with repository guardrails.
4. `/test <scope>` to run validation and summarize failures/risks.
5. `/pr_review <scope>` to do a final quality review before opening PR.

## Definition Of Done
- Business logic matches requirement and edge cases are handled.
- UI states are covered (`loading`, `empty`, `error`, `success`).
- Routing/guard/security behavior remains correct.
- `npm run build` passes.
- Relevant tests pass (`npm test` or targeted `ng test --watch=false` commands).
- Final output includes changed files, test evidence, and residual risks.
