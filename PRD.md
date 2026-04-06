# PRD: playground.sh

## Problem Statement

When discovering interesting frontend technologies — shaders, new UI libraries, component patterns, creative coding tools — there's no frictionless way to spin up an isolated sandbox and start experimenting. Each experiment currently requires manually bootstrapping a project, choosing a bundler, installing dependencies, and wiring up a dev server. This friction kills momentum and discourages experimentation.

There's also no central place to revisit past experiments, share them, or compose them together.

## Solution

A local-first, technology-agnostic playground hub called **playground.sh**. It consists of:

- A **`rooms/` directory** where each room is a self-contained sandbox for one experiment (a shader, a React component, a vanilla JS sketch, etc.)
- A **web dashboard** that auto-discovers rooms, shows live iframe previews, and lets you open any room in its own tab for full interaction
- **Vite as the universal bundler** — every room runs on Vite regardless of tech stack (React, Svelte, Three.js, vanilla, etc.)
- A **shared library** (`shared/`) for reusable utilities, components, and helpers that any room can import
- **Claude-driven room creation** — describe what you want to try in natural language and the system scaffolds a fully configured room with deps installed and starter code ready
- **Shareable static builds** — any room can be built into a standalone static bundle you can zip or host anywhere

## User Stories

1. As a developer, I want to say "create a room for Three.js shader experiments" and get a fully configured sandbox, so that I can start coding immediately without setup friction
2. As a developer, I want to open a web dashboard and see all my rooms listed with live previews, so that I can quickly find and revisit past experiments
3. As a developer, I want to click a room's preview to open it full-screen in its own tab with hot reload, so that I can work on it interactively
4. As a developer, I want each room to be fully isolated with its own dependencies, so that experiments don't interfere with each other
5. As a developer, I want to import shared utilities from a common `shared/` directory, so that I can reuse code across rooms without copy-pasting
6. As a developer, I want to create a new room that inherits the setup of an existing room (template inheritance), so that I can iterate on ideas incrementally
7. As a developer, I want the system to auto-detect what tech stack a room uses (React, Svelte, vanilla, Three.js, etc.) without manual config, so that metadata stays in sync with reality
8. As a developer, I want to build any room into a self-contained static bundle, so that I can share it with others or host it publicly
9. As a developer, I want the dashboard to show auto-detected tags (e.g. "react", "three.js", "shader") for each room, so that I can filter and find experiments by technology
10. As a developer, I want Vite to handle all rooms regardless of framework, so that I don't need to learn or configure different build tools per experiment
11. As a developer, I want hot module replacement to work in every room, so that I see changes instantly while developing
12. As a developer, I want to spin up a single room's dev server without starting the entire dashboard, so that I can focus on one experiment
13. As a developer, I want the dashboard to work even when no rooms exist yet, showing a clear empty state and guidance on creating the first room
14. As a developer, I want room creation to handle dependency installation automatically, so that I never have to manually run npm/yarn/pnpm install
15. As a developer, I want to delete a room by simply removing its directory, with the dashboard reflecting the change automatically
16. As a developer, I want the shared library to be aliased as `@shared` in Vite, so that imports are clean and consistent across all rooms
17. As a developer, I want to be able to try things that don't need a framework at all (plain HTML + CSS + JS), so that the system doesn't force unnecessary complexity
18. As a developer, I want each room's static build to be truly standalone (no references to other rooms or the dashboard), so that it works when deployed in isolation

## Implementation Decisions

### Module 1 — Room Runtime
- Each room lives under `rooms/<room-name>/` with at minimum an `index.html` entry point
- Vite serves each room as a separate entry in dev mode
- Rooms can use any framework Vite supports via plugins (React, Svelte, Vue, vanilla, etc.)
- Each room manages its own `package.json` for room-specific dependencies
- A room can optionally inherit from another room's template by referencing it during creation — the scaffolder copies the base room's structure as a starting point

### Module 2 — Shared Library
- Top-level `shared/` directory at the repo root
- Aliased as `@shared` in Vite config, available to all rooms
- Contains reusable utilities, shader helpers, math functions, UI primitives, etc.
- No build step of its own — consumed directly as source by rooms via Vite's alias resolution

### Module 3 — Dashboard App
- A Vite-powered web app (framework choice at Claude's discretion — lightweight is the priority)
- Scans the `rooms/` directory to discover rooms
- Auto-detects metadata: tech stack (from imports/dependencies), name (from directory name), tags
- Renders a grid of room cards with small live iframe previews
- Clicking a card opens the room's dev server URL in a new tab
- Handles empty state gracefully

### Module 4 — Room Scaffolding (Claude Skill)
- A Claude Code skill that replaces the need for a CLI
- Accepts natural language descriptions of what you want to try
- Determines the appropriate tech stack, creates the room directory, writes starter files, installs dependencies
- Can scaffold from scratch or from an existing room as a template
- Registered in `.claude/skills/`

### Module 5 — Build System
- Each room can be built independently: `vite build` targeting the room's entry point
- Output is a self-contained static directory (HTML + JS + CSS + assets) with no external references
- A build-all script can produce builds for every room in parallel
- Built output can be zipped or deployed to any static host

### Architecture Decisions
- **Monorepo with Vite** — the root `vite.config.ts` handles shared aliases and plugin registration; rooms may extend or override config locally
- **pnpm workspaces** — for managing per-room dependencies efficiently with a shared `node_modules` hoist
- **No room manifest files** — metadata is inferred, not declared, to keep friction minimal
- **Convention over configuration** — `rooms/` directory, `index.html` entry, `@shared` alias are all fixed conventions

## Testing Decisions

Tests should verify external behavior, not implementation details. Focus on the contract each module exposes.

### Modules to test:

**Auto-detection (Module 3 — scanner/metadata inference):**
- Given a room directory with React imports, it should detect "react" as a tag
- Given a room with `three` in dependencies, it should detect "three.js"
- Given a room with only `.html` + `.js` files, it should detect "vanilla"
- Given an empty `rooms/` directory, it should return an empty list
- Given a room that was just deleted, it should no longer appear in results

**Build system (Module 5):**
- Given a valid room, `vite build` should produce a self-contained output directory
- The built output should have no imports referencing `@shared` or other rooms (all resolved/bundled)
- A vanilla room and a React room should both build successfully
- Built HTML should be servable by a plain static file server

### Prior art for tests:
- Vitest is the natural choice given the Vite ecosystem — fast, native ESM, compatible with the project's toolchain

## Out of Scope

- Deployment infrastructure (CI/CD pipelines, hosting setup) — builds are shareable but deployment is manual
- User authentication or multi-user collaboration
- Server-side rendering or SSR-specific room types
- Mobile-specific testing or responsive design tooling for the dashboard
- Package publishing (rooms are not npm packages)
- Version control integration (git setup, branching strategies for rooms)

## Further Notes

- The name `playground.sh` uses `.sh` as a stylistic choice evoking a shell/sandbox vibe, not as a file extension
- The Claude-driven scaffolding skill is a first-class feature, not an afterthought — it's the primary way rooms get created
- The system should degrade gracefully: if Vite plugins for a framework aren't installed, the error should be clear and actionable
- Room isolation is logical (separate directories, separate deps) but not containerized — all rooms share the same Node.js runtime
- The `shared/` library should start empty and grow organically as patterns emerge across rooms
