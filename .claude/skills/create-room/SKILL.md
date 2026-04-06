---
name: create-room
description: Scaffold a new playground room from a natural language description. Use when the user wants to create a new room, try a library, experiment with a framework, or says "create a room for X".
---

# Create Room

Scaffold a new isolated room in `rooms/` from a natural language description.

## Process

### 1. Determine room configuration

From the user's description, determine:

- **Room name**: kebab-case, derived from the description (e.g. "Three.js shader experiments" → `shader-experiments`)
- **Tech stack**: which framework/library is needed
- **Dependencies**: what npm packages to install

Ask the user to confirm the room name if ambiguous.

### 2. Look up tech stack

Use this reference table to determine the Vite plugin and dependencies needed:

| Tech | Vite Plugin | Dependencies | Dev Dependencies |
|------|------------|--------------|------------------|
| Vanilla (HTML/JS/TS) | none | — | — |
| React | `@vitejs/plugin-react` | `react`, `react-dom` | `@vitejs/plugin-react`, `@types/react`, `@types/react-dom` |
| Svelte | `@sveltejs/vite-plugin-svelte` | — | `@sveltejs/vite-plugin-svelte`, `svelte` |
| Vue | `@vitejs/plugin-vue` | `vue` | `@vitejs/plugin-vue` |
| Three.js | none | `three` | `@types/three` |
| React + Three.js | `@vitejs/plugin-react` | `react`, `react-dom`, `three`, `@react-three/fiber` | `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `@types/three` |

For tech not in this table, check the Vite plugin ecosystem and use your best judgment.

### 3. Create the room

Create the following files under `rooms/<room-name>/`:

#### `package.json`

```json
{
  "name": "<room-name>",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

Only include `dependencies` and `devDependencies` if they have entries.

#### `vite.config.ts`

If the room needs a Vite plugin:

```ts
import { defineConfig, mergeConfig } from 'vite'
import <plugin> from '<plugin-package>'
import baseConfig from '../../vite.config'

export default mergeConfig(baseConfig, defineConfig({
  plugins: [<plugin>()],
}))
```

If vanilla (no plugin needed):

```ts
import { defineConfig, mergeConfig } from 'vite'
import baseConfig from '../../vite.config'

export default mergeConfig(baseConfig, defineConfig({}))
```

#### `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["**/*.ts"]
}
```

For React, add `"jsx": "react-jsx"` and include `"**/*.tsx"`.
For Svelte, include `"**/*.svelte"`.

#### `index.html`

Standard HTML5 boilerplate with a `<script type="module">` pointing to the entry file.

#### Entry file

A starter file (`main.ts`, `main.tsx`, `App.svelte`, etc.) with a minimal working example that renders something visible. The starter should demonstrate the tech stack — not just "hello world" but something that shows the framework/library is wired correctly (e.g. a reactive counter for React, a rotating cube for Three.js).

**Always include theme support.** Import and call `initTheme()` from `@shared/theme`:

- Vanilla: `import { initTheme } from '@shared/theme'; initTheme()` at the top of the entry file
- React: call `initTheme()` inside a `useEffect` in the root component

This adds a light/dark toggle button. Use `[data-theme="light"]` and `[data-theme="dark"]` selectors in CSS to style both modes. The theme persists across sessions via localStorage.

### 4. Install dependencies

Run `pnpm install` from the workspace root.

### 5. Confirm to the user

Tell the user:
- The room was created at `rooms/<room-name>/`
- How to run it: `pnpm --filter <room-name> dev`
- How to build it: `pnpm --filter <room-name> build`

## Template inheritance

If the user says "based on <existing-room>" or "like <existing-room>":

1. Read the existing room's files
2. Copy them to the new room directory
3. Update the `name` in `package.json`
4. Let the user know which room was used as a base

## Important conventions

- Every room MUST have `index.html` as its entry point
- Every room MUST have its own `vite.config.ts` that extends `../../vite.config` via `mergeConfig`
- Every room MUST have its own `tsconfig.json` that extends `../../tsconfig.json`
- Rooms can import from `@shared/` for shared utilities
- Room names are kebab-case directory names under `rooms/`
