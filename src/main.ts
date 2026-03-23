'use strict';

import { Common } from './common.js';
import { getEventTarget, isActivationEvent } from './core/event-utils.js';
import { findMatchingHotkey, parseHotkeyLabel } from './core/hotkeys.js';
import {
	addDefaultIconOptions,
	buildDefaultModuleOrder,
	disableUnsupportedFeatures,
	ensureModuleOrder
} from './core/options.js';
import { buildBuiltinActionIconCss } from './core/icon-assets.js';
import { escapeCssString } from './core/security.js';
import { restoreSessionState, saveSessionState } from './core/session.js';
import {
	IAccessibility,
	IAccessibilityOptions,
	ISessionState,
	IStateValues,
	AccessibilityModulesType,
	IIframeModal,
	ICustomFunction,
	IAccessibilityModuleOrder
} from './interfaces/accessibility.interface.js';
import { IFormattedDim, IJsonToHtml } from './interfaces/common.interface.js';
import { IMenuInterface } from './interfaces/menu.interface.js';
import { MenuInterface } from './menu-interface.js';
import { Storage } from './storage.js';

export class Accessibility implements IAccessibility {
	static CSS_CLASS_NAME = '_access-main-css';
	static MENU_WIDTH = 'clamp(18rem, 30vw, 22rem)';
	static MENU_ID = '_access-menu-panel';
	static MENU_LABEL_ID = '_access-menu-title';
	private _isReading: boolean;
	private _common: Common;
	private _storage: Storage;
	private _options: IAccessibilityOptions;
	private _sessionState: ISessionState;
	private _htmlInitFS: IFormattedDim;
	private _body: HTMLBodyElement;
	private _html: HTMLElement;
	private _icon: HTMLElement;
	private _menu: HTMLElement;
	private _htmlOrgFontSize: string;
	private _stateValues: IStateValues;
	private _recognition: any; // SpeechRecognition;
	private _speechToTextTarget: HTMLElement;
	private _onKeyDownBind: any;
	private _fixedDefaultFont: string;
	public menuInterface: IMenuInterface;
	public options: IAccessibilityOptions;
	constructor(options = {} as IAccessibilityOptions) {
		this._common = new Common();
		this._storage = new Storage();
		this.menuInterface = new MenuInterface(this);
		this._fixedDefaultFont = this._common.getFixedFont('Material Icons');
		this._options = this.defaultOptions;
		this.options = this._common.extend(this._options, options);
		this.addModuleOrderIfNotDefined();
		this.addDefaultOptions(options);
		// Consider adding this:
		// if (options) {
		//     if (!options.textToSpeechLang && document.querySelector('html').getAttribute('lang')) {
		//         this.options.textToSpeechLang = document.querySelector('html').getAttribute('lang')
		//     }
		// }
		this.disabledUnsupportedFeatures();
		this._onKeyDownBind = this.onKeyDown.bind(this);
		this._sessionState = {
			textSize: 0,
			textSpace: 0,
			lineHeight: 0,
			invertColors: false,
			grayHues: false,
			underlineLinks: false,
			bigCursor: false,
			readingGuide: false
		};
		if (this.shouldUseEmojiIcons()) {
			this.fontFallback();
			this.build();
		} else if ((this.options.icon.fontFaceSrc || []).length === 0) {
			this.build();
		} else {
			this._common.injectIconsFont(this.options.icon.fontFaceSrc, (hasError: boolean) => {
				this.build();
				if (this.options.icon.fontFamilyValidation) {
					setTimeout(() => {
						this._common.isFontLoaded(
							this.options.icon.fontFamilyValidation,
							(isLoaded: boolean) => {
								if (!isLoaded || hasError) {
									console.log('!isLoaded || hasError', !isLoaded || hasError);
									this._common.warn(
										`${this.options.icon.fontFamilyValidation} font was not loaded, using emojis instead`
									);
									this.fontFallback();
									this.destroy();
									this.build();
								}
							}
						);
					});
				}
			});
		}
		if (this.options.modules.speechToText) {
			window.addEventListener('beforeunload', () => {
				if (this._isReading) {
					window.speechSynthesis.cancel();
					this._isReading = false;
				}
			});
		}
	}

