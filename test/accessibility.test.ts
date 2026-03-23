import { describe, expect, it } from 'vitest';

import { Accessibility } from '../src/main';

function createInstance(options: ConstructorParameters<typeof Accessibility>[0] = {}) {
	document.head.innerHTML = '';
	document.body.innerHTML = '<div id="fixture"><p>hello world</p></div>';
	document.documentElement.style.fontSize = '16px';
	document.body.style.fontSize = '16px';

	return new Accessibility({
		icon: {
			useEmojis: true
		},
		modules: {
			speechToText: false,
			textToSpeech: false
		},
		session: {
			persistent: false
		},
		...options
	});
}

describe('Accessibility', () => {
	it('defaults to emoji icons and does not inject remote font links', () => {
		document.head.innerHTML = '';
		document.body.innerHTML = '<div id="fixture"><p>hello world</p></div>';
		document.documentElement.style.fontSize = '16px';
		document.body.style.fontSize = '16px';

		const instance = new Accessibility({
			modules: {
				speechToText: false,
				textToSpeech: false
			},
			session: {
				persistent: false
			}
		});

		expect(instance.options.icon.useEmojis).toBe(true);
		expect(document.head.querySelector('link[rel="stylesheet"]')).toBeNull();
		expect(document.querySelector('._access-icon img')).not.toBeNull();
	});

	it('only injects remote icon font links when explicitly allowed', () => {
		document.head.innerHTML = '';
		document.body.innerHTML = '<div id="fixture"><p>hello world</p></div>';
		document.documentElement.style.fontSize = '16px';
		document.body.style.fontSize = '16px';

		new Accessibility({
			icon: {
				useEmojis: false,
				allowRemoteFonts: true,
				fontClass: 'material-icons',
				fontFaceSrc: ['https://example.com/icons.css']
			},
			modules: {
				speechToText: false,
				textToSpeech: false
			},
			session: {
				persistent: false
			}
		});

		expect(document.head.querySelector('link[href="https://example.com/icons.css"]')).not.toBeNull();
	});

	it('falls back to emoji icons when a remote font URL is configured without opt-in', () => {
		document.head.innerHTML = '';
		document.body.innerHTML = '<div id="fixture"><p>hello world</p></div>';
		document.documentElement.style.fontSize = '16px';
		document.body.style.fontSize = '16px';

		const instance = new Accessibility({
			icon: {
				useEmojis: false,
				fontClass: 'material-icons',
				fontFaceSrc: ['https://example.com/icons.css']
			},
			modules: {
				speechToText: false,
				textToSpeech: false
			},
			session: {
				persistent: false
			}
		});

		expect(instance.options.icon.useEmojis).toBe(true);
		expect(document.head.querySelector('link[href="https://example.com/icons.css"]')).toBeNull();
		expect(document.querySelector('._access-icon img')).not.toBeNull();
	});

	it('injects the icon, menu, and base stylesheet', () => {
		createInstance();

		expect(document.querySelector('._access-icon')).not.toBeNull();
		expect(document.querySelector('._access-menu ._menu-close-btn img')).not.toBeNull();
		expect(document.querySelector('._access-menu')).not.toBeNull();
		expect(document.querySelector('._access-main-css')).not.toBeNull();
	});

	it('updates session state when menu interface actions run', () => {
		const instance = createInstance();

		instance.menuInterface.increaseText();

		expect(instance.sessionState.textSize).toBe(1);
		expect(document.documentElement.style.fontSize).not.toBe('');
	});

	it('does not inject icon or menu when DOM injection is suppressed', () => {
		createInstance({
			suppressDomInjection: true
		});

		expect(document.querySelector('._access-icon')).toBeNull();
		expect(document.querySelector('._access-menu')).toBeNull();
		expect(document.querySelector('._access-main-css')).not.toBeNull();
	});

	it('opens the menu on keyboard activation without relying on window.event', () => {
		createInstance();

		const icon = document.querySelector('._access-icon');
		const menu = document.querySelector('._access-menu');

		icon?.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));

		expect(menu?.classList.contains('close')).toBe(false);
	});

	it('keeps icon and menu accessibility state in sync when toggled', () => {
		createInstance();

		const icon = document.querySelector('._access-icon') as HTMLElement | null;
		const menu = document.querySelector('._access-menu') as HTMLElement | null;

		expect(icon?.getAttribute('aria-expanded')).toBe('false');
		expect(menu?.getAttribute('aria-hidden')).toBe('true');

		icon?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(icon?.getAttribute('aria-expanded')).toBe('true');
		expect(menu?.getAttribute('aria-hidden')).toBe('false');
		expect(document.activeElement?.classList.contains('_menu-close-btn')).toBe(true);
	});

	it('closes the menu with Escape and restores focus to the toggle', () => {
		createInstance();

		const icon = document.querySelector('._access-icon') as HTMLElement | null;
		const menu = document.querySelector('._access-menu') as HTMLElement | null;

		icon?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		expect(menu?.classList.contains('close')).toBe(true);
		expect(icon?.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(icon);
	});

	it('cleans up injected nodes on destroy', () => {
		const instance = createInstance();

		instance.destroy();

		expect(document.querySelector('._access-icon')).toBeNull();
		expect(document.querySelector('._access-menu')).toBeNull();
		expect(document.querySelector('._access-main-css')).toBeNull();
	});
});
