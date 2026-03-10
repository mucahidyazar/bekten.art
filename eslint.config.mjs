import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import nextVitals from 'eslint-config-next/core-web-vitals'
import sortExports from 'eslint-plugin-sort-exports'
import unusedImports from 'eslint-plugin-unused-imports'

const config = [
  ...nextVitals,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      'sort-exports': sortExports,
      'unused-imports': unusedImports,
    },
    rules: {
      'react-hooks/exhaustive-deps': 0,
      'no-console': 0,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      'unused-imports/no-unused-imports': 'error',
      'sort-exports/sort-exports': ['error', {sortDir: 'asc'}],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'unknown',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {group: 'external', pattern: 'next', position: 'before'},
            {group: 'external', pattern: 'next/**', position: 'before'},
            {group: 'external', pattern: '@**', position: 'after'},
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          'newlines-between': 'always',
          alphabetize: {order: 'asc', caseInsensitive: true},
        },
      ],
      'react/display-name': 0,
      'react/no-unescaped-entities': 0,
      'no-multiple-empty-lines': ['error', {max: 1, maxEOF: 0, maxBOF: 0}],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        {blankLine: 'always', prev: '*', next: 'return'},
        {blankLine: 'always', prev: ['const', 'let', 'var'], next: '*'},
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        {blankLine: 'always', prev: 'directive', next: '*'},
        {blankLine: 'any', prev: 'directive', next: 'directive'},
      ],
    },
  },
]

export default config
