import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

import type {ReactNode} from 'react'

type StudioPageHeaderProps = Readonly<{
  action?: ReactNode
  description?: string
  eyebrow: string
  title: string
  titleId?: string
}>

type StudioMetricCardProps = Readonly<{
  label: string
  value: number | string
}>

type StudioEmptyStateProps = Readonly<{
  action?: ReactNode
  description: string
  title: string
}>

function StudioPageHeader({
  action,
  description,
  eyebrow,
  title,
  titleId,
}: StudioPageHeaderProps) {
  return (
    <header
      className="flex flex-wrap items-end justify-between gap-6"
      data-testid="studio-page-header"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.18em] text-[#6f2a1a] uppercase">
          {eyebrow}
        </p>
        <h1
          className="mt-3 font-serif text-4xl leading-none tracking-tight sm:text-5xl"
          id={titleId}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

function StudioMetricCard({label, value}: StudioMetricCardProps) {
  return (
    <Card
      className="border-stone-500/35 bg-[#f7f1e6] shadow-none"
      data-testid="studio-metric-card"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm leading-6 font-medium text-stone-600">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-4xl leading-none text-stone-950">
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function StudioEmptyState({action, description, title}: StudioEmptyStateProps) {
  return (
    <Card
      className="border-dashed border-stone-500/45 bg-[#f7f1e6]/70 shadow-none"
      data-testid="studio-empty-state"
    >
      <CardHeader>
        <CardTitle className="font-serif text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="max-w-xl leading-7 text-stone-700">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  )
}

export {StudioEmptyState, StudioMetricCard, StudioPageHeader}
