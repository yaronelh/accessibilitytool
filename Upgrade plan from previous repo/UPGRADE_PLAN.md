# Accessibility Upgrade Plan

## Purpose

This document turns the current repo observations into a practical upgrade roadmap for the `accessibility` library.

It covers:

- package and tooling upgrades
- source-code restructuring
- component and feature modernization
- security hardening
- command and workflow cleanup
- testing and release process improvements
- UI and appearance upgrades

This plan is based on the current repo state documented in:

- [CODE_OVERVIEW.md](/home/yaron/accessibilitytool/accessibilitytool/CODE_OVERVIEW.md)
- [SECURITY_REPORT.md](/home/yaron/accessibilitytool/accessibilitytool/SECURITY_REPORT.md)
- [MALICIOUS_CODE_REVIEW.md](/home/yaron/accessibilitytool/accessibilitytool/MALICIOUS_CODE_REVIEW.md)
- [SUSPICIOUS_PATTERNS_REPORT.md](/home/yaron/accessibilitytool/accessibilitytool/SUSPICIOUS_PATTERNS_REPORT.md)

## Executive Direction

The right target is not a cosmetic cleanup. The library should move from:

- one large imperative runtime class
- weakly typed configuration and DOM generation
- permissive extension points
- stale tooling and sparse verification

to:

- a typed, modular browser library
- safer config handling
- explicit rendering and state boundaries
- maintained tooling
- testable and releasable build workflows

If summarized in one line:

Upgrade this from a useful legacy widget into a maintainable, typed, secure library with a cleaner UX.

## Current State Summary

### What is working

- the library is small and understandable
- the feature set is clear and useful
- the package already builds to ESM and CommonJS
- the runtime has no obvious malicious behavior
- the public entry point is simple: `new Accessibility(options)`

### Main weaknesses

- large monolithic logic in [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts)
- heavy use of `any`
- reliance on `window.event`
- unsafe dynamic DOM and CSS generation from config
- remote font loading by default
- no real test suite
- deprecated linting stack
- fragile UI injection and styling model

## Upgrade Goals

### Goal 1

Stabilize the engineering foundation.

### Goal 2

Reduce security risk from permissive configuration and dynamic injection.

### Goal 3

Modernize the build, test, and release toolchain.

### Goal 4

Improve the toolbar’s appearance, accessibility, and configurability without breaking the simple integration model.

## Recommended Delivery Phases

## Phase 1: Foundation And Tooling

### Objectives

- update core dependencies
- replace deprecated tooling
- establish automated verification
- keep runtime behavior mostly the same

### Package upgrades

As checked against npm on March 23, 2026, these are the recommended dependency targets:

| Package | Current | Target |
|---|---:|---:|
| `@types/jest` | `29.5.14` | `30.0.0` |
| `@types/node` | `22.15.25` | `25.5.0` |
| `prettier` | `3.5.3` | `3.8.1` |
| `ts-loader` | `9.5.2` | `9.5.4` |
| `typescript` | `5.8.3` | `6.0.2` |
| `vite` | `6.3.5` | `8.0.2` |

Packages to remove rather than preserve:

- `tslint`
- `tslint-loader`

Packages that can stay if still needed:

- `source-map-loader`
- `npm-check`

### Tooling changes

Replace:

- `TSLint` with `ESLint`

Add:

