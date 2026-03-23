# Changelog

All notable changes to this project should be documented in this file.

This changelog records the upgrade and review work completed in the current modernization effort.

## [Unreleased]

### Added

- Repository documentation and review reports:
  - `CODE_OVERVIEW.md`
  - `SECURITY_REPORT.md`
  - `MALICIOUS_CODE_REVIEW.md`
  - `SUSPICIOUS_PATTERNS_REPORT.md`
  - `UPGRADE_PLAN.md`
- Root test infrastructure using `vitest` and `jsdom`.
- Smoke tests covering constructor behavior, DOM injection, keyboard activation, destroy cleanup, and menu state synchronization.
- Security-focused tests covering DOM attribute sanitization, iframe URL restrictions, and session storage migration behavior.
- Internal `src/core/` modules for:
  - event target and activation handling
  - hotkey parsing and matching
  - option normalization and unsupported-feature disabling
  - session persistence and legacy session restoration
  - security escaping and iframe URL validation
- New package scripts for `lint`, `typecheck`, `test`, `test:watch`, `clean`, `format`, and `prepack`.
- ESLint configuration via `eslint.config.mjs`.
- Keyboard and accessibility improvements for the menu UI:
  - `aria-controls`, `aria-expanded`, `aria-hidden`
  - dialog labelling
  - explicit button labels
  - `Escape` to close the menu
  - focus restoration to the launcher
  - focus-visible styling
  - responsive and reduced-motion UI styling

### Changed

- Replaced deprecated TSLint-based linting with ESLint.
- Upgraded the root toolchain and supporting packages:
  - `@types/node` to `25.5.0`
  - `prettier` to `3.8.1`
  - `ts-loader` to `9.5.4`
  - `vite` to `8.0.2`
  - introduced `eslint`, `@typescript-eslint/*`, `eslint-config-prettier`, `vitest`, and `jsdom`
- Pinned `typescript` to `5.9.3` instead of `6.0.2` because the currently compatible lint/tooling stack did not install cleanly with TypeScript 6.
- Refactored `src/main.ts` to delegate option normalization, hotkeys, event handling, session persistence, and security helpers into internal modules while preserving the public `new Accessibility(options)` API.
- Replaced implicit `window.event` usage with explicit event-based activation handling.
- Updated the menu toggle and panel behavior to keep accessibility state synchronized between the launcher and the menu.
- Refreshed the injected toolbar/menu styling to improve appearance, responsiveness, focus treatment, and reduced-motion behavior without changing the public API.
- Moved session persistence from the legacy `_accessState` storage key to `accessibility:session:v1`, while preserving backward-compatible restore behavior from the old key.

### Security

- Hardened `jsonToHtml()` to strip unsafe `on*` attributes and block unsafe URL schemes such as `javascript:`.
- Escaped dynamic CSS content used for generated icon rules.
- Restricted iframe modal URLs through normalization and origin validation support.
- Added safer iframe attributes:
  - `sandbox`
  - `referrerpolicy`
  - `loading`
- Added `allowedIframeOrigins` as an optional configuration control for iframe modal origins.

### Removed

- `tslint`
- `tslint-loader`
- `tslint.json`

### Verification

- Verified repeatedly during the upgrade with:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run prepack`
  - `npm pack --dry-run --cache /tmp/accessibility-npm-cache`
- Current automated verification status after the latest UI/accessibility pass:
  - `2` passing test files
  - `10` passing tests

