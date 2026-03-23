# Malicious Code Review

## Scope

This review was a static inspection of the repository contents, including:

- application and library source under [src/](/home/yaron/accessibilitytool/accessibilitytool/src)
- package metadata in [package.json](/home/yaron/accessibilitytool/accessibilitytool/package.json)
- lockfiles in [package-lock.json](/home/yaron/accessibilitytool/accessibilitytool/package-lock.json) and [commonjs-test/package-lock.json](/home/yaron/accessibilitytool/accessibilitytool/commonjs-test/package-lock.json)
- example and playground files under [playground/](/home/yaron/accessibilitytool/accessibilitytool/playground) and [commonjs-test/playground/](/home/yaron/accessibilitytool/accessibilitytool/commonjs-test/playground)

The goal was to determine whether there is evidence of intentionally malicious code in this repo.

## Conclusion

I did **not** find evidence of intentionally malicious code in this repository.

There are no clear signs of:

- credential theft
- covert data exfiltration
- remote command execution
- shelling out to system commands from repo code
- obfuscated payloads
- hidden install-time malware in this repo’s own package scripts
- persistence or destructive behavior aimed at the developer machine

The codebase appears consistent with a browser-side accessibility toolbar library. Most of the sensitive behaviors I found are aligned with the stated functionality of the package rather than malware.

## What I Checked

I specifically looked for:

- suspicious package lifecycle scripts such as `preinstall`, `postinstall`, or `prepare`
- use of `eval`, `Function`, `child_process`, `spawn`, `exec`, `curl`, `wget`, or similar execution primitives
- unexplained network calls or hidden outbound communication
- encoded or obfuscated payloads
- access to cookies, tokens, or browser storage for exfiltration
- hidden DOM injection meant to mislead users rather than provide documented features
- suspicious dependency metadata in lockfiles

## Findings

### 1. No suspicious package lifecycle scripts in this repo

Severity: `none`

Evidence:

- [package.json](/home/yaron/accessibilitytool/accessibilitytool/package.json)

Details:

The repo’s own npm scripts are limited to build and playground tasks:

- `build`
- `commonjs-playground`
- `playground`
- `check-packages`
- `refresh-packages`

These are ordinary development scripts. I did not find repo-owned `preinstall`, `postinstall`, or `prepare` hooks.

### 2. No dynamic code execution primitives in repo source

Severity: `none`

Evidence:

- source search across [src/](/home/yaron/accessibilitytool/accessibilitytool/src)

Details:

I did not find use of:

- `eval(...)`
- `new Function(...)`
- Node `child_process`
- shell execution from the library code

That significantly lowers the likelihood of intentionally hidden malicious execution.

### 3. No covert exfiltration logic in application code

Severity: `none`

Evidence:

- [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts)
- [src/menu-interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts)
- [src/common.ts](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts)
- [src/storage.ts](/home/yaron/accessibilitytool/accessibilitytool/src/storage.ts)

Details:

The source does interact with browser APIs, but only in ways that match the advertised accessibility features:

- `speechSynthesis` for text-to-speech
- `SpeechRecognition` or `webkitSpeechRecognition` for speech-to-text
- `localStorage` for session persistence
- remote font loading for Material Icons
- iframe rendering for custom modal content

I did not find code reading cookies, scraping credentials, sending page contents to a remote endpoint, beaconing telemetry, or creating hidden outbound channels.

### 4. Lockfile install hooks exist, but they appear normal for ecosystem dependencies

Severity: `low`

Evidence:

- [package-lock.json](/home/yaron/accessibilitytool/accessibilitytool/package-lock.json)
- [commonjs-test/package-lock.json](/home/yaron/accessibilitytool/accessibilitytool/commonjs-test/package-lock.json)

Details:

The lockfiles include packages with `hasInstallScript: true`, notably:

- `esbuild`
- `fsevents`

These are common and expected in the JavaScript ecosystem. I did not find lockfile evidence of obviously suspicious package names or unusual installer chains originating from this repo.

Important nuance:

This does **not** prove every third-party dependency is safe. It only means I did not find a repo-local sign of supply-chain malware from static lockfile inspection.

### 5. Security-sensitive behavior exists, but it looks product-related, not malicious

Severity: `informational`

Evidence:

- [src/common.ts:42](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L42)
- [src/main.ts:71](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L71)
- [src/main.ts:1030](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1030)
- [src/menu-interface.ts:555](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts#L555)
- [src/storage.ts:11](/home/yaron/accessibilitytool/accessibilitytool/src/storage.ts#L11)

Details:

The code does have several behaviors that deserve security attention:

- arbitrary DOM generation from config objects
- dynamic CSS injection
- remote font loading from Google Fonts
- custom iframe embedding
- `localStorage` persistence

These are risky if misused, but they are visible, documented, and aligned with the library’s purpose. They do not look like covert malicious behavior.

## Suspicious-Looking Items That Are Benign In Context

### Base64 data URIs

Evidence:

- [src/common.ts:13](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts#L13)
- [src/main.ts:319](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L319)

Reasoning:

These are embedded image/SVG assets for fallback pixels and cursor styling. They are not obfuscated payloads.

### `outerHTML` SVG injection

Evidence:

- [src/main.ts:1101](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1101)

Reasoning:

This is fragile and not ideal, but the SVG string is static and used to render the big cursor icon. It does not appear to conceal remote loading or script execution.

### Speech APIs

Evidence:

- [src/main.ts:1516](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1516)
- [src/main.ts:1560](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts#L1560)

Reasoning:

These APIs can look sensitive because they involve voice input and output, but here they are directly tied to documented accessibility features and are not paired with hidden upload logic.

## Residual Risks

Even though I found no malicious code, there are still review limits:

- this was a static review, not a full runtime trace
- dependencies were not installed in this environment, so I did not inspect installed package contents under `node_modules`
- I did not perform a network-monitored execution of the playground or build
- lockfiles alone cannot prove a third-party package is benign

## Recommended Next Steps If You Want Higher Confidence

1. Install dependencies in an isolated environment and run `npm ls` plus `npm audit`.
2. Inspect installed packages that declare install scripts, especially `esbuild`.
3. Run the playground with browser devtools open and verify outbound requests are limited to expected assets.
4. Build the package and inspect the emitted artifacts to confirm they match source expectations.

## Bottom Line

Within the code present in this repo, I do not see signs of intentionally malicious behavior. The code does contain some security-sensitive patterns, but they read as implementation choices for the accessibility widget, not malware.