- `eslint`
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`
- optionally `eslint-config-prettier`
- optionally `vitest`
- optionally `jsdom`

### Command changes

Replace the current minimal scripts with a safer, more complete set:

```json
"scripts": {
  "build": "npm run clean && tsc -p tsconfig.json && tsc -p tsconfig.cjs.json",
  "clean": "rm -rf dist dist-cjs coverage",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "lint": "eslint .",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "playground": "vite playground",
  "prepack": "npm run lint && npm run typecheck && npm run test && npm run build"
}
```

### Phase 1 acceptance criteria

- TypeScript 6 builds cleanly
- ESLint replaces TSLint
- at least smoke tests exist for constructor, menu injection, and destroy flow
- CI-equivalent local commands exist for lint, typecheck, test, and build

## Phase 2: Code Architecture Refactor

### Objectives

- split the large runtime into focused modules
- eliminate legacy event handling
- reduce `any`
- preserve public API compatibility where practical

### Proposed module layout

Refactor toward a structure like:

- `src/core/accessibility.ts`
- `src/core/state.ts`
- `src/core/session.ts`
- `src/core/hotkeys.ts`
- `src/dom/render-icon.ts`
- `src/dom/render-menu.ts`
- `src/dom/render-dialog.ts`
- `src/features/text-size.ts`
- `src/features/text-spacing.ts`
- `src/features/line-height.ts`
- `src/features/invert-colors.ts`
- `src/features/gray-hues.ts`
- `src/features/underline-links.ts`
- `src/features/big-cursor.ts`
- `src/features/reading-guide.ts`
- `src/features/text-to-speech.ts`
- `src/features/speech-to-text.ts`
- `src/features/disable-animations.ts`
- `src/utils/dom.ts`
- `src/utils/css.ts`
- `src/utils/storage.ts`
- `src/types/*.ts`

### Core refactors

#### Refactor `Accessibility`

Current issue:

- [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts) mixes construction, rendering, state management, DOM manipulation, feature logic, persistence, hotkeys, and browser API integration

Target:

- keep `Accessibility` as the public facade
- move implementation into internal services/modules
- keep `menuInterface` only as a compatibility layer at first

#### Replace `window.event`

Current issue:

- event handling depends on global browser state rather than explicit arguments

Target:

- pass event objects explicitly into handlers
- eliminate reliance on implicit globals

#### Remove broad `any` usage

Target:

- type speech recognition wrappers
- define typed config schemas
- type DOM helper inputs and outputs
- replace `any` on `customFunctions.id`, menu actions, and state objects with narrow types

### Phase 2 acceptance criteria

- no `window.event`
- `noImplicitAny` is meaningfully enforced rather than bypassed
- `src/main.ts` becomes a thin orchestration layer
- feature code is split into isolated units

## Phase 3: Security Hardening

### Objectives

- close the main trust-boundary gaps
- keep customization, but make it safer by default

### Highest-priority fixes

#### 1. Constrain custom DOM generation

Current issue:

- `Common.jsonToHtml()` can create arbitrary tags and attributes from config

Upgrade plan:

- replace open-ended `IJsonToHtml` with a restricted schema for known icon content
- allow only safe nodes such as `span`, `i`, `svg`, `path`, `#text`
- reject `on*` attributes
- reject executable tags and navigation-sensitive tags

#### 2. Escape or remove dynamic CSS string interpolation

Current issue:

- values for custom icons and IDs are interpolated into injected CSS

Upgrade plan:

- centralize CSS escaping
- avoid raw selector/value interpolation
- prefer DOM attributes and direct node content over generated pseudo-element CSS when possible

#### 3. Sandbox iframe modals

Current issue:

- custom iframe modals accept arbitrary URLs without restrictions

Upgrade plan:

- require `https:`
- add optional `allowedIframeOrigins`
- set `sandbox`
- set `referrerpolicy`
- document that iframe URLs are trusted integrator input only

#### 4. Scope persistence

Current issue:

- `Storage.clear()` clears all origin `localStorage`

Upgrade plan:

- remove `clear()`
- keep only namespaced get/set/remove methods
- use a namespaced key such as `accessibility:session:v1`

#### 5. Make remote font loading opt-in

Current issue:

- default runtime reaches out to Google Fonts

Upgrade plan:

- default to bundled local icons or emoji mode
- allow remote fonts only by explicit config
- document CSP expectations

### Additional security upgrades

- document all trusted-only option fields
- add runtime validation for `customFunctions`, `iframeModals`, and icon config
- reduce global exposure by making `window.Accessibility` optional or legacy-only

### Phase 3 acceptance criteria

- no arbitrary tag creation from default public config
- no raw CSS injection from unsanitized option values
- iframe modals are sandboxed and validated
- storage is namespaced only

## Phase 4: UX And Appearance Refresh

### Objectives

- improve visual polish
- improve keyboard and screen-reader usability
- make the UI feel intentionally designed rather than purely utilitarian

### Current UI issues

- layout and styling are generated from a very large CSS string
- iconography depends on Material Icons or emoji fallback
- visual design is functional but dated
- focus behavior and tab management are fragile
- the modal and button states are only lightly structured

### Recommended appearance upgrades

#### Visual system

- define a cohesive token set using CSS custom properties
- ship one clean default theme and one high-contrast theme
- use a more deliberate font stack that does not depend on Google Fonts
- improve spacing, sizing rhythm, and icon alignment
- replace ad hoc icon styling with inline SVG or bundled assets

#### Menu layout

- move from a generic long list to grouped sections:
  - Text
  - Visual
  - Reading
  - Input
  - Motion
- make groups collapsible only if needed
- improve button active states and focus rings
- add clearer labels for speech-rate states

#### Accessibility of the accessibility tool

- ensure dialog semantics are correct
- improve focus trapping and focus return
- use `aria-pressed` for toggle buttons
- expose current values for text size, spacing, and line height
- ensure all interactive elements are reachable and understandable with keyboard only

#### Motion and transitions

- keep motion minimal and functional
- use short opacity and transform transitions only where they clarify state
- ensure the toolbar’s own animations obey the “disable animations” mode

#### Responsive behavior

- replace `25vw` width assumptions with clamped responsive sizing
- improve mobile spacing and touch targets
- support narrow viewports without clipped controls

### Suggested design direction

- light neutral background
- crisp borders and focus outlines
- inline SVG icons
- grouped controls with strong labels
- no dependency on remote icon fonts

### Phase 4 acceptance criteria

- menu is visually consistent on desktop and mobile
- focus states are explicit
- all toggle states are perceivable without color alone
- no remote icon font is required for a polished default appearance

## Phase 5: Packaging, Compatibility, And Release Discipline

### Objectives

- modernize packaging while preserving user trust
- reduce accidental breakage during upgrades

### Packaging decisions

#### ESM and CJS

Keep both initially because the repo already supports both:

- `dist/`
- `dist-cjs/`

But plan to evaluate whether CommonJS is still required by actual consumers before keeping it long term.

#### Exports

Keep:

- `import`
- `require`
- `types`

Add clarity around:

- supported Node versions for build-time tooling
- browser support policy

#### Published files

Add:

- changelog
- upgrade notes
- security notes

### Release process

Before each release:

1. lint
2. typecheck
3. test
4. build
5. smoke-test the playground
6. inspect the packed tarball with `npm pack`

### Recommended commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm pack
```

### Phase 5 acceptance criteria

- package artifacts match source expectations
- release process is scripted and repeatable
- documentation includes upgrade notes for consumers

## Component-Level Upgrade Plan

## `Accessibility`

Actions:

- reduce responsibilities
- convert to orchestrator/facade
- remove direct feature implementations from the class

## `MenuInterface`

Actions:

- keep as compatibility wrapper
- internally delegate to typed feature services
- normalize toggle signatures so they do not rely on optional `destroy` conventions in inconsistent ways

## `Common`

Actions:

- split into focused utilities:
  - DOM rendering
  - CSS helpers
  - font loading
  - media helpers
- remove dangerous generic helpers such as unrestricted DOM creation

## `Storage`

Actions:

- reduce to a namespaced session store
- remove broad clear behavior
- add storage availability guards where used

## Playground

Actions:

- convert from a smoke example to a real manual QA surface
- add examples for:
  - standard usage
  - no DOM injection mode
  - custom functions
  - iframe modal restrictions
  - theme overrides

## Recommended Command-Level Changes

### Remove

- TSLint-based workflows
- broad “refresh everything” habits as the default maintenance path

### Add

- `lint`
- `typecheck`
- `test`
- `prepack`

### Keep but tighten

- `build`
- `playground`

### Nice-to-have

- `test:browser`
- `test:accessibility`
- `release:check`

## Suggested Testing Strategy

### Unit tests

Cover:

- option merging
- module ordering
- session restore
- hotkey dispatch
- feature toggling state

### DOM tests

Cover:

- icon injection
- menu injection
- dialog behavior
- destroy cleanup
- aria attributes and keyboard behavior

### Security-focused tests

Cover:

- rejected unsafe tag names
- rejected unsafe attributes
- CSS escaping
- iframe URL validation
- storage namespacing

### Manual QA checklist

- desktop Chrome
- Firefox
- Safari if targeted
- mobile responsive layout
- keyboard-only flow
- screen-reader smoke pass

## Suggested Breaking-Change Strategy

### Minor-version safe changes

- add new scripts
- add tests
- internal refactors
- make remote icon loading configurable
- improve default styles while preserving CSS variable compatibility where possible

### Major-version changes

- remove or deprecate unrestricted `IJsonToHtml`
- remove `window.Accessibility`
- change default icon system
- change public customization hooks
- drop CommonJS if no longer needed

## Concrete Implementation Order

1. Update dependencies and replace TSLint with ESLint.
2. Add `typecheck`, `lint`, `test`, and `prepack`.
3. Add smoke tests around constructor, render, toggle, and destroy.
4. Refactor `Accessibility` into smaller internal modules without changing public API.
5. Remove `window.event` and reduce `any`.
6. Lock down DOM generation and CSS injection inputs.
7. Sandbox and validate iframe modals.
8. Replace remote icon font dependency with bundled SVG or emoji-first defaults.
9. Refresh the toolbar layout and accessibility semantics.
10. Publish with updated docs and a migration guide.

## Recommended End State

When the upgrade is complete, this tool should have:

- a typed, modular codebase
- safer customization boundaries
- a modern lint/type/test/build pipeline
- a cleaner published package
- a better-looking and more accessible toolbar
- less reliance on legacy browser behavior
- a clearer path for future maintenance

## Final Recommendation

Do not approach this as a small dependency bump.

The best outcome is a staged modernization:

- Phase 1 for tooling and package health
- Phase 2 for architecture
- Phase 3 for security hardening
- Phase 4 for UX and appearance
- Phase 5 for packaging and release discipline

That path preserves the useful parts of the library while addressing the main reasons it currently feels fragile.
