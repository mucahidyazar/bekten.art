import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

import {describe, expect, it} from 'vitest'

const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8')

function model(name: string) {
  const match = new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`, 'u').exec(
    schema,
  )

  expect(match, `${name} model is missing`).not.toBeNull()

  return match?.[1] ?? ''
}

describe('dynamic Dashboard schema', () => {
  it('stores publishable site locales and translation overrides by locale', () => {
    const locale = model('SiteLocale')
    const override = model('UiTranslationOverride')

    expect(schema).toMatch(/enum SiteLocaleStatus\s+\{[\s\S]*DRAFT[\s\S]*ACTIVE[\s\S]*DISABLED/u)
    expect(locale).toMatch(/code\s+String\s+@id/u)
    expect(locale).toMatch(/direction\s+TextDirection/u)
    expect(locale).toMatch(/status\s+SiteLocaleStatus/u)
    expect(locale).toMatch(/isDefault\s+Boolean/u)
    expect(override).toMatch(/siteLocale\s+SiteLocale/u)
  })

  it('groups editorial locale variants without guessing from their titles', () => {
    for (const name of [
      'Artwork',
      'Collection',
      'Exhibition',
      'JournalEntry',
      'Page',
      'PressItem',
    ]) {
      expect(model(name)).toMatch(
        /translationGroupId\s+String\s+@default\(uuid\(\)\)/u,
      )
    }
  })

  it('adds virtual media folders while keeping Garage object keys immutable', () => {
    const folder = model('MediaFolder')
    const media = model('MediaObject')

    expect(folder).toMatch(/parentId\s+String\?/u)
    expect(folder).toMatch(/normalizedName\s+String/u)
    expect(media).toMatch(/displayName\s+String/u)
    expect(media).toMatch(/folderId\s+String\?/u)
    expect(media).toMatch(/version\s+Int\s+@default\(1\)/u)
    expect(media).toMatch(/objectKey\s+String\s+@unique/u)
  })

  it('tracks invitation and suspension state for Dashboard users', () => {
    const user = model('User')

    expect(schema).toMatch(/enum StudioAccountStatus\s+\{[\s\S]*INVITED[\s\S]*ACTIVE[\s\S]*SUSPENDED/u)
    expect(user).toMatch(/studioStatus\s+StudioAccountStatus/u)
    expect(user).toMatch(/invitedAt\s+DateTime\?/u)
    expect(user).toMatch(/invitedByUserId\s+String\?/u)
  })

  it('does not retain credentials from the removed public password login', () => {
    const user = model('User')

    expect(user).not.toMatch(/passwordHash|passwordResetRequired/u)
    expect(schema).not.toMatch(/model PasswordResetToken/u)
  })
})
