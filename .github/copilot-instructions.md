# Copilot instructions for this repository

Repository state: no source files detected at the time of inspection. These instructions are optimized for an early-stage Node/TypeScript project named `disasterscout_node` and are intentionally concrete and conservative: prefer discovery-first steps and only modify files that are present.

1. Quick discovery checklist (do this before making edits)
   - Look for these files at repository root (in order): `package.json`, `pnpm-lock.yaml` / `yarn.lock`, `tsconfig.json`, `src/`, `lib/`, `index.js`, `server.js`, `Dockerfile`, `.env.example`, `README.md`.
   - If `package.json` exists: read `scripts` to learn build/test/start commands. Prefer using the repo's scripts (npm/yarn/pnpm) rather than guessing commands.
   - If TypeScript config (`tsconfig.json`) exists, infer build pipeline (tsc, ts-node, esbuild, swc).

2. High-level architecture guidance (how to locate the "big picture")
   - Entry point: check `main` in `package.json` or common names: `src/index.ts`, `src/index.js`, `src/server.ts`, `src/server.js`.
   - Typical structure to look for:
     - `src/` — application source
     - `src/routes` or `src/controllers` — HTTP endpoints
     - `src/services` — business logic and external integrations
     - `src/models` — DB models or types
     - `config/` or `env/` — runtime configuration
   - Integration points: search for `process.env`, `axios`, `node-postgres`/`pg`, `mongoose`, `redis`, `kafka`, or cloud SDKs (`@aws-sdk`, `firebase-admin`). These identify external services.

3. Build, test, debug workflows (explicit steps to follow)
   - Install dependencies: prefer lockfile tool: use `npm ci` if `package-lock.json`/`npm` is present; `pnpm install` if `pnpm-lock.yaml` present; `yarn install` if `yarn.lock` present.
   - Build: run the repo `build` script from `package.json` (example: `npm run build`). If there's no build script but `tsconfig.json` exists, run `npx tsc --noEmit` to typecheck, or `npx tsc` to build to `dist/`.
   - Start locally: use `npm start` or `node dist/index.js`. For TypeScript dev servers, expect `npm run dev` (nodemon/ts-node-dev).
   - Tests: run `npm test` and read `jest`, `mocha`, or `vitest` configs. If none, search `test` directories and `*.spec.ts`/`*.test.js`.
   - Debugging: look for `.vscode/launch.json` or `nodemon.json`. If missing, use `node --inspect` or `node --inspect-brk` with the repo's start script.

4. Project-specific conventions and patterns (how to behave in-code)
   - If TypeScript is used, prefer explicit types for exported module boundaries (API handlers, service functions). Use `unknown`→validate before casting.
   - Use existing logging conventions: search for `winston`, `pino`, `debug`. Match the logger usage already present.
   - Configuration sources: prefer `process.env` and `config/*` files over inlined constants.
   - Error handling: follow existent pattern — if middleware catches errors centrally (e.g., `errorHandler` in `src/middleware`), propagate errors rather than silencing them.

5. Integration and external dependencies
   - When you see client wrappers (e.g., `src/clients/*`, `src/adapters/*`), treat them as single-responsibility boundaries. Add or modify code there for third-party interactions.
   - If a database migration tool exists (look for `migrations/`, `knexfile.js`, `prisma/`), do not modify schema without adding a migration file.

6. Making changes: minimal, safe edits
   - Prefer small, focused PRs that change a single responsibility (e.g., add a new route, fix a bug in one service).
   - Update `README.md` or create it if missing with: how to install, how to run tests, and main entrypoint.
   - If adding new scripts to `package.json`, keep names conventional: `build`, `start`, `dev`, `test`, `lint`.

7. Examples from the repository (replace when files exist)
   - Entrypoint example to locate: `src/index.ts` or the `main` field in `package.json`.
   - Config example: look for `config/default.ts` or `.env.example` to infer required env vars.

8. When repository is empty or missing key files (what the agent should do)
   - Report back: list the missing expected files (package.json, src/, README.md) and propose a minimal scaffold (package.json with name, scripts; `src/index.js` or `src/index.ts`; README).
   - Ask the human for intended runtime (Node version), preferred package manager (npm/pnpm/yarn), and whether TypeScript should be used.

9. Safety and verification
   - Run the repository's test command before claiming feature completion.
   - When making network calls or modifying deployment configs, prefer adding feature flags or dev-only conditionals and document them in README.

If anything in this file looks incomplete or the project has files not present during inspection, tell me where those files live or paste `package.json`/`README.md` content and I'll merge/update this guidance to be specific to the actual code.
