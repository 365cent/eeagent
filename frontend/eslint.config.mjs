const clientApiPath = 'lib/api/client.ts'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['.next/**', 'node_modules/**', 'public/**'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: `Use HTTP helpers from ${clientApiPath} instead of calling fetch() directly.`,
        },
      ],
    },
  },
  {
    files: ['lib/api/client.ts', 'lib/api/**/*.ts', 'lib/evidence/archive-figures.ts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
]
