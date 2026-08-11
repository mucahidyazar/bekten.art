import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {StudioTranslationEditor} from './studio-translation-editor'

const entry = Object.freeze({
  key: 'navigation.works',
  values: Object.freeze({
    en: Object.freeze({
      customized: true,
      defaultValue: 'Works',
      missing: false,
      value: 'Artworks',
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
      customized: false,
      defaultValue: 'Çalışmalar',
      missing: false,
      value: 'Çalışmalar',
    }),
    de: Object.freeze({
      customized: false,
      defaultValue: 'Works',
      missing: true,
      value: 'Works',
    }),
  }),
})

const locales = Object.freeze([
  {code: 'en', nativeName: 'English'},
  {code: 'tr', nativeName: 'Türkçe'},
  {code: 'ru', nativeName: 'Русский'},
  {code: 'ky', nativeName: 'Кыргызча'},
  {code: 'de', nativeName: 'Deutsch'},
])

describe('Studio translation editor', () => {
  it('edits every registered locale in compact fields and restores a fallback', async () => {
    const user = userEvent.setup()

    render(
      <StudioTranslationEditor
        action={vi.fn()}
        entry={entry}
        locales={locales}
      />,
    )

    expect(screen.getByLabelText('English')).toHaveValue('Artworks')
    expect(screen.getByText('Customized')).toBeVisible()
    expect(
      screen.getAllByText('Missing · English fallback'),
    ).toHaveLength(2)
    expect(
      screen.getByRole('button', {name: 'Use English fallback for Кыргызча'}),
    ).toBeVisible()
    expect(screen.getByLabelText('Deutsch')).toHaveValue('Works')
    expect(screen.getByLabelText('English')).toHaveAttribute('rows', '2')

    await user.click(
      screen.getByRole('button', {name: 'Use English file default'}),
    )

    expect(screen.getByLabelText('English')).toHaveValue('Works')
    expect(
      screen.getByRole('button', {name: 'Save translations'}),
    ).toBeVisible()
  })

  it('submits the canonical key without exposing it as editable input', () => {
    const {container} = render(
      <StudioTranslationEditor
        action={vi.fn()}
        entry={entry}
        locales={locales}
      />,
    )

    expect(container.querySelector('input[name="key"]')).toHaveValue(
      'navigation.works',
    )
    expect(container.querySelector('input[name="key"]')).toHaveAttribute(
      'type',
      'hidden',
    )
  })

  it('uses whitespace-free field identifiers for human-readable catalogue keys', () => {
    render(
      <StudioTranslationEditor
        action={vi.fn()}
        entry={{...entry, key: 'contact.workingHours.Monday - Friday'}}
        locales={locales}
      />,
    )

    expect(screen.getByLabelText('English').id).not.toMatch(/\s/u)
    expect(screen.getByLabelText('Кыргызча').id).not.toMatch(/\s/u)
  })
})
