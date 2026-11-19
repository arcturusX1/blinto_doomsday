import { addTransitionType, startTransition, type ComponentProps, type MouseEvent } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { slideTowards } from '@/lib/navigation'

type TransitionLinkProps = ComponentProps<typeof NavLink> & { to: string }

// A NavLink whose navigation runs as a transition tagged with its direction,
// so the page <ViewTransition> in App.tsx slides the new page in from that side.
export function TransitionLink({ to, onClick, ...props }: TransitionLinkProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    // Leave modified clicks (new tab or window) to the browser
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (to === pathname) return
    startTransition(() => {
      addTransitionType(slideTowards(pathname, to))
      navigate(to)
    })
  }

  return <NavLink {...props} to={to} onClick={handleClick} />
}
