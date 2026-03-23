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
	it('injects the icon, menu, and base stylesheet', () => {
		createInstance();

		expect(document.querySelector('._access-icon')).not.toBeNull();
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

	it('cleans up injected nodes on destroy', () => {
		const instance = createInstance();

		instance.destroy();

		expect(document.querySelector('._access-icon')).toBeNull();
		expect(document.querySelector('._access-menu')).toBeNull();
		expect(document.querySelector('._access-main-css')).toBeNull();
	});
});
