'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {PanelLeft} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {Button} from '@/components/ui/button'
import {cn} from '@/utils'

import type {ComponentProps, CSSProperties, ReactNode} from 'react'

type SidebarContextValue = Readonly<{
  isMobile: boolean
  mobileOpen: boolean
  open: boolean
  setMobileOpen: (open: boolean) => void
  setOpen: (open: boolean) => void
  toggle: () => void
}>

const SidebarContext = createContext<SidebarContextValue | null>(null)

function matchesMobileViewport() {
  if (typeof window === 'undefined') return false

  return (
    window.innerWidth <= 767 ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches)
  )
}

function useSidebar() {
  const context = useContext(SidebarContext)

  if (!context) throw new Error('Sidebar must be used within SidebarProvider')

  return context
}

function SidebarProvider({
  children,
  className,
  defaultOpen = true,
  style,
  ...properties
}: ComponentProps<'div'> & Readonly<{defaultOpen?: boolean}>) {
  const [open, setOpen] = useState(defaultOpen)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const toggle = useCallback(() => {
    if (matchesMobileViewport()) {
      setMobileOpen(current => !current)

      return
    }

    setOpen(current => !current)
  }, [])
  const value = useMemo(
    () => ({isMobile, mobileOpen, open, setMobileOpen, setOpen, toggle}),
    [isMobile, mobileOpen, open, toggle],
  )

  useEffect(() => {
    const updateViewport = () => setIsMobile(matchesMobileViewport())

    updateViewport()

    if (typeof window.matchMedia !== 'function') {
      window.addEventListener('resize', updateViewport)

      return () => window.removeEventListener('resize', updateViewport)
    }

    const query = window.matchMedia('(max-width: 767px)')

    query.addEventListener('change', updateViewport)
    window.addEventListener('resize', updateViewport)

    return () => {
      query.removeEventListener('change', updateViewport)
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'b' ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return
      }

      event.preventDefault()
      toggle()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn(
          'group/studio-shell bg-background text-foreground flex min-h-svh w-full',
          className,
        )}
        data-shadcn-shell="true"
        data-state={open ? 'expanded' : 'collapsed'}
        data-testid="studio-shell"
        style={
          {
            '--studio-sidebar-width': '17rem',
            '--studio-sidebar-width-collapsed': '4.75rem',
            ...style,
          } as CSSProperties
        }
        {...properties}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  children,
  className,
  ...properties
}: ComponentProps<'aside'>) {
  const {mobileOpen, open, setMobileOpen} = useSidebar()
  const sharedClassName =
    'flex w-(--studio-sidebar-width) flex-col border-r border-stone-500/30 bg-[#e7dcc6]'

  return (
    <>
      <aside
        aria-label="Studio sidebar"
        className={cn(
          sharedClassName,
          'sticky top-0 hidden h-svh shadow-none transition-[width] duration-200 ease-out md:flex',
          !open && 'w-(--studio-sidebar-width-collapsed)',
          className,
        )}
        data-slot="sidebar"
        data-state={open ? 'expanded' : 'collapsed'}
        id="studio-navigation-desktop"
        style={{viewTransitionName: 'persistent-dashboard-sidebar'}}
        {...properties}
      >
        {children}
      </aside>

      <DialogPrimitive.Root onOpenChange={setMobileOpen} open={mobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-30 bg-stone-950/35 backdrop-blur-[1px] md:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              sharedClassName,
              'fixed inset-y-0 left-0 z-40 shadow-[0_24px_70px_rgb(50_40_25_/_16%)] outline-none md:hidden',
              className,
            )}
            data-slot="sidebar"
            data-state="expanded"
            id="studio-navigation-mobile"
          >
            <DialogPrimitive.Title className="sr-only">
              Studio navigation
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button
                aria-controls="studio-navigation-mobile"
                aria-expanded="true"
                aria-label="Close Studio navigation"
                className="absolute top-3 right-3 z-10 size-10 border-stone-500/40 bg-[#f7f1e6] text-stone-900 hover:bg-[#d9c9aa]"
                size="icon"
                type="button"
                variant="outline"
              >
                <PanelLeft aria-hidden="true" className="size-5" />
              </Button>
            </DialogPrimitive.Close>
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}

