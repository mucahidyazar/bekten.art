import Link from 'next/link'

import {Filter, Languages, Search} from 'lucide-react'

import {
  NAV_FORWARD_TRANSITION,
  PublicPageTransition,
} from '@/components/public-site/public-view-transition'
import {StudioPageHeader} from '@/components/studio/studio-dashboard-components'
import {StudioLocaleManager} from '@/components/studio/studio-locale-manager'
import {StudioTranslationEditor} from '@/components/studio/studio-translation-editor'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {Badge} from '@/components/ui/badge'
import {Button, buttonVariants} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {isStudioOwnerRole} from '@/server/studio-auth/roles'
import {configuredTranslationService} from '@/server/translations/configured-translations'

import {
  createSiteLocaleAction,
  updateSiteLocaleStatusAction,
} from './site-locale-actions'
import {saveTranslationRowAction} from './translation-actions'

type SearchParameters = Promise<
  Readonly<{
    query?: string | string[]
    section?: string | string[]
  }>
>

function singleParameter(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) ?? ''
}

function sectionLabel(section: string) {
  return section
    .replaceAll(/([a-z])([A-Z])/gu, '$1 $2')
    .replaceAll(/[-_]/gu, ' ')
    .replace(/^./u, character => character.toUpperCase())
}

export default async function StudioLanguagesPage({
  searchParams,
}: Readonly<{searchParams: SearchParameters}>) {
  const user = await requireStudioEditor()
  const [workspace, parameters] = await Promise.all([
    configuredTranslationService.workspace(),
    searchParams,
  ])
  const query = singleParameter(parameters.query)
  const requestedSection = singleParameter(parameters.section)
  const section = workspace.sections.includes(requestedSection)
    ? requestedSection
    : 'all'
  const normalizedQuery = query.toLocaleLowerCase('en')
  const visibleEntries = workspace.entries.filter(entry => {
    const matchesSection = section === 'all' || entry.section === section
    const searchable = [
      entry.key,
      ...workspace.locales.map(
        locale => entry.values[locale.code]?.value ?? '',
      ),
    ]
      .join('\n')
      .toLocaleLowerCase('en')

    return (
      matchesSection &&
      (!normalizedQuery || searchable.includes(normalizedQuery))
    )
  })
  const localeSummaries = workspace.locales.map(locale => {
    const values = workspace.entries
      .map(entry => entry.values[locale.code])
      .filter(value => value !== undefined)

    return Object.freeze({
      code: locale.code,
      customized: values.filter(value => value.customized).length,
      missing: values.filter(value => value.missing).length,
      nativeName: locale.nativeName,
      status: locale.status,
      total: workspace.entries.length,
    })
  })

  return (
    <PublicPageTransition>
      <section aria-labelledby="studio-languages-title">
        <StudioPageHeader
          description="Review and customize the interface copy stored in public/locales. File values remain the safe defaults; Dashboard changes are versionable database overrides."
          eyebrow="Settings · Public language"
          title="Interface translations"
          titleId="studio-languages-title"
        />

        <StudioLocaleManager
          canManage={isStudioOwnerRole(user.role)}
          createAction={createSiteLocaleAction}
          locales={localeSummaries}
          updateStatusAction={updateSiteLocaleStatusAction}
        />

        <Card className="mt-8 border-stone-500/35 bg-[#f7f1e6] shadow-none">
          <CardHeader className="border-b border-stone-500/25">
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Languages aria-hidden="true" className="size-5" />
              Translation workspace
            </CardTitle>
            <CardDescription>
              Search by translation key or visible copy. Saving the exact file
              value removes that locale&apos;s customization.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              action="/dashboard/languages"
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem_auto] lg:items-end"
              role="search"
            >
              <label>
                <span className="text-sm font-semibold text-stone-800">
                  Search translations
                </span>
                <span className="relative mt-2 block">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-500"
                  />
                  <Input
                    aria-label="Search translations"
                    className="h-11 border-stone-500/40 bg-[#fffaf0] pl-10 focus-visible:ring-[#6f2a1a]/25"
                    defaultValue={query}
                    name="query"
                    placeholder="navigation.works or visible text"
                    type="search"
                  />
                </span>
              </label>
              <label>
                <span className="text-sm font-semibold text-stone-800">
                  Section
                </span>
                <select
                  aria-label="Translation section"
                  className="mt-2 h-11 w-full rounded-md border border-stone-500/40 bg-[#fffaf0] px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/25 focus-visible:outline-none"
                  defaultValue={section}
                  name="section"
                >
                  <option value="all">All sections</option>
                  {workspace.sections.map(candidate => (
                    <option key={candidate} value={candidate}>
                      {sectionLabel(candidate)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <Button
                  className="h-11 bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#552014]"
                  type="submit"
                >
                  <Filter aria-hidden="true" className="size-4" />
                  Filter
                </Button>
                {query || section !== 'all' ? (
                  <Link
                    className={buttonVariants({
                      className: 'h-11',
                      variant: 'outline',
                    })}
                    href="/dashboard/languages"
                    transitionTypes={[...NAV_FORWARD_TRANSITION]}
                  >
                    Clear
                  </Link>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
          <p>
            Showing {visibleEntries.length} of {workspace.entries.length}{' '}
            translation keys
          </p>
          <p>Open a row to edit every registered language together.</p>
        </div>

        {visibleEntries.length > 0 ? (
          <Accordion
            className="mt-4 overflow-hidden border border-stone-500/35 bg-[#f7f1e6]"
            type="multiple"
          >
            {visibleEntries.map(entry => {
              const customized = workspace.locales.filter(
                locale => entry.values[locale.code]?.customized,
              ).length
              const missing = workspace.locales.filter(
                locale => entry.values[locale.code]?.missing,
              ).length

              return (
                <AccordionItem
                  className="border-stone-500/30 px-5 last:border-b-0"
                  key={entry.key}
                  value={entry.key}
                >
                  <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-semibold text-stone-900">
                        {entry.key}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {sectionLabel(entry.section)}
                        </Badge>
                        {customized > 0 ? (
                          <Badge
                            className="border-[#7d3b27]/40 bg-[#ead8cc] text-[#6f2a1a]"
                            variant="outline"
                          >
                            {customized} customized
                          </Badge>
                        ) : null}
                        {missing > 0 ? (
                          <Badge
                            className="border-amber-700/35 bg-amber-50 text-amber-900"
                            variant="outline"
                          >
                            {missing} missing
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1">
                    <StudioTranslationEditor
                      action={saveTranslationRowAction}
                      entry={entry}
                      locales={workspace.locales}
                    />
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <Card className="mt-4 border-dashed border-stone-500/40 bg-[#f7f1e6] shadow-none">
            <CardContent className="py-14 text-center">
              <p className="font-serif text-2xl text-stone-900">
                No translations found
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Try another phrase or clear the section filter.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </PublicPageTransition>
  )
}
