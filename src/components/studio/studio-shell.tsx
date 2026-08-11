'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {
  BookOpenText,
  Boxes,
  CircleGauge,
  FileText,
  History,
  ImageIcon,
  Images,
  Inbox,
  Languages,
  Newspaper,
  PanelsTopLeft,
  Settings2,
  Users,
} from 'lucide-react'
import {useEffect, useRef} from 'react'

import {NAV_LATERAL_TRANSITION} from '@/components/public-site/public-view-transition'
import {Badge} from '@/components/ui/badge'
import {buttonVariants} from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {cn} from '@/utils'

import type {LucideIcon} from 'lucide-react'
import type {ReactNode} from 'react'

type StudioNavigationItem = Readonly<{
  href: string
  icon: LucideIcon
  label: string
}>

const navigationGroups: readonly Readonly<{
  items: readonly StudioNavigationItem[]
  label: string
}>[] = [
  {
    items: [{href: '/dashboard', icon: CircleGauge, label: 'Overview'}],
    label: 'Workspace',
  },
  {
    items: [
      {href: '/dashboard/artworks', icon: ImageIcon, label: 'Artworks'},
      {href: '/dashboard/collections', icon: Boxes, label: 'Collections'},
      {
        href: '/dashboard/exhibitions',
        icon: PanelsTopLeft,
        label: 'Exhibitions',
      },
      {href: '/dashboard/journal', icon: BookOpenText, label: 'Journal'},
      {href: '/dashboard/pages', icon: FileText, label: 'Pages'},
      {href: '/dashboard/press', icon: Newspaper, label: 'Press'},
    ],
    label: 'Content',
  },
  {
    items: [
      {href: '/dashboard/languages', icon: Languages, label: 'Languages'},
      {href: '/dashboard/inquiries', icon: Inbox, label: 'Inquiries'},
      {href: '/dashboard/media', icon: Images, label: 'Media'},
    ],
    label: 'Publishing',
  },
]

const ownerNavigationItems: readonly StudioNavigationItem[] = [
  {href: '/dashboard/users', icon: Users, label: 'Users'},
  {href: '/dashboard/activity', icon: History, label: 'Activity'},
  {href: '/dashboard/operations', icon: Settings2, label: 'Operations'},
]

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href

  return pathname === href || pathname.startsWith(`${href}/`)
}

function currentPageLabel(pathname: string) {
  const items = [
    ...navigationGroups.flatMap(group => group.items),
    ...ownerNavigationItems,
  ]

  return (
    items.find(item => isActivePath(pathname, item.href))?.label ??
    (pathname.includes('/new') ? 'New draft' : 'Bekten Studio')
  )
}

function StudioNavigation({owner}: Readonly<{owner: boolean}>) {
  const pathname = usePathname()
  const {setMobileOpen} = useSidebar()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      setMobileOpen(false)
      previousPathname.current = pathname
    }
  }, [pathname, setMobileOpen])

  return (
    <>
      <SidebarContent>
        <nav aria-label="Studio">
          {navigationGroups.map(group => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map(item => {
                  const active = isActivePath(pathname, item.href)
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton active={active}>
                        <Link
                          aria-current={active ? 'page' : undefined}
                          href={item.href}
                          title={item.label}
                          transitionTypes={[...NAV_LATERAL_TRANSITION]}
                        >
                          <Icon aria-hidden="true" className="size-[1.15rem]" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}

          {owner ? (
            <SidebarGroup>
              <SidebarGroupLabel>Owner</SidebarGroupLabel>
              <SidebarMenu>
                {ownerNavigationItems.map(item => {
                  const active = isActivePath(pathname, item.href)
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton active={active}>
                        <Link
                          aria-current={active ? 'page' : undefined}
                          href={item.href}
                          title={item.label}
                          transitionTypes={[...NAV_LATERAL_TRANSITION]}
                        >
                          <Icon aria-hidden="true" className="size-[1.15rem]" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 group-data-[state=collapsed]/studio-shell:justify-center">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#6f2a1a] font-serif text-sm text-[#fffaf0]">
            B
          </span>
          <div className="min-w-0 group-data-[state=collapsed]/studio-shell:sr-only">
            <p className="truncate text-sm font-semibold">
              Editorial workspace
            </p>
            <p className="truncate text-xs text-stone-600">
              {owner ? 'Owner access' : 'Editor access'}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </>
  )
}

function StudioShellFrame({
  children,
  owner,
}: Readonly<{children: ReactNode; owner: boolean}>) {
  const pathname = usePathname()

  return (
    <>
      <a
        className="sr-only z-50 bg-stone-950 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#studio-content"
      >
        Skip to Studio content
      </a>

      <Sidebar>
        <SidebarHeader className="h-16 p-0" data-testid="studio-sidebar-header">
          <div className="relative flex h-16 items-center px-4">
            <Link
              className="min-w-0 flex-1 group-data-[state=collapsed]/studio-shell:hidden"
              href="/dashboard"
              transitionTypes={[...NAV_LATERAL_TRANSITION]}
            >
              <Image
                alt="Bekten Studio"
                className="h-auto w-28"
                height={68}
                priority
                src="/svg/full-logo.svg"
                width={210}
              />
            </Link>
            <SidebarTrigger className="hidden shrink-0 md:absolute md:-right-[1.375rem] md:-bottom-[1.375rem] md:z-30 md:inline-flex" />
          </div>
        </SidebarHeader>
        <StudioNavigation owner={owner} />
      </Sidebar>

      <SidebarInset>
        <header
          className="sticky top-0 z-20 flex h-16 min-h-16 items-center gap-3 border-b border-stone-500/30 bg-[#f7f1e6]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8"
          style={{viewTransitionName: 'persistent-dashboard-header'}}
        >
          <SidebarTrigger className="md:hidden" data-testid="studio-mobile-trigger" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.65rem] font-bold tracking-[0.18em] text-[#6f2a1a] uppercase">
              Bekten Studio
            </p>
            <p className="truncate font-serif text-lg">
              {currentPageLabel(pathname)}
            </p>
          </div>
          <Badge
            className="hidden border-[#9a7b42]/45 bg-[#e7dcc6] text-stone-800 sm:inline-flex"
            variant="outline"
          >
            {owner ? 'Owner' : 'Editor'}
          </Badge>
          <Link
            className={cn(
              buttonVariants({variant: 'outline'}),
              'hidden border-stone-500/40 bg-[#f7f1e6] sm:inline-flex',
            )}
            href="/"
            rel="noopener noreferrer"
            target="_blank"
          >
            View site
          </Link>
        </header>

        <main
          className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-6 lg:px-10 lg:py-10"
          id="studio-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </SidebarInset>
    </>
  )
}

export function StudioShell({
  children,
  owner,
}: Readonly<{children: ReactNode; owner: boolean}>) {
  return (
    <SidebarProvider>
      <StudioShellFrame owner={owner}>{children}</StudioShellFrame>
    </SidebarProvider>
  )
}
