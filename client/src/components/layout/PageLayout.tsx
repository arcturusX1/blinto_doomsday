import type { ReactNode } from 'react'
import { DisplayTitle } from '@/components/layout/DisplayTitle'
import { SiteHeader } from '@/components/layout/SiteHeader'

interface PageLayoutProps {
  title: string
  description: string
  children: ReactNode
}

// A page with the image banner (header, title, description) above a column of cards.
// Below the banner the page is opaque, so the shared backdrop image only shows behind the banner.
export function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="banner-backdrop">
        <SiteHeader />
        <div className="mx-auto flex max-w-260 flex-col gap-3 px-[clamp(20px,4vw,40px)] pt-[clamp(32px,5vw,64px)] pb-14">
          <DisplayTitle>{title}</DisplayTitle>
          <p className="max-w-160 text-lg text-foreground/80">{description}</p>
        </div>
      </div>
      <div className="flex-1 bg-background pb-24">
        <main className="mx-auto flex max-w-260 flex-col gap-6 px-[clamp(20px,4vw,40px)]">{children}</main>
      </div>
    </div>
  )
}
