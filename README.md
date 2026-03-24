# accessibilitytool

Modernized fork of the original [ranbuch/accessibility](https://github.com/ranbuch/accessibility).

This fork keeps the same MIT license as the original project and was updated by [Yaron Elharar](https://github.com/yaronelh) using GPT-5.4.

Great appreciation goes to Ran Buchnik and all contributors to the original library.

For the full list of fork changes, see [CHANGELOG.md](./CHANGELOG.md).

![chrome_2026-03-23_21-17-29](https://github.com/user-attachments/assets/c233801c-e417-4bc2-9ead-8af4f1016a02)

## Overview
Add an **accessibility toolbar** to your website with a single line of code.

![Alt text](https://raw.githubusercontent.com/ranbuch/accessibility/master/accessibility.png "accessibility icon")

### USAGE

`npm install @yaronelh/accessibilitytool`

Include script:
`<script type="text/javascript" src="node_modules/@yaronelh/accessibilitytool/dist/main.js"></script>`

Or import:
`import { Accessibility } from '@yaronelh/accessibilitytool';`

Or CommonJS:
`const { Accessibility } = require('@yaronelh/accessibilitytool');`

Initialize component:
`window.addEventListener('load', function() {
    new Accessibility();
}, false);`

### DESCRIPTION
**Features:**
- [x]  increase text size
- [x]  decrease text size
- [x]  increase line height
- [x]  decrease line height
- [x]  invert colors
- [x]  gray hues
- [x]  underline links
- [x]  big cursor
- [x]  reading guide
- [x]  text to speech with 3 reading velocities
- [x]  speech to text
- [x]  suppress animations

>Does not depend on any other library (**jQuery is not required**).
Easy to use.

### LIMITATIONS & KNOWN ISSUES
* Works with html5 browsers only (no IE8 and below)
* Text to speech & speech to text works in supported browsers and languages only

### MULTI LANGUAGE EXAMPLE

```javascript
var labels = {
    resetTitle: 'reset (in my language)',
    closeTitle: 'close (in my language)',
    menuTitle: 'title (in my language)',
    increaseText: 'increase text size (in my language)',
    decreaseText: 'decrease text size (in my language)',
    increaseTextSpacing: 'increase text spacing (in my language)',
    decreaseTextSpacing: 'decrease text spacing (in my language)',
    increaseLineHeight: 'increase line height (in my language)',
    decreaseLineHeight: 'decrease line height (in my language)',
    invertColors: 'invert colors (in my language)',
    grayHues: 'gray hues (in my language)',
    underlineLinks: 'underline links (in my language)',
    bigCursor: 'big cursor (in my language)',
    readingGuide: 'reading guide (in my language)',
    textToSpeech: 'text to speech (in my language)',
    speechToText: 'speech to text (in my language)',
    disableAnimations: 'disable animations (in my language)',
    hotkeyPrefix: 'Hotkey: (in my language)',
};
```

```javascript
var options = { labels: labels };
options.textToSpeechLang = 'en-US'; // or any other language
options.speechToTextLang = 'en-US'; // or any other language
new Accessibility(options);
```

### DISABLE FEATURES EXAMPLE
```javascript
options.modules = {
    decreaseText: [true/false],
    increaseText: [true/false],
    invertColors: [true/false],
    increaseTextSpacing: [true/false],
    decreaseTextSpacing: [true/false],
    increaseLineHeight: [true/false],
    decreaseLineHeight: [true/false],
    grayHues: [true/false],
    underlineLinks: [true/false],
    bigCursor: [true/false],
    readingGuide: [true/false],
    textToSpeech: [true/false],
    speechToText: [true/false],
    disableAnimations: [true/false]
};
```

>When the default is **true**

### TEXT SIZE MANIPULATION APPROACHES
If text increase / decrease isn't working for your site, you are probably not using responsive font-size units such as `em` or `rem`.  
In that case you can initialize the accessibility tool like this:  
```javascript
new Accessibility({textPixelMode: true})
```
You can change the factor of the font size difference between every iteration (default is 12.5):
```javascript
new Accessibility({textSizeFactor: 4})
```

### ANIMATIONS
Cancel all buttons animations:  
```javascript
new Accessibility({animations: {buttons: false}})
```

### POSITIONING
You can position the accessibility icon anywhere on the screen. The default position is bottom right:
```css
body {
    --_access-icon-top: 50px;
    --_access-icon-left: 50px;
    --_access-icon-right: unset;
    --_access-icon-bottom: unset;
}
```


### ICON IMAGE
This fork ships with bundled local SVG defaults for the launcher, close button, reset button, and built-in menu actions.

You can still replace the launcher and header icons through the `icon` options, for example by providing your own `imgElem`, `closeIconElem`, or `resetIconElem`.

### PERSISTENT SESSION
Session persistence is enabled by default in the current fork.

The modernized implementation stores state under a namespaced key and still restores legacy session data from older installs when available.

To disable this feature use:
```javascript
const options = {
    session: {
        persistent: false
    }
};
new Accessibility(options);
```


### DIRECT ACCESS TO THE API
You can toggle the menu buttons directly via the exposed API:
```javascript
var instance = new Accessibility();

instance.menuInterface.increaseText();

instance.menuInterface.decreaseText();

instance.menuInterface.increaseTextSpacing();

instance.menuInterface.decreaseTextSpacing();

instance.menuInterface.invertColors();

instance.menuInterface.grayHues();

instance.menuInterface.underlineLinks();

instance.menuInterface.bigCursor();

instance.menuInterface.readingGuide();

instance.menuInterface.textToSpeech();

instance.menuInterface.speechToText();

instance.menuInterface.disableAnimations();
```

You can also override the functionality like this:
```javascript
instance.menuInterface.increaseText = function() {
    // My own way to increase text size . . .
}
```

### ADD CUSTOM IFRAME
You can add buttons that open a modal with custom iframes, for example for accessibility terms:
```javascript
const options = {
    iframeModals: [{
        iframeUrl: 'https://example.com/accessibility-terms',
        buttonText: 'terms',
        icon: 'favorite',
        emoji: '❤️'
    }
};
new Accessibility(options);
```

If you do not provide the `icon` and `emoji`, this setup is used:

icon: 'policy',
emoji: '⚖️'

If you are using an icon font for custom button icons, choose names from the icon set you load yourself.

### ADD CUSTOM FUNCTIONS
You can add buttons that will invoke custom functions like so:
```javascript
const options = {
    customFunctions: [{
        method: (cf, state) => {
            console.log('The provided customFunctions object:', cf);
            console.log('Toggle state:', state);
        },
        buttonText: 'my foo',
        id: 1,
        toggle: true,
        icon: 'psychology_alt',
        emoji: '❓'
    }
};
new Accessibility(options);
```

If you do not provide the `icon` and `emoji`, this setup is used:

icon: 'psychology_alt',
emoji: '❓'

If you are using an icon font for custom button icons, choose names from the icon set you load yourself.

You must provide the `id` parameter. This is how you identify the button if you are using more than one custom function.

You must provide the `toggle` parameter. This determines whether the button toggles an active state on and off.







### CUSTOMIZE STYLING
You can use CSS variables to change the styling of the menu. Here is an example of changing the exposed variables to a dark theme:
```css
:root {
    --_access-menu-background-color: #000;
    --_access-menu-item-button-background: #222;
    --_access-menu-item-color: rgba(255,255,255,.6);
    --_access-menu-header-color: rgba(255,255,255,.87);
    --_access-menu-item-button-active-color: #000;
    --_access-menu-item-button-active-background-color: #fff;
    --_access-menu-div-active-background-color: #fff;
    --_access-menu-item-button-hover-color: rgba(255,255,255,.8);
    --_access-menu-item-button-hover-background-color: #121212;
    --_access-menu-item-icon-color: rgba(255,255,255,.6);
    --_access-menu-item-hover-icon-color: rgba(255,255,255,.8);
    --_access-menu-item-active-icon-color: #000;
}
```

Alternatively, you can suppress the default CSS injection altogether (not recommended):
```javascript
new Accessibility({suppressCssInjection: true});
```
You can also replace the icons by replacing the content attribute with the CSS variables currently being used.

You can suppress the default HTML injection altogether:
```javascript
const instance = new Accessibility({suppressDomInjection: true});
```
You will need to provide your own DOM and call `menuInterface` functions.

By default the library does not fetch remote icon fonts. The default runtime uses bundled local icons, so it works without reaching out to Google Fonts.

If you already load an icon font yourself from a local or self-hosted stylesheet, you can point the component at that font without enabling remote loading:
```javascript
const options = {
    icon: {
        useEmojis: false,
        fontClass: 'material-icons'
    }
};
new Accessibility(options);
```

If you want the component itself to fetch a remote icon font URL, you must opt in explicitly:
```javascript
const options = {
    icon: {
        useEmojis: false,
        allowRemoteFonts: true,
        fontFaceSrc: ['https://fonts.bunny.net/icon?family=Material+Icons']
    }
};
new Accessibility(options);
```

Another example with font-awesome icons:
```javascript
const options = {
    icon: {
        useEmojis: false,
        allowRemoteFonts: true,
        fontFaceSrc: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/v4-font-face.min.css'],
        fontFamily: '"FontAwesome"',
        img: '[optional - URL for an image that will replace the menu icon]',
        closeIcon: '[optional - replacement text for the close menu icon]',
        resetIcon: '[optional - replacement text for the reset all icon]',
        closeIconElem: {
            type: 'i',
            attrs: {
                'class': 'fa fa-window-close',
                'aria-hidden': 'true'
            }
        },
        imgElem: {
            type: 'i',
            attrs: {
                'class': 'fa fa-universal-access',
                'aria-hidden': 'true'
            }
        },
        resetIconElem: {
            type: 'i',
            attrs: {
                'class': 'fa fa-refresh',
                'aria-hidden': 'true'
            }
        }
    }
};
new Accessibility(options);
```

If your site uses a strict CSP, keep remote font loading disabled and self-host the stylesheet instead.
```css
:root {
    --_access-menu-item-icon-increase-text: "\f062";
    --_access-menu-item-icon-decrease-text: "\f063";
}
```
Obviously you will need to add the missing variables for the rest of the fonts.

### CHANGE MODULES ORDER
You can determine the order of the modules:
```javascript
new Accessibility({
    modulesOrder: [
        {
            type: AccessibilityModulesType.textToSpeech,
            order: 0
        }
    ]
});
```


### LICENSE
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://spdx.org/licenses/MIT)
