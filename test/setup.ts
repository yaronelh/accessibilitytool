import { afterEach, vi } from 'vitest';

function createSpeechSynthesisUtterance() {
	return function SpeechSynthesisUtterance(this: Record<string, unknown>, text: string) {
		this.text = text;
	};
}

Object.defineProperty(window, 'speechSynthesis', {
	configurable: true,
	writable: true,
	value: {
		cancel: vi.fn(),
		speak: vi.fn(),
		getVoices: () => []
	}
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
	configurable: true,
	writable: true,
	value: createSpeechSynthesisUtterance()
});

afterEach(() => {
	document.head.innerHTML = '';
	document.body.innerHTML = '';
	document.documentElement.className = '';
	window.localStorage.clear();
	vi.restoreAllMocks();
});
