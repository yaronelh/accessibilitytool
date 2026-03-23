# Security Posture Report

## Scope

This report covers a static review of the repository source code in:

- [package.json](/home/yaron/accessibilitytool/accessibilitytool/package.json)
- [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts)
- [src/menu-interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts)
- [src/common.ts](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts)
- [src/storage.ts](/home/yaron/accessibilitytool/accessibilitytool/src/storage.ts)

The review focused on:

- DOM injection and XSS exposure
- unsafe use of user-controlled configuration
- browser API usage
- storage handling
- third-party resource loading
- extension points that can expand attack surface

This was a code review only. I did not run dependency vulnerability scans because the local environment does not currently have `tsc` installed, which strongly suggests dependencies are not installed, and network-backed audit tooling was not used in this pass.

## Executive Summary

Overall posture: `moderate risk`

The repo is small and does not expose a server-side attack surface. Most risk comes from the fact that this library:

- dynamically injects DOM and CSS into arbitrary pages
- accepts rich configuration objects that can define custom HTML-like nodes, CSS content, URLs, and callbacks
- exposes extension points with little validation or sanitization

There is no obvious remote code execution path by default, but there are several places where untrusted configuration could become a code injection or policy-bypass problem if a consuming application passes user-controlled data into this library.

## Findings

### 1. Untrusted configuration can become arbitrary DOM injection

Severity: `high`

Evidence:

- [src/common.ts:42](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L42)
- [src/common.ts:45](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L45)
- [src/main.ts:48](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L48)

Details:

`Common.jsonToHtml()` creates any element type specified by the input object and applies all attributes with `setAttribute()`. The `Accessibility` constructor allows callers to provide custom `imgElem`, `closeIconElem`, and `resetIconElem` structures via options. Those are then converted directly into real DOM nodes.

Impact:

- if a consumer passes untrusted JSON into these options, the library can create attacker-chosen elements and attributes
- this can lead to DOM XSS, script gadget creation, event handler injection, malicious external resource loads, or hostile navigation depending on the browser element and attribute combination

Why this matters:

The library itself may be intended for trusted integrator input only, but the code currently enforces no trust boundary. If a host app maps CMS content, tenant configuration, or query-string data into these option fields, the library becomes a DOM injection sink.

Recommended remediation:

- treat all `IJsonToHtml` option fields as trusted-only and document that explicitly
- preferably replace arbitrary element creation with a strict allowlist of safe tags and attributes
- reject event-handler attributes such as `on*`
- reject executable or navigation-sensitive tags such as `script`, `iframe`, `object`, `embed`, `link`, and `style` in icon element configuration
- if rich HTML customization is truly needed, sanitize it before conversion

### 2. CSS injection via unsanitized custom icon and identifier values

Severity: `medium`

Evidence:

- [src/main.ts:1046](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1046)
- [src/main.ts:1083](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1083)
- [src/common.ts:61](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L61)

Details:

For `iframeModals` and `customFunctions`, the code interpolates `icon`, `emoji`, and `cf.id` directly into generated CSS strings and then injects them into a `<style>` tag. There is no escaping for quotes, backslashes, CSS delimiters, or selector-sensitive characters.

Impact:

- malformed or attacker-controlled values can break the stylesheet
- hostile CSS can be injected into the page
- the widget can be used to alter or obscure page content beyond intended behavior
- in some application contexts, CSS injection can contribute to phishing-style UI redressing or data leakage through CSS-based side channels

Recommended remediation:

- escape CSS string values before interpolation
- restrict `icon`, `emoji`, and `id` to conservative character sets
- avoid building selectors from raw values where possible
- prefer DOM properties or dataset flags over dynamic CSS source generation for per-button icon content

### 3. Arbitrary iframe embedding without origin restrictions or sandboxing

Severity: `medium`

Evidence:

- [src/main.ts:1030](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1030)
- [src/menu-interface.ts:555](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts#L555)
- [src/menu-interface.ts:557](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts#L557)

Details:

The `iframeModals` feature allows any supplied `iframeUrl` to be stored in a data attribute and then loaded into an unsandboxed `<iframe>` inside a modal dialog.

Impact:

- a consuming application can unintentionally embed hostile origins
- embedded pages can attempt social engineering, clickjacking-style UX tricks inside the modal, or abuse user trust
- without a `sandbox` attribute, the embedded page receives its normal iframe capabilities

Recommended remediation:

- treat iframe URLs as trusted-only input
- add an allowlist for supported origins
- set a restrictive `sandbox` attribute unless specific capabilities are required
- consider setting `referrerpolicy`
- consider validating that only `https:` URLs are accepted

### 4. Default external font load introduces privacy and supply-chain exposure

Severity: `low`

Evidence:

- [src/main.ts:140](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L140)
- [src/common.ts:103](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L103)
- [src/common.ts:116](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L116)

Details:

By default, the library loads Material Icons from Google Fonts at runtime. This is not a direct code execution flaw, but it adds:

- a third-party dependency in the browser path
- metadata leakage to an external service
- operational dependence on remote CSS/font delivery

Impact:

- privacy-sensitive deployments may not allow this behavior
- a strict CSP may block the library by default
- compromise or unexpected behavior in the third-party asset path affects widget rendering

Recommended remediation:

- default to bundled local assets or emoji fallback
- document the required CSP directives clearly
- make remote font loading opt-in rather than opt-out

### 5. Storage helper can clear all origin localStorage

Severity: `low`

Evidence:

- [src/storage.ts:23](/home/yaron/accessibilitytool/accessibilitytool/src/storage.ts#L23)

Details:

`Storage.clear()` calls `window.localStorage.clear()`, which removes every key for the current origin, not just this library’s state.

Impact:

- if this method is called by future code or host applications, it could erase unrelated application state
- this is primarily an integrity and operational-risk issue, not a confidentiality issue

Recommended remediation:

- remove `clear()` entirely if not needed
- or scope deletion to library-owned keys only

### 6. Global exposure expands integration-time attack surface

Severity: `low`

Evidence:

- [src/main.ts:1858](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1858)

Details:

The library assigns itself to `window.Accessibility`. This is common for browser libraries, but it makes the constructor globally reachable by any other script on the page.

Impact:

- on pages that already have XSS elsewhere, the library becomes another powerful DOM-manipulation primitive
- increases the chance of naming collisions or unintended use by third-party scripts

Recommended remediation:

- keep this export only for backwards compatibility if required
- prefer module-only consumption
- document that global exposure is intentional and optional

## Additional Observations

### Browser API use

Speech recognition and speech synthesis are used appropriately behind capability checks:

- [src/main.ts:300](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L300)
- [src/main.ts:307](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L307)
- [src/main.ts:1516](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1516)
- [src/main.ts:1560](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1560)

This is a reasonable posture, though these features still expand the browser permissions surface and should be considered optional.

### `innerHTML` usage

There is a call to clear dialog content with:

- [src/menu-interface.ts:518](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts#L518)

That specific use is not dangerous by itself because it writes an empty string. The more relevant risk is the unsandboxed iframe that is appended afterward.

### `outerHTML` usage

The widget injects a static SVG via:

- [src/main.ts:1101](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1101)

This is not currently sourced from user input, so it is not an immediate XSS issue. It is still a fragile pattern and should stay limited to static content only.

## Attack Surface Summary

Primary trust boundaries:

- `new Accessibility(options)` input
- `iframeModals`
- `customFunctions`
- `icon.*Elem` JSON definitions
- runtime CSS injection

Primary browser-side capabilities:

- DOM mutation
- style injection
- localStorage persistence
- speech synthesis
- speech recognition
- remote font fetching
- iframe embedding

The repo is safest when all option data is trusted application code. The posture drops noticeably if any of these options are sourced from user-managed content.

## Prioritized Remediation Plan

### Priority 1

- add explicit documentation that all structured option inputs are trusted-only unless sanitized by the caller
- add validation/allowlists around `IJsonToHtml` element types and attributes
- add escaping for CSS content interpolation and selector construction

### Priority 2

- restrict `iframeUrl` to `https:` and optionally to a caller-supplied allowlist
- add `sandbox` and `referrerpolicy` to the generated iframe
- make remote font loading opt-in or provide a local asset path

### Priority 3

- remove or narrow `Storage.clear()`
- consider dropping the `window.Accessibility` global export in a future major version
- add a dedicated security section to the README describing safe integration practices

## Suggested README Security Notes

The project should document at least these rules:

- do not pass user-controlled content into `icon.*Elem`, `iframeModals`, or `customFunctions`
- do not use untrusted values for icon names, emoji values, or custom function IDs without escaping/validation
- only load trusted iframe URLs
- if privacy matters, disable remote icon font loading and use local assets or emoji mode

## Bottom Line

This repository does not appear to contain a severe default remote exploit path on its own, but it has several unsafe trust assumptions around configuration. The main security issue is not classic server compromise; it is that the library exposes powerful browser injection primitives and currently trusts caller-provided structures too much.

If used only with trusted, hard-coded configuration, the risk is manageable. If used with tenant-admin, CMS, or user-provided configuration, the current design is not sufficiently hardened.
