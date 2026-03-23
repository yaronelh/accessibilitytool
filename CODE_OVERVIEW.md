# Accessibility Code Overview

## What This Repository Is

This repository contains a small TypeScript library that injects an accessibility toolbar into a web page.

At runtime, the library:

- adds a floating accessibility icon to the page
- opens a menu with accessibility actions
- applies accessibility-related CSS and DOM changes directly to the current document
- optionally persists the user’s selected settings in `localStorage`

The main public API is the `Accessibility` class exported from [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts).

## What The Library Does

When a consumer runs:

```ts
import { Accessibility } from 'accessibility';

new Accessibility();
```

the library builds a self-contained toolbar that can provide:

- text size increase and decrease
- text spacing increase and decrease
- line height increase and decrease
- inverted colors
- grayscale mode
- underlined links
- large cursor mode
- reading guide overlay
- text-to-speech
- speech-to-text
- animation suppression
- custom iframe modal buttons
- custom function buttons

Most features work by mutating the current page’s DOM or inline styles. The package is not framework-specific; it works directly against browser APIs.

## How The Project Is Built

The package is configured as a library, not an application.

### Build outputs

The build produces two distributions:

- `dist/`: ESM output
- `dist-cjs/`: CommonJS output

This is defined in [package.json](/home/yaron/accessibilitytool/accessibilitytool/package.json):

- `main` points to `./dist-cjs/main.js`
- `module` points to `./dist/main.js`
- `exports.import` points to the ESM build
- `exports.require` points to the CommonJS build
- `types` points to `./dist/main.d.ts`

### Build command

The build script is:

```bash
npm run build
```

which runs:

```bash
rm -rf dist dist-cjs && tsc && tsc -p tsconfig.cjs.json
```

That means:

1. the existing compiled output is removed
2. TypeScript is compiled once using [tsconfig.json](/home/yaron/accessibilitytool/accessibilitytool/tsconfig.json) into `dist/`
3. TypeScript is compiled again using [tsconfig.cjs.json](/home/yaron/accessibilitytool/accessibilitytool/tsconfig.cjs.json) into `dist-cjs/`

### TypeScript configuration

[tsconfig.json](/home/yaron/accessibilitytool/accessibilitytool/tsconfig.json) builds the main ESM library:

- `module: "nodenext"`
- `moduleResolution: "nodenext"`
- `target: "ESNext"`
- `declaration: true`
- `outDir: "./dist/"`

[tsconfig.cjs.json](/home/yaron/accessibilitytool/accessibilitytool/tsconfig.cjs.json) extends the main config and overrides:

- `module: "CommonJS"`
- `moduleResolution: "node10"`
- `outDir: "./dist-cjs/"`

### Playground files

There are two lightweight example entry points:

- [playground/main.ts](/home/yaron/accessibilitytool/accessibilitytool/playground/main.ts)
- [commonjs-test/playground/main.js](/home/yaron/accessibilitytool/accessibilitytool/commonjs-test/playground/main.js)

These are simple smoke-test examples that instantiate `new Accessibility()`.

## Source Layout

### Core files

- [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts)
  The main library class, startup flow, DOM injection, session restore, hotkeys, text size/spacing/line-height logic, speech APIs, and destroy logic.
- [src/menu-interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts)
  The feature action layer. Each menu action is implemented here and delegates to the `Accessibility` instance.
- [src/common.ts](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts)
  Shared utilities for CSS injection, HTML generation from JSON, font loading, screenshot creation for GIF freezing, and simple object merging.
- [src/storage.ts](/home/yaron/accessibilitytool/accessibilitytool/src/storage.ts)
  A thin wrapper around `window.localStorage`.

### Types and interfaces

- [src/interfaces/accessibility.interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/interfaces/accessibility.interface.ts)
- [src/interfaces/menu.interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/interfaces/menu.interface.ts)
- [src/interfaces/common.interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/interfaces/common.interface.ts)

These define the public options, feature toggles, session state, and internal helper contracts.

## How It Works

### 1. Construction and option merging

`new Accessibility(options)` does the following early in the constructor:

1. creates helper instances: `Common`, `Storage`, and `MenuInterface`
2. loads `defaultOptions`
3. merges user options into the defaults with `Common.extend()`
4. ensures every module has an ordering entry
5. fills in default icon JSON nodes if the user did not supply them
6. disables unsupported features based on browser capability checks

Important browser checks include:

- speech-to-text is disabled when speech recognition is unavailable or the page is not running over HTTPS
- text-to-speech is disabled when `SpeechSynthesisUtterance` or `speechSynthesis` is unavailable

### 2. Icon strategy

The modernized fork ships with bundled local SVG defaults for the launcher, header controls, and built-in menu actions.

By default, the constructor does not load Google Fonts or any other remote icon font. If a host explicitly configures remote font sources and opts into them, the runtime can still inject those stylesheets. Otherwise it stays self-contained and falls back to local-safe behavior.

### 3. Build phase

The actual runtime setup happens in `build()` in [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts).

During `build()` the class:

- initializes transient in-memory state in `_stateValues`
- captures `document.body` and `document.documentElement`
- normalizes root font sizing when `textEmlMode` is enabled
- injects CSS for the widget and its effects
- injects the floating icon
- injects the menu markup
- injects optional text-to-speech and speech-to-text menu items
- registers click, keyup, and hotkey listeners
- restores persisted session state if enabled

### 4. DOM generation model

The project does not use templates or a UI framework. Instead, it builds DOM nodes from JSON-like objects using `Common.jsonToHtml()`.

That pattern is used for:

- the floating icon
- the full menu structure
- text-to-speech controls
- iframe modal dialog content

This keeps the library self-contained and easy to inject into any page, but it also means most UI is assembled imperatively in TypeScript.

### 5. CSS injection model

The library injects styles dynamically using `Common.injectStyle()`.

There are two categories of CSS:

- base widget CSS: menu layout, icon styling, modal styling, custom cursor, reading guide, etc.
- feature CSS: temporary styles added by specific actions like underline links, speech-to-text microphone indicator, or animation disabling

Injected artifacts are tracked in `Common.deployedObjects`, a `Map` keyed by selectors. `destroy()` uses that registry to remove injected nodes.

### 6. Menu action dispatch

The menu’s buttons use `data-access-action` attributes. When a button is clicked or activated with Enter:

1. `Accessibility.addListeners()` captures the event
2. `Accessibility.invoke()` reads the action name
3. the matching method is called on `menuInterface`

That makes [src/menu-interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts) the main behavior layer for feature toggles.

### 7. Feature behavior

#### Text size

Text size changes are handled in `alterTextSize()`.

There are three modes:

- `textPixelMode`: iterates over many page elements and changes pixel font sizes directly
- `textEmlMode`: changes the root HTML font size percentage
- fallback mode: adjusts the body font size using the current computed unit

The default path is effectively the root font-size percentage strategy.

#### Text spacing

Text spacing changes are handled in `alterTextSpace()`.

Depending on configuration, it either:

- updates element-level `wordSpacing` and `letterSpacing` in pixels
- or updates spacing on the body using computed values

Original values are cached in `data-init-word-spacing` and `data-init-letter-spacing` attributes so reset can restore them.

#### Line height

Line height changes are handled in `alterLineHeight()`.

The library iterates over page elements, skips its own menu subtree, and adjusts line height either:

- in pixels
- or as a percentage derived from font size

Original values are preserved in `data-init-line-height`.

#### Visual toggles

Several features are simple toggles with direct DOM/CSS effects:

- `invertColors()`: sets `html.style.filter = 'invert(1)'`
- `grayHues()`: sets grayscale filter styles
- `underlineLinks()`: injects CSS forcing underlines on `body a`
- `bigCursor()`: toggles an `_access_cursor` class on the root HTML element
- `readingGuide()`: injects a fixed horizontal guide bar and moves it with mouse or touch events

Some toggles are mutually aware. For example, grayscale and invert are not allowed to remain active together.

#### Text-to-speech

Text-to-speech uses the browser speech synthesis APIs.

Key behavior:

- `injectTts()` only adds the TTS controls if the requested language exists in the available voices
- `menuInterface.textToSpeech()` cycles through three speech rates before turning the feature off
- when active, click and keyboard events call `read()`
- `read()` speaks the target element’s `innerText`

The in-memory `speechRate` is stored in `_stateValues`, not in the persisted session object.

#### Speech-to-text

Speech-to-text uses `SpeechRecognition` or `webkitSpeechRecognition`.

Key behavior:

- enabling the feature adds focus listeners to text inputs, textareas, and contenteditable elements
- focusing one of those elements starts speech recognition through `listen()`
- recognition results are written back into the active input or editable element

This feature is deliberately disabled on unsupported browsers and on non-HTTPS pages.

#### Disable animations

`disableAnimations()` works in two layers:

- injects CSS that forces animation and transition durations to `0ms`
- tries to freeze autoplaying media

For GIF images, the code attempts to generate a canvas screenshot and replace the animated source temporarily. For autoplay videos, it removes `autoplay`, pauses the video, and restores it when the feature is disabled.

#### Custom iframe modals

If `options.iframeModals` is provided, extra menu buttons are created. Clicking one opens a native `<dialog>` containing an `<iframe>`.

#### Custom functions

If `options.customFunctions` is provided, extra menu buttons are created. Clicking them calls the user-supplied `method(cf, state)` callback.

This is the main extension point for adding site-specific behavior without modifying the library.

### 8. Session persistence

If `options.session.persistent` is `true`, the library stores state under `_accessState` in `localStorage`.

Persistence is handled by:

- `saveSession()`
- `setSessionFromCache()`
- [src/storage.ts](/home/yaron/accessibilitytool/accessibilitytool/src/storage.ts)

Persisted state includes:

- text size delta
- text spacing delta
- line height delta
- invert colors
- gray hues
- underline links
- big cursor
- reading guide

On startup, `setSessionFromCache()` replays the adjustments rather than restoring raw styles directly.

## Public API Surface

The intended public API is small:

- construct with `new Accessibility(options)`
- call methods through `instance.menuInterface`
- optionally call lower-level methods directly on the instance

The package also exposes:

- `window.Accessibility = Accessibility` in browser environments
- a deprecated `Accessibility.init()` wrapper that internally calls `new Accessibility()`

## Design Characteristics

### Strengths

- no framework dependency
- works directly in a plain browser environment
- small source area
- highly configurable labels, modules, hotkeys, and icon behavior
- easy to embed into many sites because it injects its own UI

### Tradeoffs

- heavy reliance on direct DOM mutation and inline styles
- broad selectors such as `*:not(._access)` can be expensive on large documents
- some features rely on older browser APIs or vendor-prefixed implementations
- session persistence is simple and coarse-grained
- the code mixes UI rendering, state management, and browser integration in the same class

## Typical Runtime Flow

The normal execution path is:

1. consumer imports the package
2. consumer creates `new Accessibility(options)`
3. constructor merges options and validates browser support
4. `build()` injects CSS, icon, menu, listeners, and optional speech controls
5. user opens the menu and toggles features
6. feature actions update DOM/CSS and optionally save session state
7. a later page load restores the persisted session state

## How To Read The Code Quickly

If you want to understand the project with minimal reading, use this order:

1. [package.json](/home/yaron/accessibilitytool/accessibilitytool/package.json)
2. [src/main.ts](/home/yaron/accessibilitytool/accessibilitytool/src/main.ts)
3. [src/menu-interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/menu-interface.ts)
4. [src/common.ts](/home/yaron/accessibilitytool/accessibilitytool/src/common.ts)
5. [src/interfaces/accessibility.interface.ts](/home/yaron/accessibilitytool/accessibilitytool/src/interfaces/accessibility.interface.ts)

## Summary

This codebase is a browser-side accessibility toolbar library implemented as an imperative TypeScript module. Its build is straightforward TypeScript compilation to both ESM and CommonJS outputs. Its runtime model is based on injecting UI, CSS, and event listeners into the current page, then applying accessibility features through direct DOM manipulation and browser speech APIs.
