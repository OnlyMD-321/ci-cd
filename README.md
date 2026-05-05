# todo-api

Tiny Express REST API used to demonstrate a complete CI workflow on GitHub.

Each feature is delivered as its own branch -> commit -> Pull Request -> squash merge into `dev`. After every successful merge into `dev`, a release pipeline runs CI again and fast-forwards `main` to `dev`. Every PR is gated by GitHub Actions: format check, lint, tests with >= 90% coverage, and a production build.

## Stack

- Node.js 20 (LTS)
- Express 4
- Jest + Supertest
- ESLint + Prettier
- esbuild (production bundle)
- GitHub Actions (CI)

## Run

```bash
npm install
npm run dev          # node --watch src/server.js
npm test             # jest
npm run lint         # eslint .
npm run format:check # prettier --check .
npm run build        # bundles to dist/index.js
```

The server listens on `http://localhost:3000` (override with `PORT`).

## Endpoints

| Method | Path      | Purpose                                | Added in |
| ------ | --------- | -------------------------------------- | -------- |
| GET    | `/health` | Liveness probe -> `{ "status": "ok" }` | PR #0    |
| GET    | `/todos`  | List all todos (array)                 | PR #1    |
| POST   | `/todos`  | Create todo `{ title }` -> 201         | PR #2    |

## Pipelines

Two GitHub Actions workflows drive the flow:

### `.github/workflows/ci.yml` — gating

Runs on every push to `main` or `dev`, and every PR targeting `main` or `dev`:

1. `npm ci`
2. `npm run format:check`
3. `npm run lint`
4. `npm test -- --coverage` (thresholds: lines 90 / branches 85 / functions 90 / statements 90)
5. `npm run build` (esbuild -> `dist/index.js`)
6. Uploads `coverage/` and `dist/` as workflow artifacts.

A PR cannot be squash-merged into `dev` while `CI / ci` is red.

### `.github/workflows/release.yml` — promotion to main

Runs on every push to `dev` (i.e. after a feature PR is squash-merged into `dev`) and on manual `workflow_dispatch`:

1. **`ci` job** — re-runs the same checks above against the new `dev` tip.
2. **`promote` job** — if CI passes, fast-forwards `main` to `dev` and pushes (`git merge --ff-only origin/dev`).

So every green merge into `dev` automatically advances `main`. `main` is therefore always equal to the last green `dev` tip.

> The `promote` job uses the workflow's `GITHUB_TOKEN`. If `main` is protected, allow GitHub Actions to push to it (Settings -> Branches -> rule on `main` -> "Allow specified actors to bypass required pull requests").

## Branching & commits

- `main` — release line, advanced only by the release pipeline.
- `dev` — integration branch; feature PRs are squash-merged here.
- Feature branches: `feat/<short-name>` (e.g. `feat/list-todos`), opened against `dev`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- One PR = one feature = one squash commit on `dev`, then one fast-forward on `main`.

## License

MIT
