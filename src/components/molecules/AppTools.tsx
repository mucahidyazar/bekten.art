'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {cn} from '@/utils'

import {ReactPlayer} from './ReactPlayer'

type AppToolsProps = {
  className?: string
  withoutBg?: boolean
}
export function AppTools({className, withoutBg}: AppToolsProps) {
  return (
    <section className={cn('flex gap-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'w-9 h-9 flex items-center justify-center border border-primary-500 border-opacity-10 rounded-full bg-primary-500 bg-opacity-5 shadow-soft-md hover:shadow-soft-lg text-primary-500 z-50 relative text-xs',
            !!withoutBg &&
              'hover:shadow-none shadow-none bg-none border-none bg-opacity-0 w-fit',
          )}
        >
          EN
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>English</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Russian</DropdownMenuItem>
          <DropdownMenuItem>Kyrgyz</DropdownMenuItem>
          <DropdownMenuItem>Turkish</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReactPlayer withoutBg={withoutBg} />
    </section>
  )
}
