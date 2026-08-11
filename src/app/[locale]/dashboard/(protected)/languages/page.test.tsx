import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudioEditor: vi.fn(),
  saveTranslationRowAction: vi.fn(),
  workspace: vi.fn(),
}))

vi.mock('@/server/translations/configured-translations', () => ({
  configuredTranslationService: {workspace: mocks.workspace},
}))
vi.mock('./translation-actions', () => ({
  saveTranslationRowAction: mocks.saveTranslationRowAction,
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import StudioLanguagesPage from './page'

const values = Object.freeze({
  en: Object.freeze({
    customized: false,
    defaultValue: 'Works',
    missing: false,
    value: 'Works',
  }),
  ky: Object.freeze({
    customized: false,
    defaultValue: 'Works',
    missing: true,
    value: 'Works',
  }),
  ru: Object.freeze({
    customized: false,
    defaultValue: 'Работы',
    missing: false,
    value: 'Работы',
  }),
  tr: Object.freeze({
    customized: true,
    defaultValue: 'Çalışmalar',
    missing: false,
    value: 'Eserler',
  }),
  de: Object.freeze({
    customized: false,
    defaultValue: 'Works',
    missing: true,
    value: 'Works',
  }),
})

describe('Studio translation management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioEditor.mockResolvedValue({id: 'owner', role: 'OWNER'})
    mocks.workspace.mockResolvedValue({
      entries: [
        {key: 'navigation.works', section: 'navigation', values},
        {
          key: 'footer.privacy',
          section: 'footer',
          values: Object.freeze({
            ...values,
            en: Object.freeze({
              ...values.en,
              defaultValue: 'Privacy',
              value: 'Privacy',
            }),
          }),
        },
      ],
      locales: [
        {code: 'en', nativeName: 'English', status: 'ACTIVE'},
        {code: 'tr', nativeName: 'Türkçe', status: 'ACTIVE'},
        {code: 'ru', nativeName: 'Русский', status: 'ACTIVE'},
        {code: 'ky', nativeName: 'Кыргызча', status: 'ACTIVE'},
        {code: 'de', nativeName: 'Deutsch', status: 'DRAFT'},
      ],
      sections: ['navigation', 'footer'],
    })
  })

  it('presents public/locales as searchable defaults with database customizations', async () => {
    render(
      await StudioLanguagesPage({
        searchParams: Promise.resolve({}),
      }),
    )

    expect(
      screen.getByRole('heading', {name: 'Interface translations'}),
    ).toBeVisible()
    expect(screen.getByText(/public\/locales/u)).toBeVisible()
    expect(screen.getByRole('heading', {name: 'English'})).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Türkçe'})).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Русский'})).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Кыргызча'})).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Deutsch'})).toBeVisible()
    expect(screen.getByRole('button', {name: 'Add language'})).toBeVisible()
    expect(
      screen.getByRole('searchbox', {name: 'Search translations'}),
    ).toBeVisible()
    expect(
      screen.getByRole('combobox', {name: 'Translation section'}),
    ).toBeVisible()
    expect(screen.getByText('navigation.works')).toBeVisible()
    expect(screen.getByText('footer.privacy')).toBeVisible()
  })

  it('filters translation keys by section and query on the server', async () => {
    render(
      await StudioLanguagesPage({
        searchParams: Promise.resolve({query: 'privacy', section: 'footer'}),
      }),
    )

    expect(screen.getByText('footer.privacy')).toBeVisible()
    expect(screen.queryByText('navigation.works')).not.toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', {name: 'Search translations'}),
    ).toHaveValue('privacy')
    expect(
      screen.getByRole('combobox', {name: 'Translation section'}),
    ).toHaveValue('footer')
  })

  it('opens a translation row into the dynamic language editor', async () => {
    const user = userEvent.setup()

    render(
      await StudioLanguagesPage({
        searchParams: Promise.resolve({query: 'navigation.works'}),
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: /^navigation\.worksNavigation/u,
      }),
    )

    expect(screen.getByLabelText('English')).toHaveValue('Works')
    expect(screen.getByLabelText('Türkçe')).toHaveValue('Eserler')
    expect(screen.getByLabelText('Русский')).toHaveValue('Работы')
    expect(screen.getByLabelText('Кыргызча')).toHaveValue('Works')
    expect(screen.getByLabelText('Deutsch')).toHaveValue('Works')
  })
})
