import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

import PrivacyPolicyPage, {
  generateMetadata as generatePrivacyMetadata,
} from './privacy-policy/page'
import TermsOfServicePage, {
  generateMetadata as generateTermsMetadata,
} from './terms-of-service/page'

describe('localized legal pages', () => {
  it.each([
    ['privacy', PrivacyPolicyPage],
    ['terms', TermsOfServicePage],
  ] as const)('%s uses valid heading and list semantics', (_label, Page) => {
    const {container} = render(<Page />)

    expect(screen.getAllByRole('heading').length).toBeGreaterThan(1)
    expect(container.querySelector('ul > h2')).not.toBeInTheDocument()
    expect(container.querySelectorAll('section > h2').length).toBeGreaterThan(0)
  })

  it('publishes localized canonical metadata for both legal routes', async () => {
    await expect(
      generatePrivacyMetadata({params: Promise.resolve({locale: 'tr'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/tr/privacy-policy'},
      title: 'Gizlilik Politikası',
    })
    await expect(
      generateTermsMetadata({params: Promise.resolve({locale: 'en'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/terms-of-service'},
      title: 'Terms of Service',
    })
    await expect(
      generatePrivacyMetadata({params: Promise.resolve({locale: 'de'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/de/privacy-policy'},
      title: 'Privacy Policy',
    })
  })
})
