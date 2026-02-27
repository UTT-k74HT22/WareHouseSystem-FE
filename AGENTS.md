# Repository Guidelines

## Project Structure & Module Organization
- `src/app/pages`: feature screens (warehouse, inventory, stock, orders, auth).
- `src/app/service`: API services grouped by domain (`WarehouseService`, `AuthService`, etc.).
- `src/app/dto/request` and `src/app/dto/response`: typed payload contracts.
- `src/app/share`: reusable layout/UI (header, sidebar, footer, toastr).
- `src/app/security`: route guards and HTTP interceptors.
- `src/app/helper`: enums, constraints, mappers, and mock data.
- `src/assets` stores images; global styles are in `src/styles*.css`; supporting docs are in `documents/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm start`: run local dev server (`ng serve`, default Angular port).
- `npm run build`: create production bundle in `dist/whs-fe`.
- `npm run watch`: rebuild continuously in development mode.
- `npm test`: run unit tests with Jasmine + Karma.
- `ng test --watch=false --code-coverage`: CI-style test run with coverage output.

## Coding Style & Naming Conventions
- Follow `.editorconfig`: UTF-8, 2-space indentation, final newline, trimmed trailing spaces.
- Keep code TypeScript-strict (`tsconfig.json` has strict checks enabled).
- Use kebab-case for Angular file names (example: `warehouse.component.ts`).
- Use PascalCase for classes/interfaces and DTO file names (example: `CreateWarehouseRequest.ts`).
- Use single quotes in `.ts` files.

## Testing Guidelines
- Place tests beside implementation as `*.spec.ts`.
- Cover changed behavior in components, services, guards, and interceptors.
- For services, assert HTTP method/URL/payload with Angular HTTP testing utilities.
- No hard coverage gate is configured; still add meaningful tests for each fix/feature.

## Commit & Pull Request Guidelines
- Existing history uses short subjects, mostly `feat:` and `fix:` (plus occasional maintenance commits).
- Prefer imperative, scoped commit messages (example: `fix(location): handle empty search`).
- PRs should include purpose, key changes, test evidence, linked issue/ticket, and screenshots for UI changes.
- Keep PRs focused; separate refactor-only changes from feature or bug-fix work.

## Security & Configuration Tips
- Keep API endpoints centralized in `src/environments/BaseURL.ts`; avoid hardcoded URLs.
- Never commit secrets or tokens.
- Re-test auth flow after routing/security changes to confirm guards and interceptors still enforce access.
