import { describe, expect, it } from 'vitest';

import { Common } from '../src/common';
import { normalizeIframeUrl } from '../src/core/security';
import { Storage } from '../src/storage';
import { restoreSessionState, saveSessionState } from '../src/core/session';

describe('security hardening', () => {
	it('strips unsafe DOM event handler and javascript URL attributes', () => {
		const common = new Common();

		const element = common.jsonToHtml({
			type: 'a',
			attrs: {
				href: 'javascript:alert(1)',
				onclick: 'alert(1)',
				title: 'safe'
			},
			children: [
				{
					type: '#text',
					text: 'safe'
				}
			]
		});

		expect(element.hasAttribute('onclick')).toBe(false);
		expect(element.hasAttribute('href')).toBe(false);
		expect(element.getAttribute('title')).toBe('safe');
	});

	it('allows https iframe URLs and blocks external http URLs', () => {
		expect(normalizeIframeUrl('https://example.com/help')).toBe('https://example.com/help');
		expect(normalizeIframeUrl('http://example.com/help')).toBeNull();
	});

	it('saves session state under the namespaced storage key and restores from the legacy key', () => {
		const storage = new Storage();
		const sessionState = {
			textSize: 1,
			textSpace: 0,
			lineHeight: 0,
			invertColors: false,
			grayHues: false,
			underlineLinks: false,
			bigCursor: false,
			readingGuide: false
		};

		saveSessionState(storage, sessionState);

		expect(storage.get('accessibility:session:v1')).toEqual(sessionState);
		expect(storage.get('_accessState')).toBeNull();

		storage.remove('accessibility:session:v1');
		storage.set('_accessState', sessionState);

		let restored = null as typeof sessionState | null;
		restoreSessionState(storage, {
			applyTextSize: () => {},
			applyTextSpace: () => {},
			applyLineHeight: () => {},
			enableInvertColors: () => {},
			enableGrayHues: () => {},
			enableUnderlineLinks: () => {},
			enableBigCursor: () => {},
			enableReadingGuide: () => {},
			assignSessionState: (value) => {
				restored = value;
			}
		});

		expect(restored).toEqual(sessionState);
	});
});
