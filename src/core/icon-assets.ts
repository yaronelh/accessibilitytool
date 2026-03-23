import { IJsonToHtml } from '../interfaces/common.interface.js';

// Default icon shapes are sourced from the local Material icon packages:
// @material-design-icons/svg and @material-symbols/svg-400

const svgDataUri = (path: string, viewBox = '0 0 24 24') =>
	`data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none"><path fill="currentColor" d="${path}"/></svg>`
	)}`;

const svgMarkupUri = (markup: string) => `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;

const imageIcon = (path: string, className: string, viewBox?: string): IJsonToHtml => ({
	type: 'img',
	attrs: {
		src: svgDataUri(path, viewBox),
		alt: '',
		'aria-hidden': 'true',
		class: className
	}
});

type IconDefinition =
	| string
	| {
			path: string;
			viewBox: string;
	  };

const normalizeIconDefinition = (icon: IconDefinition) =>
	typeof icon === 'string' ? { path: icon, viewBox: '0 0 24 24' } : icon;

const ICON_PATHS: Record<string, IconDefinition> = {
	close: {
		path: 'M480-438 270-228q-9 9-21 9t-21-9q-9-9-9-21t9-21l210-210-210-210q-9-9-9-21t9-21q9-9 21-9t21 9l210 210 210-210q9-9 21-9t21 9q9 9 9 21t-9 21L522-480l210 210q9 9 9 21t-9 21q-9 9-21 9t-21-9L480-438Z',
		viewBox: '0 -960 960 960'
	},
	reset:
		{
			path: 'M418-126q-111-21-184.5-109T160-439q0-71 30-134t85-107q8-6 19-5.5t19 8.5q10 10 9 23t-13 23q-42 35-65.5 85.5T220-439q0 94 58 163.5T425-186q11 2 18.5 11t7.5 20q0 14-10 22.5t-23 6.5Zm126 0q-13 2-23-6.5T511-155q0-11 7.5-20t18.5-11q90-20 147-89.5T741-439q0-109-75.5-184.5T481-699h-20l39 39q8 8 8 21t-8 21q-9 9-22 9t-21-9l-91-90q-5-5-7-10t-2-11q0-6 2-11t7-10l91-91q8-8 21-8t22 8q8 9 8 22t-8 21l-39 39h20q134 0 227 93.5T801-439q0 116-73 204T544-126Z',
			viewBox: '0 -960 960 960'
		},
	increaseText: {
		path: 'm172-350-49 128q-4 10-12.56 16-8.55 6-19.44 6-19 0-29-15.5T59-248l192-488q5-11 14.16-17.5T285-760h30q11.45 0 20.22 6.5Q344-747 349-736l192 489q7 17-3.55 32-10.54 15-28.51 15-10.94 0-20.04-6.13-9.11-6.14-12.9-16.87l-48-127H172Zm24-64h208L302-685h-4L196-414Zm534-36H630q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h100v-100q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v100h100q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H790v100q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-100Z',
		viewBox: '0 -960 960 960'
	},
	decreaseText: {
		path: 'M640-450q-13 0-21.5-8.5T610-480q0-13 8.5-21.5T640-510h250q13 0 21.5 8.5T920-480q0 13-8.5 21.5T890-450H640ZM172-350l-49 128q-4 10-12.5 16T91-200q-19 0-29-15.5T59-248l192-488q5-11 14-17.5t20-6.5h30q11 0 20 6.5t14 17.5l192 489q7 17-3.5 32T509-200q-11 0-20-6t-13-17l-48-127H172Zm24-64h208L302-685h-4L196-414Z',
		viewBox: '0 -960 960 960'
	},
	increaseTextSpacing: {
		path: 'm210-683-67 66q-9 8-21 8t-21-9q-9-9-9-21t9-21l118-118q5-5 10-7t11-2q6 0 11 2t10 7l118 118q9 9 9 21t-9 21q-9 9-21 8.5t-21-8.5l-67-65v408l67-66q9-8 21-8t21 9q9 9 9 21t-9 21L261-180q-5 5-10 7t-11 2q-6 0-11-2t-10-7L101-298q-9-9-9-21t9-21q9-9 21-8.5t21 8.5l67 65v-408Zm300 483q-13 0-21.5-8.5T480-230q0-13 8.5-21.5T510-260h340q13 0 21.5 8.5T880-230q0 13-8.5 21.5T850-200H510Zm0-250q-13 0-21.5-8.5T480-480q0-13 8.5-21.5T510-510h340q13 0 21.5 8.5T880-480q0 13-8.5 21.5T850-450H510Zm0-250q-13 0-21.5-8.5T480-730q0-13 8.5-21.5T510-760h340q13 0 21.5 8.5T880-730q0 13-8.5 21.5T850-700H510Z',
		viewBox: '0 -960 960 960'
	},
	decreaseTextSpacing: {
		path: 'm210-683-67 66q-9 8-21 8t-21-9q-9-9-9-21t9-21l118-118q5-5 10-7t11-2q6 0 11 2t10 7l118 118q9 9 9 21t-9 21q-9 9-21 8.5t-21-8.5l-67-65v408l67-66q9-8 21-8t21 9q9 9 9 21t-9 21L261-180q-5 5-10 7t-11 2q-6 0-11-2t-10-7L101-298q-9-9-9-21t9-21q9-9 21-8.5t21 8.5l67 65v-408Zm300 483q-13 0-21.5-8.5T480-230q0-13 8.5-21.5T510-260h340q13 0 21.5 8.5T880-230q0 13-8.5 21.5T850-200H510Zm0-250q-13 0-21.5-8.5T480-480q0-13 8.5-21.5T510-510h340q13 0 21.5 8.5T880-480q0 13-8.5 21.5T850-450H510Zm0-250q-13 0-21.5-8.5T480-730q0-13 8.5-21.5T510-760h340q13 0 21.5 8.5T880-730q0 13-8.5 21.5T850-700H510Z',
		viewBox: '0 -960 960 960'
	},
	increaseLineHeight: {
		path: 'M450-235v-490l-67 66q-9 9-21 9t-21-9q-9-9-9-21t9-21l118-118q5-5 10-7t11-2q6 0 11 2t10 7l118 118q9 9 9 21t-9 21q-9 9-21.5 9t-21.5-9l-66-66v490l67-66q9-8 21-8.5t21 8.5q9 9 9 21t-9 21L501-141q-5 5-10 7t-11 2q-6 0-11-2t-10-7L341-259q-9-9-9-21t9-21q9-9 21-8.5t21 8.5l67 66Z',
		viewBox: '0 -960 960 960'
	},
	decreaseLineHeight: {
		path: 'M450-235v-490l-67 66q-9 9-21 9t-21-9q-9-9-9-21t9-21l118-118q5-5 10-7t11-2q6 0 11 2t10 7l118 118q9 9 9 21t-9 21q-9 9-21.5 9t-21.5-9l-66-66v490l67-66q9-8 21-8.5t21 8.5q9 9 9 21t-9 21L501-141q-5 5-10 7t-11 2q-6 0-11-2t-10-7L341-259q-9-9-9-21t9-21q9-9 21-8.5t21 8.5l67 66Z',
		viewBox: '0 -960 960 960'
	},
	invertColors: {
		path: 'M480-120q-132 0-226-91.5T160-435q0-66 25-122.5T254-658l194-191q7-7 15.5-10t16.5-3q8 0 16.5 3t15.5 10l194 191q44 44 69 100.5T800-435q0 131-93.5 223T480-120Zm0-60v-616L294-613q-36 36-55 80t-19 98q0 107 76.5 181T480-180Z',
		viewBox: '0 -960 960 960'
	},
	grayHues: {
		path: 'M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM510-141q38-4 74-16t70-31H510v47Zm0-107h219q14-17 27.5-34t24.5-37H510v71Zm0-131h294q8-17 10-35t3-36H510v71Zm0-131h307q-1-18-3-36t-10-35H510v71Zm0-131h271q-10-20-24-37l-28-34H510v71Zm0-131h144q-34-19-70-31.5T510-819v47Z',
		viewBox: '0 -960 960 960'
	},
	underlineLinks: {
		path: 'M230-140q-13 0-21.5-8.5T200-170q0-13 8.5-21.5T230-200h500q13 0 21.5 8.5T760-170q0 13-8.5 21.5T730-140H230Zm93.5-198.5Q267-397 267-497v-302q0-17 12.5-29t29.5-12q17 0 29 12t12 29v302q0 63 34 101t96 38q62 0 96-38t34-101v-302q0-17 12.5-29t29.5-12q17 0 29 12t12 29v302q0 100-56.5 158.5T480-280q-100 0-156.5-58.5Z',
		viewBox: '0 -960 960 960'
	},
	bigCursor:
		{
			path: 'M605-105q-19 9-38 2t-28-26L412-401 294-236q-13 18-33.5 11T240-254v-564q0-19 17-27t32 3l443 348q17 14 9.5 34T713-440H505l124 269q9 19 2 38t-26 28Z',
			viewBox: '0 -960 960 960'
		},
	readingGuide: {
		path: 'M190-390q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm0-120q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Z',
		viewBox: '0 -960 960 960'
	},
	textToSpeech: {
		path: 'M140-80q-24.75 0-42.37-17.63Q80-115.25 80-140v-680q0-24.75 17.63-42.38Q115.25-880 140-880h270q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H140v680h480v-80q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v80q0 24.75-17.62 42.37Q644.75-80 620-80H140Zm130-170q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h220q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H270Zm0-120q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h140q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H270Zm80-150q-12.5 0-21.25-8.75T320-550v-140q0-12.5 8.75-21.25T350-720h110l109-109q5-5 10.22-7 5.21-2 10.78-2 12.75 0 21.38 8.5Q620-821 620-808v376q0 13-8.62 21.5-8.63 8.5-21.38 8.5-6 0-11-2t-10-7L460-520H350Zm450-100q0 51-26.5 93.5T702-461q-8 4-15-.28-7-4.29-7-13.72v-298q0-9 7.5-14t15.5-1q46 25 71.5 70t25.5 98Zm60 0q0-76-41.5-139.5T708-856q-11-5-16-16.5t0-22.15Q697-906 709-911q12-5 23 0 86 40 137 118.5 51 78.51 51 172.5 0 94-51 172.5T732-329q-11 5-23 0t-17-16.35q-5-10.65 0-22.15 5-11.5 16-16.5 69-33 110.5-96.5T860-620Z',
		viewBox: '0 -960 960 960'
	},
	speechToText: {
		path: 'M689.57-570q-28.57 0-49.07-20.5T620-640v-160q0-29 20.56-49.5Q661.13-870 690-870q29 0 49.5 20.5T760-800v160q0 29-20.5 49.5T689.57-570ZM180-80q-24.75 0-42.37-17.63Q120-115.25 120-140v-680q0-24.75 17.63-42.38Q155.25-880 180-880h310q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H180v680h480v-80q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v80q0 24.75-17.62 42.37Q684.75-80 660-80H180Zm350-170H310q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h220q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5Zm-80-120H310q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h140q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5Zm240-120q54 0 94.5-33.5T836-607q3-14 12.1-23.5 9.11-9.5 22-9.5 12.9 0 20.9 10 8 10 6 24-11 68-59.5 116T720-432v72q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-72q-68-10-117-58t-60-116q-2-14 6-24t20.9-10q12.89 0 22 9.5Q541-621 544-607q11 50 51.5 83.5T690-490Z',
		viewBox: '0 -960 960 960'
	},
	disableAnimations: {
		path: 'M354-80q-56 0-106-20.5T159-160q-38-38-58.5-87.5T80-354q0-80 41.5-146T232-598q20-42 53-75t77-55q32-71 97.5-111.5T607-880q56 0 105.5 20.5T800-800q38 39 59 88t21 105q0 84-38.5 146.5T728-362q-20 44-52.5 76.5T598-232q-32 71-97.5 111.5T354-80Zm0-60q45 0 86.5-19.5T508-211q-63 7-120.5-12.5T286-286q-44-43-63-101t-12-121q-33 26-52 67.5T140-354q0 45 16 84t46 68q30 29 68.5 45.5T354-140Zm126-127q45 0 86-19t69-52q-63 7-120-13.5T415-416q-44-45-64-102.5T339-639q-40 38-56 73.5T267-480q0 44 16 83t46 69q29 29 68 45t83 16Z',
		viewBox: '0 -960 960 960'
	}
} as const;

