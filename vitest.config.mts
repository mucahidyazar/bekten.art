import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/configured-*.ts',
        '**/database-*.ts',
        '**/ui-user.ts',
        'src/server/database/**',
      ],
      include: [
        'i18n.ts',
        'src/app/api/**/route.ts',
        'src/components/admin/*.tsx',
        'src/components/consent/**/*.{ts,tsx}',
        'src/components/forms/feedback-form.tsx',
        'src/components/lib/google-tag-manager.tsx',
        'src/components/molecules/newsletter-cta.tsx',
        'src/components/seo/*.tsx',
        'src/lib/localized-path.ts',
        'src/server/admin/admin-service.ts',
        'src/server/auth/**/*.ts',
        'src/server/contact/public-contact.ts',
        'src/server/email/**/*.ts',
        'src/server/operations/**/*.ts',
        'src/server/security/**/*.ts',
        'src/server/storage/**/*.ts',
        'src/utils/prepare-metadata.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