function SidebarInset({className, ...properties}: ComponentProps<'div'>) {
  const {isMobile, mobileOpen} = useSidebar()
  const isolated = isMobile && mobileOpen

  return (
    <div
      aria-hidden={isolated ? true : undefined}
      className={cn('min-w-0 flex-1 overflow-x-clip', className)}
      data-slot="sidebar-inset"
      inert={isolated ? true : undefined}
      {...properties}
    />
  )
}

function SidebarTrigger({
  className,
  ...properties
}: Omit<ComponentProps<typeof Button>, 'children'>) {
  const {isMobile, mobileOpen, open, toggle} = useSidebar()
  const expanded = isMobile ? mobileOpen : open

  return (
    <Button
      aria-controls={
        isMobile ? 'studio-navigation-mobile' : 'studio-navigation-desktop'
      }
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Collapse' : 'Expand'} Studio navigation`}
      className={cn(
        'size-11 cursor-pointer border-stone-500/40 bg-[#f7f1e6] text-stone-900 hover:bg-[#d9c9aa]',
        className,
      )}
      onClick={toggle}
      size="icon"
      type="button"
      variant="outline"
      {...properties}
    >
      <PanelLeft aria-hidden="true" className="size-5" />
    </Button>
  )
}

function SidebarHeader({className, ...properties}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-b border-stone-500/30 p-4', className)}
      data-slot="sidebar-header"
      {...properties}
    />
  )
}

function SidebarContent({className, ...properties}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('min-h-0 flex-1 overflow-y-auto px-3 py-4', className)}
      data-slot="sidebar-content"
      {...properties}
    />
  )
}

function SidebarFooter({className, ...properties}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-t border-stone-500/30 p-4', className)}
      data-slot="sidebar-footer"
      {...properties}
    />
  )
}

function SidebarGroup({className, ...properties}: ComponentProps<'section'>) {
  return <section className={cn('py-2', className)} {...properties} />
}

function SidebarGroupLabel({className, ...properties}: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'px-3 pb-2 text-[0.65rem] font-bold tracking-[0.18em] text-stone-600 uppercase group-data-[state=collapsed]/studio-shell:sr-only',
        className,
      )}
      {...properties}
    />
  )
}

function SidebarMenu({className, ...properties}: ComponentProps<'ul'>) {
  return <ul className={cn('grid gap-1', className)} {...properties} />
}

function SidebarMenuItem(properties: ComponentProps<'li'>) {
  return <li {...properties} />
}

function SidebarMenuButton({
  active = false,
  children,
  className,
  ...properties
}: ComponentProps<'div'> & Readonly<{active?: boolean; children: ReactNode}>) {
  return (
    <div
      className={cn(
        'min-h-11 rounded-md text-sm font-semibold transition-colors duration-200 [&_a]:flex [&_a]:min-h-11 [&_a]:cursor-pointer [&_a]:items-center [&_a]:gap-3 [&_a]:rounded-md [&_a]:px-3 [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-[#6f2a1a] [&_a]:focus-visible:ring-offset-2 [&_a]:focus-visible:outline-none',
        active
          ? 'bg-[#6f2a1a] text-[#fffaf0]'
          : 'text-stone-800 hover:bg-[#d9c9aa] hover:text-stone-950',
        'group-data-[state=collapsed]/studio-shell:[&_a]:justify-center group-data-[state=collapsed]/studio-shell:[&_a_span]:sr-only',
        className,
      )}
      data-active={active ? 'true' : 'false'}
      data-slot="sidebar-menu-button"
      {...properties}
    >
      {children}
    </div>
  )
}

export {
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
}
