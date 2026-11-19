import type { ComponentProps } from 'react'
import { cn } from 'cn'

// The big italic small-caps headline used on the landing page and page banners.
export function DisplayTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        'font-heading text-[clamp(40px,5vw,64px)] leading-[1.05] font-black tracking-[0.04em] italic [font-variant-caps:small-caps] [text-shadow:0_4px_32px_rgb(0_0_0/0.65)]',
        className
      )}
      {...props}
    />
  )
}