export function createDefaultLauncherIcon() {
	return {
		type: 'img',
		attrs: {
			src: svgMarkupUri(
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
					<rect x="6" y="6" width="52" height="52" rx="12" fill="#5B93FF"/>
					<g transform="translate(13 13) scale(1.58)">
						<path fill="#fff" d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
					</g>
				</svg>`
			),
			alt: '',
			'aria-hidden': 'true',
			class: '_access-inline-icon _access-launcher-icon'
		}
	};
}

export function createDefaultCloseIcon() {
	const icon = normalizeIconDefinition(ICON_PATHS.close);
	return imageIcon(icon.path, '_access-inline-icon _access-close-icon', icon.viewBox);
}

export function createDefaultResetIcon() {
	const icon = normalizeIconDefinition(ICON_PATHS.reset);
	return imageIcon(icon.path, '_access-inline-icon _access-reset-icon', icon.viewBox);
}

export function buildBuiltinActionIconCss() {
	const actionMap = {
		increaseText: ICON_PATHS.increaseText,
		decreaseText: ICON_PATHS.decreaseText,
		increaseTextSpacing: ICON_PATHS.increaseTextSpacing,
		decreaseTextSpacing: ICON_PATHS.decreaseTextSpacing,
		increaseLineHeight: ICON_PATHS.increaseLineHeight,
		decreaseLineHeight: ICON_PATHS.decreaseLineHeight,
		invertColors: ICON_PATHS.invertColors,
		grayHues: ICON_PATHS.grayHues,
		underlineLinks: ICON_PATHS.underlineLinks,
		bigCursor: ICON_PATHS.bigCursor,
		readingGuide: ICON_PATHS.readingGuide,
		textToSpeech: ICON_PATHS.textToSpeech,
		speechToText: ICON_PATHS.speechToText,
		disableAnimations: ICON_PATHS.disableAnimations
	} as const;

	return Object.entries(actionMap)
		.map(
			([action, icon]) => {
				const definition = normalizeIconDefinition(icon);
				return `._access-menu ul li button[data-access-action="${action}"]:before {
                content: '';
                font-size: 0 !important;
                background-color: currentColor;
                -webkit-mask-image: url("${svgDataUri(definition.path, definition.viewBox)}");
                mask-image: url("${svgDataUri(definition.path, definition.viewBox)}");
                -webkit-mask-repeat: no-repeat;
                mask-repeat: no-repeat;
                -webkit-mask-position: center;
                mask-position: center;
                -webkit-mask-size: contain;
                mask-size: contain;
            }
            `;
			}
		)
		.join('\n');
}
