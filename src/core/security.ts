export function escapeCssString(value: string) {
	return String(value)
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n');
}

export function sanitizeDomAttribute(tagName: string, attrName: string, attrValue: unknown) {
	const normalizedName = attrName.toLowerCase();

	if (normalizedName.startsWith('on')) return null;

	if (
		(normalizedName === 'src' || normalizedName === 'href') &&
		typeof attrValue === 'string' &&
		/^\s*javascript:/i.test(attrValue)
	) {
		return null;
	}

	if (
		tagName === 'iframe' &&
		normalizedName === 'src' &&
		typeof attrValue === 'string' &&
		/^\s*(data:|javascript:|file:)/i.test(attrValue)
	) {
		return null;
	}

	return String(attrValue);
}

export function normalizeIframeUrl(url: string, allowedOrigins: string[] = []) {
	try {
		const parsed = new URL(url, window.location.href);
		const sameOrigin = parsed.origin === window.location.origin;
		const allowed = allowedOrigins.includes(parsed.origin);

		if (sameOrigin || allowed) return parsed.toString();
		if (parsed.protocol === 'https:') return parsed.toString();
		return null;
	} catch (error) {
		return null;
	}
}
