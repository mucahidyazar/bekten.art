import AxeBuilder from '@axe-core/playwright'

import type {Page} from '@playwright/test'

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const

export async function scanForWcagAaViolations(page: Page) {
  return new AxeBuilder({page}).withTags([...WCAG_AA_TAGS]).analyze()
}
