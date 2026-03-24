import { Accessibility } from '@yaronelh/accessibilitytool';

window.addEventListener('DOMContentLoaded', () => {
	const acc = new Accessibility();

	console.log('Accessibility instance created:', acc);
});
