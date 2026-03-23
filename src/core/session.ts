import { Storage } from '../storage.js';
import { ISessionState } from '../interfaces/accessibility.interface.js';

const SESSION_STORAGE_KEY = '_accessState';

export function saveSessionState(storage: Storage, sessionState: ISessionState) {
	storage.set(SESSION_STORAGE_KEY, sessionState);
}

export function restoreSessionState(
	storage: Storage,
	handlers: {
		applyTextSize(isIncrease: boolean): void;
		applyTextSpace(isIncrease: boolean): void;
		applyLineHeight(isIncrease: boolean): void;
		enableInvertColors(): void;
		enableGrayHues(): void;
		enableUnderlineLinks(): void;
		enableBigCursor(): void;
		enableReadingGuide(): void;
		assignSessionState(sessionState: ISessionState): void;
	}
) {
	const sessionState = storage.get(SESSION_STORAGE_KEY) as ISessionState | null;
	if (!sessionState) return;

	replayDelta(sessionState.textSize, handlers.applyTextSize);
	replayDelta(sessionState.textSpace, handlers.applyTextSpace);
	replayDelta(sessionState.lineHeight, handlers.applyLineHeight);

	if (sessionState.invertColors) handlers.enableInvertColors();
	if (sessionState.grayHues) handlers.enableGrayHues();
	if (sessionState.underlineLinks) handlers.enableUnderlineLinks();
	if (sessionState.bigCursor) handlers.enableBigCursor();
	if (sessionState.readingGuide) handlers.enableReadingGuide();

	handlers.assignSessionState(sessionState);
}

function replayDelta(value: number, apply: (isIncrease: boolean) => void) {
	if (!value) return;

	if (value > 0) {
		while (value--) apply(true);
	} else {
		while (value++) apply(false);
	}
}
