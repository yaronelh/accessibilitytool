import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
	{
		ignores: ['dist/**', 'dist-cjs/**', 'coverage/**', 'node_modules/**']
	},
	{
		files: ['**/*.{ts,js,mjs}'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			'no-console': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	}
];
