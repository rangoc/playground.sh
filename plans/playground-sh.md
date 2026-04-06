# Plan: playground.sh

> Source PRD: `PRD.md` / [rangoc/playground.sh#1](https://github.com/rangoc/playground.sh/issues/1)

## Architectural decisions

Durable decisions that apply across all phases:

- **Directory structure**: `rooms/` for sandboxes, `shared/` for common code, `dashboard/` for the hub app
- **Bundler**: Vite for all rooms and the dashboard — no alternative bundlers
- **Package manager**: pnpm with workspaces (`pnpm-workspace.yaml` at root)
- **Room entry convention**: every room has `rooms/<name>/index.html` as its entry point
- **Shared import alias**: `@shared` resolves to the top-level `shared/` directory via Vite alias
- **Room discovery**: filesystem scan of `rooms/` — no registry, no manifest files
- **Metadata inference**: tech stack tags derived from `package.json` dependencies and source file extensions — never manually declared. Check direct + dev deps first, fall back to scanning import statements. CDN-only rooms default to "vanilla". No `<script>` tag parsing — keep it simple.
- **Room isolation**: each room has its own `package.json` for room-specific deps; pnpm workspaces hoists shared deps
- **Per-room Vite config**: each room has its own `vite.config.ts` that declares only the plugins it needs (e.g. React plugin for React rooms). The root Vite config provides only universal settings — `@shared` alias and common options. Room configs extend the root via `mergeConfig`.
- **`shared/` is a workspace member**: has its own `package.json` with explicitly declared dependencies. Consumed as raw source via the `@shared` alias — no separate build step.
- **Root TypeScript config**: a root `tsconfig.json` with `"paths": { "@shared/*": ["./shared/*"] }`. Rooms extend it via `"extends": "../../tsconfig.json"` for editor intellisense. The scaffolding skill writes room-level `tsconfig.json` automatically.
- **Dev commands via pnpm workspace filtering**: `pnpm dashboard` starts the dashboard, `pnpm --filter <room> dev` starts a single room. No custom CLI wrapper.
- **Dashboard has a thin Node.js backend**: handles room scanning (JSON API) and spawning/stopping per-room Vite dev servers on demand. Only runs in dev mode — not part of any build output.
- **Dynamic port assignment**: Vite picks free ports automatically when spawning room dev servers. The dashboard backend tracks `{ roomName: port }` in memory and exposes it via API.
- **Lazy iframe previews**: dashboard shows placeholder cards (room name + tags) by default. Live iframe preview only activates when the user clicks a card, which triggers the backend to spawn the room's dev server. No screenshots for v1.
- **Vite bundles everything**: `@shared` source and its transitive dependencies are all bundled into standalone room builds. Rooms don't need to redeclare shared deps.
- **Frontend only**: rooms are strictly client-side. No backend-capable rooms for v1. If a room needs a backend, run it separately outside the playground.
- **Skill knowledge is inline**: the tech-to-Vite-plugin mapping lives as a reference table in the scaffolding skill's SKILL.md. Claude reasons about unlisted tech by checking Vite's plugin ecosystem.
- **Single root `.gitignore`**: covers `node_modules/`, `dist/`, `.vite/`, `*.local`. No per-room gitignore files.

---

## Phase 1: Skeleton + first vanilla room

**User stories**: 10, 11, 17

### What to build

Set up the monorepo foundation and prove that a single vanilla room runs end-to-end. This means a root `package.json` with pnpm workspace config, a root `vite.config.ts` with the `@shared` alias (consumed by room configs), a root `tsconfig.json` with `@shared` path mapping, a `.gitignore`, and a `rooms/hello-world/` room with its own `vite.config.ts`, `index.html` + `main.ts` that renders something visible. Running `pnpm --filter hello-world dev` should start the room's Vite dev server with HMR working.

### Acceptance criteria

- [ ] Root `package.json` and `pnpm-workspace.yaml` exist and configure the monorepo
- [ ] Root `vite.config.ts` provides `@shared` alias and common settings
- [ ] Root `tsconfig.json` provides `@shared` path mapping
- [ ] Root `.gitignore` covers `node_modules/`, `dist/`, `.vite/`, `*.local`
- [ ] `rooms/hello-world/` contains its own `vite.config.ts`, `tsconfig.json`, `package.json`, `index.html`, and `main.ts`
- [ ] Room `vite.config.ts` extends root config via `mergeConfig`
- [ ] Room `tsconfig.json` extends root via `"extends"`
- [ ] `pnpm install` succeeds from the root
- [ ] `pnpm --filter hello-world dev` starts Vite and serves the room at a local URL
- [ ] Editing `main.ts` triggers HMR without a full page reload

---

## Phase 2: Shared library wiring

**User stories**: 5, 16

### What to build

Add the `shared/` directory as a pnpm workspace member with its own `package.json`. Add a trivial utility function. Verify the `@shared` alias (already configured in Phase 1's root Vite config) resolves correctly. Import the utility from the hello-world room and verify it works in both dev mode and production build.

### Acceptance criteria

- [ ] `shared/` exists at the repo root with its own `package.json` and is a pnpm workspace member
- [ ] `shared/` contains at least one utility module
- [ ] `rooms/hello-world/` imports from `@shared` and uses it in its output
- [ ] The import resolves correctly in dev mode (`pnpm --filter hello-world dev`)
- [ ] The import resolves correctly in a production build (`vite build`)
- [ ] TypeScript intellisense works for `@shared` imports in the editor

---

## Phase 3: Room auto-detection

**User stories**: 7, 9, 15

### What to build

A scanner module that reads the `rooms/` directory, inspects each room's `package.json` (if present) and source files, and produces structured metadata: room name (from directory name), detected tech stack tags (e.g. "react", "three.js", "vanilla"), and any other inferable properties. Detection checks `package.json` dependencies first (direct + dev), then falls back to scanning import statements in source files. Rooms with no framework deps default to "vanilla". This module is consumed by the dashboard backend in Phase 4.

### Acceptance criteria

- [ ] Scanner reads `rooms/` and returns a list of room metadata objects
- [ ] A room with React in its dependencies is tagged "react"
- [ ] A room with `three` in its dependencies is tagged "three.js"
- [ ] A room with only `.html` + `.js`/`.ts` files and no framework deps is tagged "vanilla"
- [ ] An empty `rooms/` directory returns an empty list
- [ ] A deleted room no longer appears in scan results
- [ ] All detection logic is covered by Vitest tests

---

## Phase 4: Dashboard MVP

**User stories**: 2, 3, 13

### What to build

A Vite-powered web app in `dashboard/` with a thin Node.js backend. The backend provides a JSON API that uses the scanner from Phase 3 to return room metadata, and spawns/stops per-room Vite dev servers on demand (dynamic port assignment, tracked in memory). The frontend renders a grid of placeholder room cards (name + tags). Clicking a card triggers the backend to start the room's dev server and opens a live iframe preview. When no rooms exist, it shows a helpful empty state. The dashboard is a pnpm workspace member, started via `pnpm dashboard`.

### Acceptance criteria

- [ ] `dashboard/` is a Vite app registered as a pnpm workspace package
- [ ] Dashboard backend exposes a JSON API for room metadata
- [ ] Dashboard backend can spawn a room's Vite dev server on demand and return its port
- [ ] Rooms appear as placeholder cards in a grid layout with name and tech tags
- [ ] Clicking a card spawns the room's dev server and shows a live iframe preview
- [ ] When `rooms/` is empty, the dashboard shows an empty state with guidance
- [ ] Dashboard runs via `pnpm dashboard`

---

## Phase 5: Multi-framework support

**User stories**: 4, 10

### What to build

Add a second room using React (e.g. `rooms/react-counter/`) to prove that multiple frameworks coexist. The React room has its own `vite.config.ts` that adds the React plugin via `mergeConfig`. Verify that both the vanilla and React rooms serve correctly, build independently, and are detected with the correct tags by the scanner. Confirm both appear in the dashboard.

### Acceptance criteria

- [ ] `rooms/react-counter/` exists with its own `vite.config.ts`, `tsconfig.json`, `package.json`, and a working React component
- [ ] Room's `vite.config.ts` adds `@vitejs/plugin-react` via `mergeConfig` with root config
- [ ] Both `rooms/hello-world/` (vanilla) and `rooms/react-counter/` (React) serve in dev mode
- [ ] The scanner detects "vanilla" for hello-world and "react" for react-counter
- [ ] Both rooms appear correctly in the dashboard
- [ ] HMR works in the React room

---

## Phase 6: Independent room builds

**User stories**: 8, 18

### What to build

Wire `vite build` to produce a self-contained static output directory per room. Vite bundles everything — `@shared` source and its transitive dependencies are all inlined. Add a `build-all` script that builds every room in parallel. Test build integrity with Vitest.

### Acceptance criteria

- [ ] A single room can be built via `pnpm --filter <room> build`
- [ ] Built output is a self-contained directory with no external references
- [ ] `@shared` imports and their transitive deps are fully resolved/bundled in the output
- [ ] A `build-all` root script builds all rooms in parallel
- [ ] Both vanilla and React rooms build successfully
- [ ] Built HTML is servable by a plain static file server (e.g. `npx serve dist/hello-world`)
- [ ] Build integrity is covered by Vitest tests

---

## Phase 7: Claude scaffolding skill

**User stories**: 1, 14

### What to build

A Claude Code skill registered in `.claude/skills/` that accepts a natural language description like "create a room for Three.js shader experiments" and scaffolds a fully configured room. The skill's SKILL.md contains a reference table mapping tech stacks to Vite plugins and starter templates. It creates the room directory under `rooms/`, writes `vite.config.ts` (extending root via `mergeConfig` with the right plugin), `tsconfig.json` (extending root), `package.json` with deps, `index.html`, and entry script. Runs `pnpm install` so the room is immediately runnable.

### Acceptance criteria

- [ ] Skill is registered in `.claude/skills/` and invocable in Claude Code
- [ ] SKILL.md contains a tech-to-plugin reference table
- [ ] Given a description, it creates a room directory with correct structure
- [ ] Room's `vite.config.ts` extends root and adds the correct plugin
- [ ] Room's `tsconfig.json` extends root
- [ ] `package.json` includes the appropriate framework dependencies
- [ ] `pnpm install` is run automatically after scaffolding
- [ ] The scaffolded room serves immediately via `pnpm --filter <room> dev`

---

## Phase 8: Template inheritance

**User story**: 6

### What to build

Extend the scaffolding skill to support creating a room from an existing room as a base template. When the user says something like "create a room based on shader-noise", the skill copies the base room's file structure into a new directory and lets the user diverge from there. The new room is independent — changes to it don't affect the original.

### Acceptance criteria

- [ ] Scaffolding skill accepts a base room reference (e.g. "based on hello-world")
- [ ] New room is created as a copy of the base room's files
- [ ] New room has its own `package.json` with an independent name
- [ ] Changes to the new room do not affect the base room
- [ ] The inherited room serves and builds correctly

---

## Phase 9: Dashboard polish

**User stories**: 9, 12

### What to build

Refine the dashboard into a polished experience. Add tag-based filtering so you can narrow rooms by tech stack. Implement single-room dev mode via `pnpm --filter <room> dev` (already works from Phase 1, just ensure it's documented). Polish the grid layout to be responsive and visually clean.

### Acceptance criteria

- [ ] Dashboard supports filtering rooms by clicking on tags
- [ ] Tag filters can be combined (e.g. show only "react" + "three.js" rooms)
- [ ] `pnpm --filter <room> dev` is documented as the single-room dev command
- [ ] Dashboard grid is responsive across viewport sizes
- [ ] Room cards have consistent, clean styling
