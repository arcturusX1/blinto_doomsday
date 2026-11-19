import { ListIcon, MapPinIcon, PlusIcon } from 'lucide-react'

// Header nav buttons, left to right
export const navItems = [
  { to: '/add-movies', label: 'Add Movies', icon: PlusIcon },
  { to: '/find-cinemas', label: 'Find Cinemas', icon: MapPinIcon },
  { to: '/watch-order', label: 'Watch Order', icon: ListIcon },
]

// Pages in the header's left-to-right order: home (the logo) first, then the nav buttons
const pageOrder = ['/', ...navItems.map((item) => item.to)]

export type SlideDirection = 'nav-left' | 'nav-right'

// Which way a navigation moves: towards the side the destination's button is on
export function slideTowards(from: string, to: string): SlideDirection {
  return pageOrder.indexOf(to) > pageOrder.indexOf(from) ? 'nav-right' : 'nav-left'
}
