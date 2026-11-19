import { ShieldCheckIcon, TicketIcon } from 'lucide-react'
import { cn } from 'cn'
import doomsdayLogo from '@/assets/doomsday-logo.png'
import { DisplayTitle } from '@/components/layout/DisplayTitle'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { buttonVariants } from '@/components/ui/button'

// Drops from around the middle of the screen into place, fading in from translucent.
// motion-safe: skipped for people who ask for reduced motion.
const descend =
  'motion-safe:animate-in motion-safe:fade-in-20 motion-safe:slide-in-from-top-[20svh] motion-safe:animation-duration-[1200ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:fill-mode-both'

export function LandingPage() {
  return (
    <div className="hero-backdrop flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-end gap-8 px-[clamp(20px,4vw,56px)] pt-24 pb-[clamp(56px,9vw,112px)] text-center">
        <DisplayTitle className={cn('inline-grid max-w-full gap-[0.12em] text-[clamp(40px,6.4vw,92px)]', descend)}>
          <span className="sr-only">Are You Ready for Doomsday?</span>
          <span aria-hidden="true">Are You Ready for</span>
          {/* w-0 min-w-full: this row adds nothing to the heading's width, so the logo and "?" span
              exactly the width of the line above, with the logo's edge under its first letter */}
          <span aria-hidden="true" className="flex w-0 min-w-full items-center gap-[0.08em]">
            <img src={doomsdayLogo} alt="" className="min-w-0 flex-1 drop-shadow-[0_4px_32px_rgb(0_0_0/0.65)]" />
            <span>?</span>
          </span>
        </DisplayTitle>
        <div className={cn('flex flex-wrap justify-center gap-4', descend)}>
          <TransitionLink to="/watch-order" className={cn(buttonVariants({ size: 'hero' }))}>
            <ShieldCheckIcon data-icon="inline-start" />
            Prepare
          </TransitionLink>
          <TransitionLink to="/find-cinemas" className={cn(buttonVariants({ variant: 'glass', size: 'hero' }))}>
            <TicketIcon data-icon="inline-start" />
            Book Opening Night
          </TransitionLink>
        </div>
      </main>
    </div>
  )
}
