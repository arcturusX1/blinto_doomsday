import { ViewTransition } from 'react'
import { cn } from 'cn'
import { AvengersLogo } from '@/components/layout/AvengersLogo'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { buttonVariants } from '@/components/ui/button'
import { navItems } from '@/lib/navigation'

// NavLink sets aria-current="page" on the active link, which the glass variant fills with the accent.
// The named <ViewTransition> keeps the header in place while pages slide underneath it.
export function SiteHeader() {
  return (
    <ViewTransition name="site-header">
      <header className="flex w-full flex-wrap items-center justify-between gap-4 px-[clamp(20px,4vw,56px)] py-6">
        <TransitionLink
          to="/"
          className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <AvengersLogo className="h-[35px] w-[30px]" />
          <span className="font-heading text-xl font-semibold tracking-[0.14em]">DOOMSDAY READY</span>
        </TransitionLink>
        <nav aria-label="Main" className="flex flex-wrap gap-2.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <TransitionLink key={to} to={to} className={cn(buttonVariants({ variant: 'glass', size: 'nav' }))}>
              <Icon data-icon="inline-start" />
              {label}
            </TransitionLink>
          ))}
        </nav>
      </header>
    </ViewTransition>
  )
}