	private hasRemoteFontSources() {
		return (this.options.icon.fontFaceSrc || []).some((src) => /^https?:\/\//i.test(src));
	}

	private shouldUseEmojiIcons() {
		if (this.options.icon.useEmojis) return true;

		const hasRemoteFontSources = this.hasRemoteFontSources();
		if (hasRemoteFontSources && !this.options.icon.allowRemoteFonts) {
			this._common.warn(
				'remote icon font loading is disabled by default; set icon.allowRemoteFonts to true to opt in'
			);
			return true;
		}

		const hasFontSources = (this.options.icon.fontFaceSrc || []).length > 0;
		const hasLocalFontClass = typeof this.options.icon.fontClass === 'string' && this.options.icon.fontClass !== '';

		if (!hasFontSources && !hasLocalFontClass) return true;

		return false;
	}

	get stateValues() {
		return this._stateValues;
	}

	set stateValues(value: IStateValues) {
		this._stateValues = value;
	}

	get html() {
		return this._html;
	}

	get body() {
		return this._body;
	}

	get sessionState() {
		return this._sessionState;
	}

	set sessionState(value: ISessionState) {
		this._sessionState = value;
	}

	get common() {
		return this._common;
	}

	get recognition() {
		return this._recognition;
	}

	get isReading() {
		return this._isReading;
	}

	set isReading(value: boolean) {
		this._isReading = value;
	}

	get fixedDefaultFont() {
		return this._fixedDefaultFont;
	}

	// Default options
	private get defaultOptions(): IAccessibilityOptions {
		const res = {
			icon: {
				img: '♿',
				fontFaceSrc: [] as string[],
				fontClass: '',
				useEmojis: true,
				allowRemoteFonts: false,
				closeIcon: 'close',
				resetIcon: 'refresh'
			},
			hotkeys: {
				enabled: false,
				helpTitles: true,
				keys: {
					toggleMenu: ['ctrlKey', 'altKey', 65],
					invertColors: ['ctrlKey', 'altKey', 73],
					grayHues: ['ctrlKey', 'altKey', 71],
					underlineLinks: ['ctrlKey', 'altKey', 85],
					bigCursor: ['ctrlKey', 'altKey', 67],
					readingGuide: ['ctrlKey', 'altKey', 82],
					textToSpeech: ['ctrlKey', 'altKey', 84],
					speechToText: ['ctrlKey', 'altKey', 83],
					disableAnimations: ['ctrlKey', 'altKey', 81]
				}
			},
			guide: {
				cBorder: '#20ff69',
				cBackground: '#000000',
				height: '12px'
			},
			suppressCssInjection: false,
			suppressDomInjection: false,
			labels: {
				resetTitle: 'Reset',
				closeTitle: 'Close',
				menuTitle: 'Accessibility Options',
				increaseText: 'increase text size',
				decreaseText: 'decrease text size',
				increaseTextSpacing: 'increase text spacing',
				decreaseTextSpacing: 'decrease text spacing',
				invertColors: 'invert colors',
				grayHues: 'gray hues',
				bigCursor: 'big cursor',
				readingGuide: 'reading guide',
				underlineLinks: 'underline links',
				textToSpeech: 'text to speech',
				speechToText: 'speech to text',
				disableAnimations: 'disable animations',
				increaseLineHeight: 'increase line height',
				decreaseLineHeight: 'decrease line height',
				hotkeyPrefix: 'Hotkey: '
			},
			textPixelMode: false,
			textEmlMode: true,
			textSizeFactor: 12.5,
			animations: {
				buttons: true
			},
			modules: {
				increaseText: true,
				decreaseText: true,
				increaseTextSpacing: true,
				decreaseTextSpacing: true,
				increaseLineHeight: true,
				decreaseLineHeight: true,
				invertColors: true,
				grayHues: true,
				bigCursor: true,
				readingGuide: true,
				underlineLinks: true,
				textToSpeech: true,
				speechToText: true,
				disableAnimations: true,
				iframeModals: true,
			customFunctions: true
			},
			modulesOrder: buildDefaultModuleOrder(),
			session: {
				persistent: true
			},
			iframeModals: [] as Array<IIframeModal>,
			customFunctions: [] as Array<ICustomFunction>,
			statement: {
				url: ''
			},
			feedback: {
				url: ''
			},
			language: {
				textToSpeechLang: '',
				speechToTextLang: ''
			}
		};
		return res;
	}

	initFontSize() {
		// store this values only once.
		if (!this._htmlInitFS) {
			let htmlInitFS = this._common.getFormattedDim(getComputedStyle(this._html).fontSize);
			let bodyInitFS = this._common.getFormattedDim(getComputedStyle(this._body).fontSize);
			this._html.style.fontSize = ((htmlInitFS.size as number) / 16) * 100 + '%';
			this._htmlOrgFontSize = this._html.style.fontSize;
			this._body.style.fontSize = (bodyInitFS.size as number) / (htmlInitFS.size as number) + 'em';
		}
	}

	fontFallback() {
		const previousImg = this.options.icon.img;
		const previousCloseIcon = this.options.icon.closeIcon;
		const previousResetIcon = this.options.icon.resetIcon;
		this.options.icon.useEmojis = true;
		this.options.icon.img = '♿';
		this.options.icon.fontClass = '';
		if (
			this.options.icon.imgElem?.type === '#text' &&
			(this.options.icon.imgElem.text === previousImg || this.options.icon.imgElem.text === 'accessibility')
		) {
			this.options.icon.imgElem = {
				type: '#text',
				text: '♿'
			};
		}
		if (
			this.options.icon.closeIconElem?.type === '#text' &&
			(this.options.icon.closeIconElem.text === previousCloseIcon || this.options.icon.closeIconElem.text === 'close')
		) {
			this.options.icon.closeIconElem = {
				type: '#text',
				text: 'X'
			};
		}
		if (
			this.options.icon.resetIconElem?.type === '#text' &&
			(this.options.icon.resetIconElem.text === previousResetIcon || this.options.icon.resetIconElem.text === 'refresh')
		) {
			this.options.icon.resetIconElem = {
				type: '#text',
				text: '♲'
			};
		}
	}

	addDefaultOptions(options: IAccessibilityOptions) {
		addDefaultIconOptions(this.options, options);
	}

	addModuleOrderIfNotDefined() {
		ensureModuleOrder(this.defaultOptions.modulesOrder, this.options.modulesOrder);
	}

	disabledUnsupportedFeatures() {
		disableUnsupportedFeatures(this._common, this.options);
	}

	public injectCss(injectFull: boolean) {
		let css;
		const mandatory = `
        html._access_cursor * {
            cursor: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIyOS4xODhweCIgaGVpZ2h0PSI0My42MjVweCIgdmlld0JveD0iMCAwIDI5LjE4OCA0My42MjUiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDI5LjE4OCA0My42MjUiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxnPjxwb2x5Z29uIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0Q5REFEOSIgc3Ryb2tlLXdpZHRoPSIxLjE0MDYiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRzPSIyLjgsNC41NDkgMjYuODQ3LDE5LjkwMiAxNi45NjQsMjIuNzAxIDI0LjIzOSwzNy43NDkgMTguMjc4LDQyLjAxNyA5Ljc0MSwzMC43MjQgMS4xMzgsMzUuODA5ICIvPjxnPjxnPjxnPjxwYXRoIGZpbGw9IiMyMTI2MjciIGQ9Ik0yOS4xNzUsMjEuMTU1YzAuMDcxLTAuNjEzLTAuMTY1LTEuMjUzLTAuNjM1LTEuNTczTDIuMTY1LDAuMjU4Yy0wLjQyNC0wLjMyLTAuOTg4LTAuMzQ2LTEuNDM1LTAuMDUzQzAuMjgyLDAuNDk3LDAsMS4wMywwLDEuNjE3djM0LjE3MWMwLDAuNjEzLDAuMzA2LDEuMTQ2LDAuNzc2LDEuNDM5YzAuNDcxLDAuMjY3LDEuMDU5LDAuMjEzLDEuNDgyLTAuMTZsNy40ODItNi4zNDRsNi44NDcsMTIuMTU1YzAuMjU5LDAuNDgsMC43MjksMC43NDYsMS4yLDAuNzQ2YzAuMjM1LDAsMC40OTQtMC4wOCwwLjcwNi0wLjIxM2w2Ljk4OC00LjU4NWMwLjMyOS0wLjIxMywwLjU2NS0wLjU4NiwwLjY1OS0xLjAxM2MwLjA5NC0wLjQyNiwwLjAyNC0wLjg4LTAuMTg4LTEuMjI2bC02LjM3Ni0xMS4zODJsOC42MTEtMi43NDVDMjguNzA1LDIyLjI3NCwyOS4xMDUsMjEuNzY4LDI5LjE3NSwyMS4xNTV6IE0xNi45NjQsMjIuNzAxYy0wLjQyNCwwLjEzMy0wLjc3NiwwLjUwNi0wLjk0MSwwLjk2Yy0wLjE2NSwwLjQ4LTAuMTE4LDEuMDEzLDAuMTE4LDEuNDM5bDYuNTg4LDExLjc4MWwtNC41NDEsMi45ODVsLTYuODk0LTEyLjMxNWMtMC4yMTItMC4zNzMtMC41NDEtMC42NC0wLjk0MS0wLjcyYy0wLjA5NC0wLjAyNy0wLjE2NS0wLjAyNy0wLjI1OS0wLjAyN2MtMC4zMDYsMC0wLjU4OCwwLjEwNy0wLjg0NywwLjMyTDIuOCwzMi41OVY0LjU0OWwyMS41OTksMTUuODA2TDE2Ljk2NCwyMi43MDF6Ii8+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPg==),auto!important;
        }
        @keyframes _access-dialog-backdrop {
            0% {
                background: var(--_access-menu-dialog-backdrop-background-start, rgba(0, 0, 0, 0.1))
            }
            100% {
                background: var(--_access-menu-dialog-backdrop-background-end, rgba(0, 0, 0, 0.5))
            }
        }
        dialog._access::backdrop, dialog._access {
            transition-duration: var(--_access-menu-dialog-backdrop-transition-duration, 0.35s);
            transition-timing-function: var(--_access-menu-dialog-backdrop-transition-timing-function, ease-in-out);
        }
        dialog._access:modal {
            border-color: transparent;
            border-width: 0;
            padding: 0;
        }
        dialog._access[open]::backdrop {
            background: var(--_access-menu-dialog-backdrop-background-end, rgba(0, 0, 0, 0.5));
            animation: _access-dialog-backdrop var(--_access-menu-dialog-backdrop-transition-duration, 0.35s) ease-in-out;
        }
        dialog._access.closing[open]::backdrop {
            background: var(--_access-menu-dialog-backdrop-background-start, rgba(0, 0, 0, 0.1));
        }
        dialog._access.closing[open] {
            opacity: 0;
        }
        .screen-reader-wrapper {
            margin: 0;
            position: absolute;
            bottom: -4px;
            width: calc(100% - 2px);
            left: 1px;
        }
        .screen-reader-wrapper-step-1, .screen-reader-wrapper-step-2,.screen-reader-wrapper-step-3 {
            float: left;
            background: var(--_access-menu-background-color, #fff);
            width: 33.33%;
            height: 3px;
            border-radius: 10px;
        }
        .screen-reader-wrapper-step-1.active, .screen-reader-wrapper-step-2.active,.screen-reader-wrapper-step-3.active {
            background: var(--_access-menu-item-button-background, #f9f9f9);
        }
        .access_read_guide_bar {
            box-sizing: border-box;
            background: var(--_access-menu-read-guide-bg, ${this.options.guide.cBackground});
            width: 100%!important;
            min-width: 100%!important;
            position: fixed!important;
            height: var(--_access-menu-read-guide-height, ${this.options.guide.height}) !important;
            border: var(--_access-menu-read-guide-border, solid 3px ${this.options.guide.cBorder});
            border-radius: 5px;
            top: 15px;
            z-index: 2147483647;
        }`;
		if (injectFull) {
			css = `
            ._access-scrollbar::-webkit-scrollbar-track, .mat-autocomplete-panel::-webkit-scrollbar-track, .mat-tab-body-content::-webkit-scrollbar-track, .mat-select-panel:not([class*='mat-elevation-z'])::-webkit-scrollbar-track, .mat-menu-panel::-webkit-scrollbar-track {
                -webkit-box-shadow: var(--_access-scrollbar-track-box-shadow, inset 0 0 6px rgba(0,0,0,0.3));
                background-color: var(--_access-scrollbar-track-background-color, #F5F5F5);
            }
            ._access-scrollbar::-webkit-scrollbar, .mat-autocomplete-panel::-webkit-scrollbar, .mat-tab-body-content::-webkit-scrollbar, .mat-select-panel:not([class*='mat-elevation-z'])::-webkit-scrollbar, .mat-menu-panel::-webkit-scrollbar {
                width: var(--_access-scrollbar-width, 6px);
                background-color: var(--_access-scrollbar-background-color, #F5F5F5);
            }
            ._access-scrollbar::-webkit-scrollbar-thumb, .mat-autocomplete-panel::-webkit-scrollbar-thumb, .mat-tab-body-content::-webkit-scrollbar-thumb, .mat-select-panel:not([class*='mat-elevation-z'])::-webkit-scrollbar-thumb, .mat-menu-panel::-webkit-scrollbar-thumb {
                background-color: var(--_access-scrollbar-thumb-background-color, #999999);
            }
            ._access-icon {
                position: var(--_access-icon-position, fixed);
                width: var(--_access-icon-width, 58px);
                height: var(--_access-icon-height, 58px);
                bottom: var(--_access-icon-bottom, 18px);
                top: var(--_access-icon-top, unset);
                left: var(--_access-icon-left, unset);
                right: var(--_access-icon-right, 18px);
                z-index: var(--_access-icon-z-index, 9999);
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--_access-icon-bg, transparent);
                color: var(--_access-icon-color, #fff);
                background-repeat: no-repeat;
                background-size: contain;
                cursor: pointer;
                opacity: 0;
                transition: transform .25s ease, box-shadow .25s ease, opacity .35s ease;
                -moz-user-select: none;
                -webkit-user-select: none;
                -ms-user-select: none;
                user-select: none;
                box-shadow: var(--_access-icon-box-shadow, none);
                transform: ${!this.options.icon.useEmojis ? 'translateY(0)' : 'translateY(0)'};
                border-radius: var(--_access-icon-border-radius, 0);
                border: var(--_access-icon-border, none);
                text-align: var(--_access-icon-text-align, center);
                backdrop-filter: none;
            }
            ._access-icon img {
                width: 58px;
                height: 58px;
                display: block;
            }
            ._access-icon:hover {
                transform: var(--_access-icon-transform-hover, translateY(-1px) scale(1.02));
                vertical-align: var(--_access-icon-vertical-align-hover);
            }
            ._access-icon:focus-visible {
                outline: none;
                box-shadow: var(--_access-icon-focus-shadow, 0 0 0 4px rgba(91, 147, 255, 0.28));
            }
            ._access-menu {
                -moz-user-select: none;
                -webkit-user-select: none;
                -ms-user-select: none;
                user-select: none;
                position: fixed;
                width: var(--_access-menu-width, ${Accessibility.MENU_WIDTH});
                height: var(--_access-menu-height, auto);
                max-width: var(--_access-menu-max-width, calc(100vw - 1rem));
                transition-duration: var(--_access-menu-transition-duration, .35s);
                transition-property: opacity, transform;
                z-index: var(--_access-menu-z-index, 99991);
                opacity: 1;
                transform: translateY(0);
                background: var(--_access-menu-background-color, linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%));
                color: var(--_access-menu-color, #0f172a);
                border-radius: var(--_access-menu-border-radius, 18px);
                border: var(--_access-menu-border, 1px solid rgba(148,163,184,0.28));
                font-family: var(--_access-menu-font-family, "Segoe UI", "Helvetica Neue", Arial, sans-serif);
                min-width: var(--_access-menu-min-width, 0);
                box-shadow: var(--_access-menu-box-shadow, 0 20px 60px rgba(15, 23, 42, 0.18));
                max-height: calc(100vh - 24px);
                overflow: hidden;
                backdrop-filter: blur(14px);
                ${getComputedStyle(this._body).direction === 'rtl' ? 'text-indent: -5px' : ''}
                top: var(--_access-menu-top, unset);
                left: var(--_access-menu-left, unset);
                bottom: var(--_access-menu-bottom, 12px);
                right: var(--_access-menu-right, 12px);
            }
            ._access-menu.close {
                z-index: -1;
                width: 0;
                opacity: 0;
                background-color: transparent;
                transform: translateY(12px);
                pointer-events: none;
            }
            ._access-menu ._text-center {
                font-size: var(--_access-menu-header-font-size, 1.05rem);
                font-weight: var(--_access-menu-header-font-weight, 700);
                margin: var(--_access-menu-header-margin, 0);
                padding: 0.7rem 0.85rem 0.6rem;
                color: var(--_access-menu-header-color, #0f172a);
                letter-spacing: var(--_access-menu-header-letter-spacing, initial);
                word-spacing: var(--_access-menu-header-word-spacing, initial);
                text-align: var(--_access-menu-header-text-align, center);
                position: sticky;
                top: 0;
                background: inherit;
                z-index: 1;
                border-bottom: 1px solid rgba(148,163,184,0.18);
            }
            ._access-menu ._menu-close-btn {
                left: 8px;
                color: var(--_access-menu-close-btn-color, #b91c1c);
                transition: .3s ease;
                transform: rotate(0deg);
                font-style: normal !important;
            }
            ._access-menu ._menu-reset-btn:hover,._access-menu ._menu-close-btn:hover {
                transform: var(--_access-menu-header-btn-hover-rotate, scale(1.08));
            }
            ._access-menu ._menu-reset-btn {
                right: 8px;
                color: var(--_access-menu-reset-btn-color, #0f766e);
                transition: .3s ease;
                transform: rotate(0deg);
                font-style: normal !important;
            }
            ._access-menu ._menu-btn {
                position: absolute;
                top: 7px;
                cursor: pointer;
                background: rgba(255,255,255,0.72);
                border: 1px solid rgba(148,163,184,0.24);
                border-radius: 999px;
                width: 28px;
                height: 28px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }
            ._access-menu ._menu-btn img {
                width: 14px;
                height: 14px;
                display: block;
            }
            ._access-menu ul {
                padding: 0.55rem;
                position: relative;
                font-size: var(--_access-menu-font-size, 15px);
                margin: 0;
                overflow: auto;
                max-height: var(--_access-menu-max-height, calc(100vh - 72px));
                display: flex;
                flex-flow: column;
                gap: 0.45rem;
                overscroll-behavior: contain;
            }
            ${mandatory}
            ._access-menu ul li {
                position: relative;
                list-style-type: none;
                -ms-user-select: none;
                -moz-user-select: none;
                -webkit-user-select: none;
                user-select: none;
                margin: 0;
                font: { size: 18, units: 'px' }
                font-size: var(--_access-menu-item-font-size, 14px) !important;
                line-height: var(--_access-menu-item-line-height, 18px) !important;
                color: var(--_access-menu-item-color, rgba(15,23,42,.82));
                letter-spacing: var(--_access-menu-item-letter-spacing, initial);
                word-spacing: var(--_access-menu-item-word-spacing, initial);
                width: 100%;
            }
            ._access-menu ul li button {
                background: var(--_access-menu-item-button-background, rgba(255,255,255,0.78));
                padding: var(--_access-menu-item-button-padding, 0.72rem 0.8rem 0.72rem 0);
                width: 100%;
                min-height: 42px;
                text-indent: var(--_access-menu-item-button-text-indent, 34px);
                text-align: start;
                position: relative;
                transition-duration: var(--_access-menu-item-button-transition-duration, .35s);
                transition-timing-function: var(--_access-menu-item-button-transition-timing-function, ease-in-out);
                border: var(--_access-menu-item-button-border, 1px solid rgba(148,163,184,0.2));
                border-radius: var(--_access-menu-item-button-border-radius, 14px);
                cursor: pointer;
                box-shadow: var(--_access-menu-item-button-box-shadow, 0 6px 16px rgba(15, 23, 42, 0.05));
            }
            ._access-menu ul li.position {
                display: inline-block;
                width: auto;
            }
            ._access-menu ul.before-collapse li button {
                opacity: var(--_access-menu-item-button-before-collapse-opacity, 0.05);
            }
            ._access-menu ul li button.active, ._access-menu ul li button.active:hover {
                background: var(--_access-menu-item-button-active-background-color, linear-gradient(135deg, #0f766e 0%, #115e59 100%));
            }
            ._access-menu div.active {
                color: var(--_access-menu-div-active-color, #fff);
                background-color: var(--_access-menu-div-active-background-color, #000);
            }
            ._access-menu ul li button.active, ._access-menu ul li button.active:hover, ._access-menu ul li button.active:before, ._access-menu ul li button.active:hover:before {
                color: var(--_access-menu-item-button-active-color, #fff);
            }
            ._access-menu ul li button:hover {
                color: var(--_access-menu-item-button-hover-color, rgba(15,23,42,.92));
                background: var(--_access-menu-item-button-hover-background-color, rgba(241,245,249,0.96));
                transform: translateY(-1px);
            }
            ._access-menu ul li.not-supported {
                display: none;
            }
            ._access-menu ._menu-btn:focus-visible,
            ._access-menu ul li button:focus-visible {
                outline: none;
                box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.18);
            }
            ._access-menu ul li button:before {
                content: ' ';
                line-height: 1;
                font-size: 16px !important;
                width: 18px;
                height: 18px;
                display: inline-block;
                overflow: hidden;
                top: 12px;
                left: 10px;
                position: absolute;
                color: var(--_access-menu-item-icon-color, rgba(15,23,42,.72));
                direction: ltr;
                text-indent: 0;
                transition-duration: .35s;
                transition-timing-function: ease-in-out;
            }
            ._access-menu ul li button svg path {
                fill: var(--_access-menu-item-icon-color, rgba(15,23,42,.72));
                transition-duration: .35s;
                transition-timing-function: ease-in-out;
            }
            ._access-menu ul li button:hover svg path {
                fill: var(--_access-menu-item-hover-icon-color, rgba(15,23,42,.9));
            }
            ._access-menu ul li button.active svg path {
                fill: var(--_access-menu-item-active-icon-color, #fff);
            }
            ._access-menu ul li:hover button:before {
                color: var(--_access-menu-item-hover-icon-color, rgba(15,23,42,.9));
            }
            ._access-menu ul li button.active button:before {
                color: var(--_access-menu-item-active-icon-color, #fff);
            }
            ${buildBuiltinActionIconCss()}
            @media (max-width: 768px) {
                ._access-icon {
                    right: var(--_access-icon-right-mobile, 12px);
                    bottom: var(--_access-icon-bottom-mobile, 12px);
                }
                ._access-menu {
                    width: calc(100vw - 1rem);
                    min-width: unset;
                    max-width: unset;
                    right: 0.5rem;
                    left: 0.5rem;
                    bottom: 0.5rem;
                    max-height: calc(100vh - 1rem);
                }
            }
            @media (max-width: 480px) {
                ._access-menu {
                    border-radius: 16px;
                }
                ._access-menu ._text-center {
                    font-size: 1rem;
                    padding: 0.7rem 2.5rem 0.55rem;
                }
                ._access-menu ._menu-btn {
                    top: 8px;
                    width: 26px;
                    height: 26px;
                }
                ._access-menu ._menu-btn img {
                    width: 13px;
                    height: 13px;
                }
                ._access-menu ul {
                    padding: 0.45rem;
                    gap: 0.35rem;
                    max-height: calc(100vh - 4.75rem);
                }
                ._access-menu ul li {
                    font-size: 13px !important;
                    line-height: 17px !important;
                }
                ._access-menu ul li button {
                    min-height: 40px;
                    padding: 0.68rem 0.7rem 0.68rem 0;
                    text-indent: 32px;
                }
                ._access-menu ul li button:before {
                    width: 17px;
                    height: 17px;
                    top: 11px;
                    left: 9px;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                ._access-icon,
                ._access-menu,
                ._access-menu ._menu-btn,
                ._access-menu ul li button,
                ._access-menu ul li button:before,
                ._access-menu ul li button svg path {
                    transition-duration: 0.01ms !important;
                    animation-duration: 0.01ms !important;
                }
            }`;
		} else {
			css = mandatory;
		}
		const className = Accessibility.CSS_CLASS_NAME;
		this._common.injectStyle(css, { className: className });
		this._common.deployedObjects.set(`.${className}`, false);
	}

	public removeCSS() {
		const existing = document.querySelector(`.${Accessibility.CSS_CLASS_NAME}`);
		if (existing) existing.remove();
	}

	injectIcon(): HTMLElement {
		// let fontSize = (this.options.icon.dimensions.width.size as number) * 0.8;
		// let lineHeight = (this.options.icon.dimensions.width.size as number) * 0.9;
		// let textIndent = (this.options.icon.dimensions.width.size as number) * 0.1;
		// let iStyle = `width: ${this.options.icon.dimensions.width.size + this.options.icon.dimensions.width.units}
		//     ;height: ${this.options.icon.dimensions.height.size + this.options.icon.dimensions.height.units}
		//     ;font-size: ${fontSize + this.options.icon.dimensions.width.units}
		//     ;line-height: ${lineHeight + this.options.icon.dimensions.width.units}
		//     ;text-indent: ${textIndent + this.options.icon.dimensions.width.units}
		//     ;background-color: ${!this.options.icon.useEmojis ? this.options.icon.backgroundColor : 'transparent'};color: ${this.options.icon.color}`;
		// for (let i in this.options.icon.position) {
		//     let pos = this.options.icon.position as any;
		//     pos = pos[i];
		//     iStyle += ';' + i + ':' + pos.size + pos.units;
		// }
		// iStyle += `;z-index: ${this.options.icon.zIndex}`;
		let className = `_access-icon ${this.options.icon.fontClass} _access`;
		let iconElem = this._common.jsonToHtml({
			type: 'i',
			attrs: {
				class: className,
				title: this.options.hotkeys.enabled
					? this.parseKeys(this.options.hotkeys.keys.toggleMenu)
					: this.options.labels.menuTitle,
				tabIndex: 0,
				role: 'button',
				'aria-controls': Accessibility.MENU_ID,
				'aria-haspopup': 'dialog',
				'aria-expanded': 'false',
				'aria-label': this.options.labels.menuTitle
			},
			children: [this.options.icon.imgElem]
		});

		this._body.appendChild(iconElem);
		this._common.deployedObjects.set('._access-icon', false);
		return iconElem;
	}

	parseKeys(arr: Array<any>) {
		return parseHotkeyLabel(this.options.hotkeys, this.options.labels.hotkeyPrefix, arr);
	}

	private syncMenuState(isOpen: boolean) {
		if (this._icon) {
			this._icon.setAttribute('aria-expanded', String(isOpen));
			this._icon.setAttribute('aria-label', this.options.labels.menuTitle);
			this._icon.tabIndex = isOpen ? -1 : 0;
		}

		if (!this._menu) return;

		this._menu.setAttribute('aria-hidden', String(!isOpen));

		if (isOpen) {
			const firstButton = this._menu.querySelector('button');
			if (firstButton instanceof HTMLElement) firstButton.focus();
		}
	}

	injectMenu(): HTMLElement {
		const json = {
			type: 'div',
			attrs: {
				class: '_access-menu close _access',
				id: Accessibility.MENU_ID,
				role: 'dialog',
				'aria-modal': 'false',
				'aria-labelledby': Accessibility.MENU_LABEL_ID,
				'aria-hidden': 'true'
			},
			children: [
				{
					type: 'p',
					attrs: {
						class: '_text-center',
						role: 'presentation',
						id: Accessibility.MENU_LABEL_ID
					},
					children: [
						{
							type: 'button',
							attrs: {
								class: `_menu-close-btn _menu-btn ${this.options.icon.fontClass}`,
								style: `font-family: var(--_access-menu-close-btn-font-family, ${this._fixedDefaultFont})`,
								title: this.options.hotkeys.enabled
									? this.parseKeys(this.options.hotkeys.keys.toggleMenu)
									: this.options.labels.closeTitle,
								'aria-label': this.options.labels.closeTitle,
								type: 'button'
							},
							children: [this.options.icon.closeIconElem]
						},
						{
							type: '#text',
							text: this.options.labels.menuTitle
						},
						{
							type: 'button',
							attrs: {
								class: `_menu-reset-btn _menu-btn ${this.options.icon.fontClass}`,
								style: `font-family: var(--_access-menu-reset-btn-font-family, ${this._fixedDefaultFont})`,
								title: this.options.labels.resetTitle,
								'aria-label': this.options.labels.resetTitle,
								type: 'button'
							},
							children: [this.options.icon.resetIconElem]
						}
					]
				},
				{
					type: 'ul',
					attrs: {
						class: 'before-collapse _access-scrollbar',
						role: 'list'
					},
					children: [
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'increaseText'
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.increaseText
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'decreaseText'
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.decreaseText
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'increaseTextSpacing'
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.increaseTextSpacing
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'decreaseTextSpacing'
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.decreaseTextSpacing
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'increaseLineHeight'
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.increaseLineHeight
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'decreaseLineHeight'
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.decreaseLineHeight
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'invertColors',
										title: this.parseKeys(this.options.hotkeys.keys.invertColors)
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.invertColors
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'grayHues',
										title: this.parseKeys(this.options.hotkeys.keys.grayHues)
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.grayHues
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'underlineLinks',
										title: this.parseKeys(this.options.hotkeys.keys.underlineLinks)
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.underlineLinks
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'bigCursor',
										title: this.parseKeys(this.options.hotkeys.keys.bigCursor)
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.bigCursor
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'readingGuide',
										title: this.parseKeys(this.options.hotkeys.keys.readingGuide)
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.readingGuide
										}
									]
								}
							]
						},
						{
							type: 'li',
							children: [
								{
									type: 'button',
									attrs: {
										'data-access-action': 'disableAnimations',
										title: this.parseKeys(this.options.hotkeys.keys.disableAnimations)
									},
									children: [
										{
											type: '#text',
											text: this.options.labels.disableAnimations
										}
									]
								}
							]
						}
					]
				}
			]
		} as IJsonToHtml;
		if (this.options.iframeModals) {
			this.options.iframeModals.forEach((im, i) => {
				const btn = {
					type: 'li',
					children: [
						{
							type: 'button',
							attrs: {
								'data-access-action': 'iframeModals',
								'data-access-url': im.iframeUrl
							},
							children: [
								{
									type: '#text',
									text: im.buttonText
								}
							]
						}
					]
				} as IJsonToHtml;
				let icon = null;
				if (im.icon && !this.options.icon.useEmojis) icon = im.icon;
				else if (im.emoji && this.options.icon.useEmojis) icon = im.emoji;
				if (icon) {
					btn.children[0].attrs['data-access-iframe-index'] = i;
					const css = `._access-menu ul li button[data-access-action="iframeModals"][data-access-iframe-index="${i}"]:before {
                        content: "${escapeCssString(icon)}";
                    }`;
					let className = '_data-access-iframe-index-' + i;
					this._common.injectStyle(css, { className: className });
					this._common.deployedObjects.set('.' + className, false);
				}
				if (this.options.modules.textToSpeech)
					json.children[1].children.splice(json.children[1].children.length - 2, 0, btn);
				else json.children[1].children.push(btn);
			});
		}
		if (this.options.customFunctions) {
			this.options.customFunctions.forEach((cf, i) => {
				const btn = {
					type: 'li',
					children: [
						{
							type: 'button',
							attrs: {
								'data-access-action': 'customFunctions',
								'data-access-custom-id': cf.id,
								'data-access-custom-index': i
							},
							children: [
								{
									type: '#text',
									text: cf.buttonText
								}
							]
						}
					]
				} as IJsonToHtml;
				let icon = null;
				if (cf.icon && !this.options.icon.useEmojis) icon = cf.icon;
				else if (cf.emoji && this.options.icon.useEmojis) icon = cf.emoji;
				if (icon) {
					const css = `._access-menu ul li button[data-access-action="customFunctions"][data-access-custom-index="${i}"]:before {
                        content: "${escapeCssString(icon)}";
                    }`;
					let className = '_data-access-custom-index-' + i;
					this._common.injectStyle(css, { className: className });
					this._common.deployedObjects.set('.' + className, false);
				}
				if (this.options.modules.textToSpeech)
					json.children[1].children.splice(json.children[1].children.length - 2, 0, btn);
				else json.children[1].children.push(btn);
			});
		}
		let menuElem = this._common.jsonToHtml(json);

		this._body.appendChild(menuElem);
		this._common.deployedObjects.set('._access-menu', false);

		let closeBtn = document.querySelector('._access-menu ._menu-close-btn');
			['click', 'keyup'].forEach((evt) => {
				closeBtn.addEventListener(
					evt,
					(e: Event | KeyboardEvent) => {
						if (!isActivationEvent(e)) return;
						this.toggleMenu();
					},
					false
			);
		});

		let resetBtn = document.querySelector('._access-menu ._menu-reset-btn');
			['click', 'keyup'].forEach((evt) => {
				resetBtn.addEventListener(
					evt,
					(e: Event | KeyboardEvent) => {
						if (!isActivationEvent(e)) return;
						this.resetAll();
					},
					false
			);
		});

		return menuElem;
	}

	getVoices(): Promise<SpeechSynthesisVoice[]> {
		return new Promise((resolve) => {
			let synth = window.speechSynthesis;
			let id: ReturnType<typeof setInterval>;

			id = setInterval(() => {
				if (synth.getVoices().length !== 0) {
					resolve(synth.getVoices());
					clearInterval(id);
				}
			}, 10);
		});
	}

	async injectTts(): Promise<void> {
		let voices = await this.getVoices();
		let isLngSupported = false;

		for (let i = 0; i < voices.length; i++) {
			if (voices[i].lang === this.options.language.textToSpeechLang) {
				isLngSupported = true;
				break;
			}
		}

		if (isLngSupported) {
			let tts = this.common.jsonToHtml({
				type: 'li',
				children: [
					{
						type: 'button',
						attrs: {
							'data-access-action': 'textToSpeech',
							title: this.parseKeys(this.options.hotkeys.keys.textToSpeech)
						},
						children: [
							{
								type: '#text',
								text: this.options.labels.textToSpeech
							}
						]
					},
					{
						type: 'div',
						attrs: {
							class: 'screen-reader-wrapper'
						},
						children: [
							{
								type: 'div',
								attrs: {
									class: 'screen-reader-wrapper-step-1',
									tabIndex: '-1'
								}
							},
							{
								type: 'div',
								attrs: {
									class: 'screen-reader-wrapper-step-2',
									tabIndex: '-1'
								}
							},
							{
								type: 'div',
								attrs: {
									class: 'screen-reader-wrapper-step-3',
									tabIndex: '-1'
								}
							}
						]
					}
				]
			});
			let sts = this.common.jsonToHtml({
				type: 'li',
				children: [
					{
						type: 'button',
						attrs: {
							'data-access-action': 'speechToText',
							title: this.parseKeys(this.options.hotkeys.keys.speechToText)
						},
						children: [
							{
								type: '#text',
								text: this.options.labels.speechToText
							}
						]
					}
				]
			});
			let ul = document.querySelector('._access-menu ul');
			ul.appendChild(sts);
			ul.appendChild(tts);
		}
	}

	addListeners() {
		let lis = document.querySelectorAll('._access-menu ul li');
		let step1 = document.getElementsByClassName('screen-reader-wrapper-step-1');
		let step2 = document.getElementsByClassName('screen-reader-wrapper-step-2');
		let step3 = document.getElementsByClassName('screen-reader-wrapper-step-3');

		for (let i = 0; i < lis.length; i++) {
			['click', 'keyup'].forEach((evt) =>
				lis[i].addEventListener(evt, (e: Event | KeyboardEvent) => {
					if (!isActivationEvent(e)) return;
					const target = (getEventTarget(e)?.closest('[data-access-action]') as HTMLElement | null) ?? null;
					if (!target) return;
					this.invoke(
						target.getAttribute('data-access-action'),
						target
					);
				})
			);
		}

		[...Array.from(step1), ...Array.from(step2), ...Array.from(step3)].forEach((el) =>
			el.addEventListener(
				'click',
				(e: Event) => {
					const target = getEventTarget(e);
					if (!target || !target.parentElement || !target.parentElement.parentElement) return;
					this.invoke(
						target.parentElement.parentElement.getAttribute('data-access-action'),
						target
					);
				},
				false
			)
		);
	}

	sortModuleTypes() {
		this.options.modulesOrder.sort((a: IAccessibilityModuleOrder, b: IAccessibilityModuleOrder) => {
			return a.order - b.order;
		});
	}

	disableUnsupportedModulesAndSort() {
		this.sortModuleTypes();
		let ul = document.querySelector('._access-menu ul');
		this.options.modulesOrder.forEach((item) => {
			const i = item.type;
			const module = AccessibilityModulesType[i];
			let m = this.options.modules as any;
			m = m[module];
			let moduleLi = document.querySelector('button[data-access-action="' + module + '"]');
			if (moduleLi) {
				moduleLi.parentElement.remove();
				ul.appendChild(moduleLi.parentElement);
				if (!m) moduleLi.parentElement.classList.add('not-supported');
			}
		});
	}

	resetAll() {
		this.menuInterface.textToSpeech(true);
		this.menuInterface.speechToText(true);
		this.menuInterface.disableAnimations(true);
		this.menuInterface.underlineLinks(true);
		this.menuInterface.grayHues(true);
		this.menuInterface.invertColors(true);
		this.menuInterface.bigCursor(true);
		this.menuInterface.readingGuide(true);
		this.resetTextSize();
		this.resetTextSpace();
		this.resetLineHeight();
	}

	resetTextSize() {
		this.resetIfDefined(this._stateValues.body.fontSize, this._body.style, 'fontSize');
		if (typeof this._htmlOrgFontSize !== 'undefined')
			this._html.style.fontSize = this._htmlOrgFontSize;
		let all = document.querySelectorAll('[data-init-font-size]');

		for (let i = 0; i < all.length; i++) {
			(all[i] as HTMLElement).style.fontSize = all[i].getAttribute('data-init-font-size');
			all[i].removeAttribute('data-init-font-size');
		}

		this._sessionState.textSize = 0;
		this.onChange(true);
	}

	resetLineHeight() {
		this.resetIfDefined(this._stateValues.body.lineHeight, this.body.style, 'lineHeight');
		let all = document.querySelectorAll('[data-init-line-height]');

		for (let i = 0; i < all.length; i++) {
			(all[i] as HTMLElement).style.lineHeight = all[i].getAttribute('data-init-line-height');
			all[i].removeAttribute('data-init-line-height');
		}

		this.sessionState.lineHeight = 0;
		this.onChange(true);
	}

	resetTextSpace() {
		this.resetIfDefined(this._stateValues.body.wordSpacing, this._body.style, 'wordSpacing');
		this.resetIfDefined(this._stateValues.body.letterSpacing, this._body.style, 'letterSpacing');
		let all = document.querySelectorAll('[data-init-word-spacing]');
		let all2 = document.querySelectorAll('[data-init-letter-spacing]');

		for (let i = 0; i < all.length; i++) {
			(all[i] as HTMLElement).style.wordSpacing = all[i].getAttribute('data-init-word-spacing');
			all[i].removeAttribute('data-init-word-spacing');
		}
		for (let i = 0; i < all2.length; i++) {
			(all[i] as HTMLElement).style.letterSpacing = all[i].getAttribute('data-init-letter-spacing');
			all[i].removeAttribute('data-init-letter-spacing');
		}

		this._sessionState.textSpace = 0;
		this.onChange(true);
	}

	alterTextSize(isIncrease: boolean) {
		this._sessionState.textSize += isIncrease ? 1 : -1;
		this.onChange(true);
		let factor = this.options.textSizeFactor;
		if (!isIncrease) factor *= -1;
		if (this.options.textPixelMode) {
			let all = document.querySelectorAll('*:not(._access)');

			for (let i = 0; i < all.length; i++) {
				let fSize = getComputedStyle(all[i]).fontSize;
				if (fSize && fSize.indexOf('px') > -1) {
					if (!all[i].getAttribute('data-init-font-size'))
						all[i].setAttribute('data-init-font-size', fSize);
				}
			}
			for (let i = 0; i < all.length; i++) {
				let fSize = getComputedStyle(all[i]).fontSize;
				if (fSize && fSize.indexOf('px') > -1) {
					fSize = (parseInt(fSize.replace('px', '')) + factor) as any;
					(all[i] as HTMLElement).style.fontSize = fSize + 'px';
				}
				if (this._stateValues.textToSpeech)
					this.textToSpeech(`Text Size ${isIncrease ? 'Increased' : 'Decreased'}`);
			}

			// Also adjust the body font size
			let bodyFontSize = getComputedStyle(this._body).fontSize;
			if (bodyFontSize && bodyFontSize.indexOf('px') > -1) {
				if (!this._body.getAttribute('data-init-font-size'))
					this._body.setAttribute('data-init-font-size', bodyFontSize);
				bodyFontSize = (parseInt(bodyFontSize.replace('px', '')) + factor) as any;
				(this._body as HTMLElement).style.fontSize = bodyFontSize + 'px';
			}
		} else if (this.options.textEmlMode) {
			let fp = this._html.style.fontSize;
			if (fp.indexOf('%')) {
				fp = parseInt(fp.replace('%', '')) as any;
				this._html.style.fontSize = fp + factor + '%';
				if (this._stateValues.textToSpeech)
					this.textToSpeech(`Text Size ${isIncrease ? 'Increased' : 'Decreased'}`);
			} else {
				this._common.warn('Accessibility.textEmlMode, html element is not set in %.');
			}
		} else {
			let fSize = this._common.getFormattedDim(getComputedStyle(this._body).fontSize);
			if (typeof this._stateValues.body.fontSize === 'undefined')
				this._stateValues.body.fontSize = fSize.size + fSize.suffix;
			if (fSize && fSize.suffix && !isNaN((fSize.size as number) * 1)) {
				this._body.style.fontSize = (fSize.size as number) * 1 + factor + fSize.suffix;
			}
		}
	}

	alterLineHeight(isIncrease: boolean) {
		this.sessionState.lineHeight += isIncrease ? 1 : -1;
		this.onChange(true);
		let factor = 2;
		if (!isIncrease) factor *= -1;
		if (this.options.textEmlMode) factor *= 10;

		let all = document.querySelectorAll('*:not(._access)');
		let exclude = Array.prototype.slice.call(document.querySelectorAll('._access-menu *'));

		for (let i = 0; i < all.length; i++) {
			if (exclude.includes(all[i])) {
				continue;
			}

			if (this.options.textPixelMode) {
				let lHeight = getComputedStyle(all[i]).lineHeight;
				if (lHeight && lHeight.indexOf('px') > -1) {
					if (!all[i].getAttribute('data-init-line-height'))
						all[i].setAttribute('data-init-line-height', lHeight);
					const newPixel = parseInt(lHeight.replace('px', '')) + factor;
					(all[i] as HTMLElement).style.lineHeight = `${newPixel}px`;
				}
				if (this._stateValues.textToSpeech)
					this.textToSpeech(`Line Height ${isIncrease ? 'Increased' : 'Decreased'}`);
			} else if (this.options.textEmlMode) {
				let lTextSize = getComputedStyle(all[i]).fontSize;
				let lHeight = getComputedStyle(all[i]).lineHeight;
				if (lHeight === 'normal')
					lHeight = (parseInt(lTextSize.replace('px', '')) * 1.2).toString() + 'px';
				let lHeight2 = lHeight.replace('px', '');
				let lTextSize2 = lTextSize.replace('px', '');
				let inPercent = (parseInt(lHeight2) * 100) / parseInt(lTextSize2);
				if (lHeight && lHeight.indexOf('px') > -1) {
					if (!all[i].getAttribute('data-init-line-height'))
						all[i].setAttribute('data-init-line-height', inPercent + '%');
					inPercent = inPercent + factor;
					(all[i] as HTMLElement).style.lineHeight = inPercent + '%';
				}
				if (typeof this._stateValues.body.lineHeight === 'undefined')
					this._stateValues.body.lineHeight = '';
				if (this._stateValues.textToSpeech)
					this.textToSpeech(`Line height ${isIncrease ? 'Increased' : 'Decreased'}`);
			}
		}
	}

	alterTextSpace(isIncrease: boolean) {
		this._sessionState.textSpace += isIncrease ? 1 : -1;
		this.onChange(true);
		let factor = 2;
		if (!isIncrease) factor *= -1;
		if (this.options.textPixelMode) {
			let all = document.querySelectorAll('*:not(._access)');
			let exclude = Array.prototype.slice.call(document.querySelectorAll('._access-menu *'));
			for (let i = 0; i < all.length; i++) {
				if (exclude.includes(all[i])) {
					continue;
				}
				// wordSpacing
				let fSpacing = (all[i] as HTMLElement).style.wordSpacing as any;
				if (fSpacing && fSpacing.indexOf('px') > -1) {
					if (!all[i].getAttribute('data-init-word-spacing'))
						all[i].setAttribute('data-init-word-spacing', fSpacing);
					fSpacing = fSpacing.replace('px', '') * 1 + factor;
					(all[i] as HTMLElement).style.wordSpacing = fSpacing + 'px';
				} else {
					all[i].setAttribute('data-init-word-spacing', fSpacing);
					(all[i] as HTMLElement).style.wordSpacing = factor + 'px';
				}

				// letterSpacing
				let fSpacing2 = (all[i] as HTMLElement).style.letterSpacing as any;
				if (fSpacing2 && fSpacing2.indexOf('px') > -1) {
					if (!all[i].getAttribute('data-init-letter-spacing'))
						all[i].setAttribute('data-init-letter-spacing', fSpacing2);
					fSpacing2 = fSpacing2.replace('px', '') * 1 + factor;
					(all[i] as HTMLElement).style.letterSpacing = fSpacing2 + 'px';
				} else {
					all[i].setAttribute('data-init-letter-spacing', fSpacing2);
					(all[i] as HTMLElement).style.letterSpacing = factor + 'px';
				}
			}
			if (this._stateValues.textToSpeech)
				this.textToSpeech(`Text Spacing ${isIncrease ? 'Increased' : 'Decreased'}`);
		} else {
			// wordSpacing
			let fSpacing = this._common.getFormattedDim(getComputedStyle(this._body).wordSpacing) as any;
			if (typeof this._stateValues.body.wordSpacing === 'undefined')
				this._stateValues.body.wordSpacing = '';
			if (fSpacing && fSpacing.suffix && !isNaN(fSpacing.size * 1)) {
				this._body.style.wordSpacing = fSpacing.size * 1 + factor + fSpacing.suffix;
			}
			// letterSpacing
			let fSpacing2 = this._common.getFormattedDim(
				getComputedStyle(this._body).letterSpacing
			) as any;
			if (typeof this._stateValues.body.letterSpacing === 'undefined')
				this._stateValues.body.letterSpacing = '';
			if (fSpacing2 && fSpacing2.sufix && !isNaN(fSpacing2.size * 1)) {
				this._body.style.letterSpacing = fSpacing2.size * 1 + factor + fSpacing2.sufix;
			}
			if (this._stateValues.textToSpeech)
				this.textToSpeech(`Text Spacing ${isIncrease ? 'Increased' : 'Decreased'}`);
		}
	}

	speechToText() {
		if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
			this._recognition = new ((window as any).SpeechRecognition ||
				(window as any).webkitSpeechRecognition)();
			this._recognition.continuous = true;
			this._recognition.interimResults = true;
			this._recognition.onstart = () => {
				// TODO red color on mic icon
				// console.log('listening . . .');
				// if (this.speechToTextTarget)
				//     this.speechToTextTarget.parentElement.classList.add('_access-listening');
				this._body.classList.add('_access-listening');
			};

			this._recognition.onend = () => {
				this._body.classList.remove('_access-listening');
			};

			this._recognition.onresult = (event: any) => {
				let finalTranscript = '';
				if (typeof event.results === 'undefined') {
					return;
				}
				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						finalTranscript += event.results[i][0].transcript;
					}
				}
				if (finalTranscript && this._speechToTextTarget) {
					this._speechToTextTarget.parentElement.classList.remove('_access-listening');
					if (
						this._speechToTextTarget.tagName.toLowerCase() === 'input' ||
						this._speechToTextTarget.tagName.toLowerCase() === 'textarea'
					) {
						(this._speechToTextTarget as HTMLInputElement).value = finalTranscript;
					} else if (this._speechToTextTarget.getAttribute('contenteditable') !== null) {
						this._speechToTextTarget.innerText = finalTranscript;
					}
				}
			};
			this._recognition.lang = this.options.language.speechToTextLang;
			this._recognition.start();
		}
	}

	textToSpeech(text: string) {
		const windowAny = window as any;
		if (!windowAny.SpeechSynthesisUtterance || !windowAny.speechSynthesis) return;
		let msg = new windowAny.SpeechSynthesisUtterance(text);
		msg.lang = this.options.language.textToSpeechLang;
		msg.lang = this.options.textToSpeechLang;
		msg.rate = this._stateValues.speechRate;
		msg.onend = () => {
			this._isReading = false;
		};
		let voices = windowAny.speechSynthesis.getVoices();
		let isLngSupported = false;
		for (let i = 0; i < voices.length; i++) {
			if (voices[i].lang === msg.lang) {
				msg.voice = voices[i];
				isLngSupported = true;
				break;
			}
		}
		if (!isLngSupported) {
			this._common.warn('text to speech language not supported!');
		}
		if (window.speechSynthesis.pending || window.speechSynthesis.speaking) {
			window.speechSynthesis.pause;
			window.speechSynthesis.cancel();
		}
		window.speechSynthesis.speak(msg);
		this._isReading = true;
	}

	createScreenShot(url: string): Promise<string> {
		return new Promise((resolve) => {
			let canvas = document.createElement('canvas');
			let img = new Image();
			canvas.style.position = 'fixed';
			canvas.style.top = '0';
			canvas.style.left = '0';
			canvas.style.opacity = '0';
			canvas.style.transform = 'scale(0.05)';
			img.crossOrigin = 'anonymous';
			img.onload = async () => {
				document.body.appendChild(canvas);
				const ctx = canvas.getContext('2d');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
				let res;
				try {
					res = canvas.toDataURL('image/png');
				} catch (e) {}
				resolve(res);
				canvas.remove();
			};
			img.onerror = () => {
				resolve(Common.DEFAULT_PIXEL);
			};
			img.src = url;
		});
	}

	listen(e?: Event) {
		if (typeof this._recognition === 'object' && typeof this._recognition.stop === 'function')
			this._recognition.stop();

		const target = getEventTarget<HTMLElement>(e);
		if (!target) return;
		this._speechToTextTarget = target;
		this.speechToText();
	}

	read(e?: Event) {
		if (!e) return;

		try {
			e.preventDefault();
			e.stopPropagation();
		} catch (ex) {}

		const target = getEventTarget<HTMLElement>(e);
		if (!target) return;

		let allContent = Array.prototype.slice.call(document.querySelectorAll('._access-menu *'));
		for (const key in allContent) {
			if (allContent[key] === target && e instanceof MouseEvent) return;
		}
		if (e instanceof KeyboardEvent && ((e.shiftKey && e.key === 'Tab') || e.key === 'Tab')) {
			this.textToSpeech(target.innerText);
			return;
		}
		if (this._isReading) {
			window.speechSynthesis.cancel();
			this._isReading = false;
		} else this.textToSpeech(target.innerText);
	}

	runHotkey(name: string) {
		switch (name) {
			case 'toggleMenu':
				this.toggleMenu();
				break;
			default:
				if (typeof (this.menuInterface as any)[name] === 'function') {
					if ((this._options.modules as any)[name]) {
						(this.menuInterface as any)[name](false);
					}
				}
				break;
		}
	}
	toggleMenu() {
		const shouldClose = this._menu.classList.contains('close');
		const isOpening = shouldClose;
		setTimeout(
			() => {
				this._menu.querySelector('ul').classList.toggle('before-collapse');
			},
			shouldClose ? 500 : 10
		);
		this._menu.classList.toggle('close');
		this.syncMenuState(isOpening);

		this._menu.childNodes.forEach((child) => {
			if (child.hasChildNodes()) {
				if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === 'P') {
					(child as HTMLElement).tabIndex = -1;
				}
			}
		});
	}

	invoke(action: string, button: HTMLElement) {
		if (typeof (this.menuInterface as any)[action] === 'function')
			(this.menuInterface as any)[action](undefined, button);
	}

	onKeyDown(e: KeyboardEvent) {
		const act = findMatchingHotkey(this.options.hotkeys.keys, e);
		if (act !== undefined) {
			this.runHotkey(act[0]);
		}
	}

	build() {
		this._stateValues = {
			underlineLinks: false,
			textToSpeech: false,
			bigCursor: false,
			readingGuide: false,
			speechRate: 1,
			body: {},
			html: {}
		};
		this._body = document.body || (document.getElementsByTagName('body')[0] as any);
		this._html = document.documentElement || document.getElementsByTagName('html')[0];
		if (this.options.textEmlMode) this.initFontSize();
		this.injectCss(!this.options.suppressCssInjection && !this.options.suppressDomInjection);
		if (!this.options.suppressDomInjection) {
			this._icon = this.injectIcon();
			this._menu = this.injectMenu();
			this.syncMenuState(false);
			this.injectTts();
			setTimeout(() => {
				this.addListeners();
				this.disableUnsupportedModulesAndSort();
			}, 10);
			if (this.options.hotkeys.enabled) {
				document.addEventListener('keydown', this._onKeyDownBind, false);
			}

			this._icon.addEventListener(
				'click',
				(event) => {
					if (!isActivationEvent(event)) return;
					this.toggleMenu();
				},
				false
			);
			this._icon.addEventListener(
				'keyup',
				(event) => {
					if (!isActivationEvent(event)) return;
					this.toggleMenu();
				},
				false
			);
			this._menu.addEventListener(
				'keydown',
				(event) => {
					if (event.key !== 'Escape') return;
					event.preventDefault();
					this.toggleMenu();
					this._icon.focus();
				},
				false
			);
			setTimeout(() => {
				this._icon.style.opacity = '1';
			}, 10);
		}
		this.updateReadGuide = (e: Event | TouchEvent | any) => {
			let newPos = 0;
			if (e.type === 'touchmove') {
				newPos = e.changedTouches[0].clientY;
			} else {
				newPos = e.y;
			}
			document.getElementById('access_read_guide_bar').style.top =
				newPos - (parseInt(this.options.guide.height.replace('px', '')) + 5) + 'px';
		};

		if (this.options.session.persistent) this.setSessionFromCache();
	}

	updateReadGuide(e: Event | TouchEvent | any) {
		let newPos = 0;
		if (e.type === 'touchmove') {
			newPos = e.changedTouches[0].clientY;
		} else {
			newPos = e.y;
		}
		document.getElementById('access_read_guide_bar').style.top =
			newPos - (parseInt(this.options.guide.height.replace('px', '')) + 5) + 'px';
	}

	resetIfDefined(src: string, dest: any, prop: string) {
		if (typeof src !== 'undefined') dest[prop] = src;
	}

	onChange(updateSession: boolean) {
		if (updateSession && this.options.session.persistent) this.saveSession();
	}

	saveSession() {
		saveSessionState(this._storage, this.sessionState);
	}

	setSessionFromCache() {
		restoreSessionState(this._storage, {
			applyTextSize: (isIncrease: boolean) => this.alterTextSize(isIncrease),
			applyTextSpace: (isIncrease: boolean) => this.alterTextSpace(isIncrease),
			applyLineHeight: (isIncrease: boolean) => this.alterLineHeight(isIncrease),
			enableInvertColors: () => this.menuInterface.invertColors(),
			enableGrayHues: () => this.menuInterface.grayHues(),
			enableUnderlineLinks: () => this.menuInterface.underlineLinks(),
			enableBigCursor: () => this.menuInterface.bigCursor(),
			enableReadingGuide: () => this.menuInterface.readingGuide(),
			assignSessionState: (sessionState: ISessionState) => {
				this.sessionState = sessionState;
			}
		});
	}

	destroy() {
		const allSelectors = this._common.deployedObjects.getAll();
		allSelectors.forEach((value: boolean, key: string) => {
			const elem = document.querySelector(key);
			if (elem) elem.parentElement.removeChild(elem);
		});
		document.removeEventListener('keydown', this._onKeyDownBind, false);
	}
}

(Accessibility as any).init = (opt?: IAccessibilityOptions) => {
	console.warn('"Accessibility.init()" is deprecated! Please use "new Accessibility()" instead');
	new Accessibility(opt);
};

if (typeof window !== 'undefined') (window as any).Accessibility = Accessibility;

export * from './interfaces/accessibility.interface.js';
export * from './interfaces/menu.interface.js';

export default Accessibility;
