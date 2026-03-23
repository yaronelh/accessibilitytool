export function isActivationEvent(event: Event | KeyboardEvent) {
	if (event.type === 'click') return true;
	if (!(event instanceof KeyboardEvent)) return true;

	return event.key === 'Enter';
}

export function getEventTarget<T extends HTMLElement>(event?: Event | null) {
	return ((event?.target as T | null) ?? null);
}
