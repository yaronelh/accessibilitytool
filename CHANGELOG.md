# Changelog

This file tracks versioned changes for this fork of `accessibility`.

There are no Git tags in this repository. The latest upstream version marker found in commit history is `6.1.0` at commit `1cfaa72` (`master - build version 6.1.0`).

All fork work completed after that point is recorded below as the next fork revision on top of `6.1.0`.

## [6.1.0-fork.1] - 2026-03-23

Fork maintenance and modernization release built on top of upstream `6.1.0`.

### Added

- Added repository-level documentation and review artifacts:
  - `CODE_OVERVIEW.md`
  - `SECURITY_REPORT.md`
  - `MALICIOUS_CODE_REVIEW.md`
  - `SUSPICIOUS_PATTERNS_REPORT.md`
  - `UPGRADE_PLAN.md`
- Added `CHANGELOG.md` and included it in the published package contents.
- Added a modern root test setup using `vitest` and `jsdom`.
- Added smoke tests for:
  - constructor behavior
  - DOM injection
  - keyboard activation
  - destroy cleanup
  - menu accessibility state synchronization
- Added security regression tests for:
  - DOM attribute sanitization
  - iframe URL restrictions
  - session key migration and legacy restore behavior
- Added new internal core modules under `src/core/`:
  - `event-utils.ts`
  - `hotkeys.ts`
  - `options.ts`
  - `security.ts`
  - `session.ts`
- Added new development scripts:
  - `clean`
  - `lint`
  - `typecheck`
  - `test`
  - `test:watch`
  - `format`
  - `prepack`
- Added ESLint configuration in `eslint.config.mjs`.
- Added menu accessibility and UI improvements:
  - `aria-controls`
  - `aria-expanded`
  - `aria-hidden`
  - dialog labelling
  - explicit button labels
  - `Escape` to close
  - focus return to the launcher
  - focus-visible styling
  - responsive and reduced-motion menu styling

### Changed

- Replaced the deprecated TSLint stack with ESLint.
- Upgraded root tooling and supporting dependencies:
  - `@types/node` to `25.5.0`
  - `prettier` to `3.8.1`
  - `ts-loader` to `9.5.4`
  - `vite` to `8.0.2`
  - introduced `eslint`, `@typescript-eslint/*`, `eslint-config-prettier`, `vitest`, and `jsdom`
- Kept `typescript` on `5.9.3` instead of moving to `6.0.2` because the currently compatible lint/tooling stack did not install cleanly with TypeScript 6.
- Refactored the runtime so `src/main.ts` now delegates option normalization, hotkey parsing, explicit event handling, session persistence, and security helpers to internal modules while preserving the public `new Accessibility(options)` API.
- Replaced implicit `window.event` usage with explicit event-driven activation handling.
- Updated menu toggle behavior to keep launcher/menu accessibility state synchronized.
- Refreshed the injected toolbar and menu styling to improve appearance, responsiveness, focus treatment, and reduced-motion behavior without changing the public API surface.
- Moved session persistence from the legacy `_accessState` key to `accessibility:session:v1`, while preserving backward-compatible restore behavior from the old key.
- Changed default icon behavior so the library no longer fetches remote icon fonts unless `icon.allowRemoteFonts` is explicitly enabled.

### Security

- Made remote icon font loading opt-in instead of default behavior.
- Hardened `jsonToHtml()` to strip unsafe `on*` attributes.
- Blocked unsafe URL schemes such as `javascript:` in generated DOM attributes.
- Escaped dynamic CSS content used for generated icon rules.
- Restricted iframe modal URLs through normalization and optional allowed-origin checks.
- Added safer iframe attributes:
  - `sandbox`
  - `referrerpolicy`
  - `loading`
- Added `allowedIframeOrigins` as an optional configuration control.

### Removed

- Removed `tslint`.
- Removed `tslint-loader`.
- Removed `tslint.json`.

### Verification

- Repeatedly verified during fork work with:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run prepack`
  - `npm pack --dry-run --cache /tmp/accessibility-npm-cache`
- Latest automated verification status at the time of writing:
  - `2` passing test files
  - `10` passing tests

## [6.1.0] - Upstream Pre-Fork

Latest upstream release marker found in commit history before fork maintenance began.

### Included upstream changes around the 6.1.0 line

- Fixed list and button `tabIndex` behavior that harmed accessibility and keyboard control.
- Fixed reset behavior for `lineHeight`.
- Added a `tabIndex` attribute-related improvement in the lead-up to the release.
- Included the upstream build/release commit recorded as `master - build version 6.1.0`.
