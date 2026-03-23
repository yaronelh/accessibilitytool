import { IAccessibilityHotkeysOptions } from '../interfaces/accessibility.interface.js';

export function parseHotkeyLabel(
	hotkeys: IAccessibilityHotkeysOptions,
	hotkeyPrefix: string,
	arr: Array<any>
) {
	return hotkeys.enabled
		? hotkeys.helpTitles
			? hotkeyPrefix +
				arr
					.map(function (val) {
						return Number.isInteger(val)
							? String.fromCharCode(val).toLowerCase()
							: val.replace('Key', '');
					})
					.join('+')
			: ''
		: '';
}

export function findMatchingHotkey(
	keys: IAccessibilityHotkeysOptions['keys'],
	event: KeyboardEvent
) {
	return Object.entries(keys).find(function (entry) {
		const [, combo] = entry;
		let matches = true;

		for (let i = 0; i < combo.length; i++) {
			if (Number.isInteger(combo[i])) {
				if (event.keyCode !== combo[i]) matches = false;
			} else if ((event as unknown as Record<string, unknown>)[combo[i]] !== true) {
				matches = false;
			}
		}

		return matches;
	});
}
