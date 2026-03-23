import {
	AccessibilityModulesType,
	IAccessibilityModuleOrder,
	IAccessibilityOptions
} from '../interfaces/accessibility.interface.js';
import { Common } from '../common.js';

export function addDefaultIconOptions(
	targetOptions: IAccessibilityOptions,
	userOptions: IAccessibilityOptions
) {
	if (userOptions.icon?.closeIconElem) targetOptions.icon.closeIconElem = userOptions.icon.closeIconElem;
	if (userOptions.icon?.resetIconElem) targetOptions.icon.resetIconElem = userOptions.icon.resetIconElem;
	if (userOptions.icon?.imgElem) targetOptions.icon.imgElem = userOptions.icon.imgElem;

	if (!targetOptions.icon.closeIconElem) {
		targetOptions.icon.closeIconElem = {
			type: '#text',
			text: `${!targetOptions.icon.useEmojis ? targetOptions.icon.closeIcon : 'X'}`
		};
	}

	if (!targetOptions.icon.resetIconElem) {
		targetOptions.icon.resetIconElem = {
			type: '#text',
			text: `${!targetOptions.icon.useEmojis ? targetOptions.icon.resetIcon : '♲'}`
		};
	}

	if (!targetOptions.icon.imgElem) {
		targetOptions.icon.imgElem = {
			type: '#text',
			text: targetOptions.icon.img
		};
	}
}

export function ensureModuleOrder(
	defaultOrder: Array<IAccessibilityModuleOrder>,
	modulesOrder: Array<IAccessibilityModuleOrder>
) {
	defaultOrder.forEach((moduleOrder) => {
		if (!modulesOrder.find((existingOrder) => existingOrder.type === moduleOrder.type)) {
			modulesOrder.push(moduleOrder);
		}
	});
}

export function disableUnsupportedFeatures(common: Common, options: IAccessibilityOptions) {
	if (!('webkitSpeechRecognition' in window) || location.protocol !== 'https:') {
		common.warn("speech to text isn't supported in this browser or in http protocol (https required)");
		options.modules.speechToText = false;
	}

	const windowAny = window as any;
	if (!windowAny.SpeechSynthesisUtterance || !windowAny.speechSynthesis) {
		common.warn("text to speech isn't supported in this browser");
		options.modules.textToSpeech = false;
	}
}

export function buildDefaultModuleOrder() {
	const modulesOrder = [] as Array<IAccessibilityModuleOrder>;
	const keys = Object.keys(AccessibilityModulesType);

	keys.forEach((key) => {
		const keyNum = parseInt(key);
		if (!isNaN(keyNum)) {
			modulesOrder.push({
				type: keyNum,
				order: keyNum
			});
		}
	});

	return modulesOrder;
}
