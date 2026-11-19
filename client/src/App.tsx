import { useLayoutEffect, ViewTransition } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { PageLayout } from '@/components/layout/PageLayout'
import { LandingPage } from '@/pages/LandingPage'
import { BookingView } from '@/views/BookingView'
import { MoviesView } from '@/views/MoviesView'
import { RewatchView } from '@/views/RewatchView'

// Keyed by path, so each navigation unmounts the old page and mounts the new one.
// TransitionLink tags the navigation with a direction; the classes are styled in index.css.
const slideIn = { 'nav-right': 'slide-from-right', 'nav-left': 'slide-from-left', default: 'none' }
const slideOut = { 'nav-right': 'slide-to-left', 'nav-left': 'slide-to-right', default: 'none' }

function App() {
  const location = useLocation()

  // Each page starts at the top, set before the transition captures the new page
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="relative isolate min-h-svh">
      {/* Outside the page transition, so the image stays still while pages slide over it */}
      <div aria-hidden="true" className="site-backdrop absolute inset-x-0 top-0 -z-10 h-svh" />
      <ViewTransition key={location.pathname} enter={slideIn} exit={slideOut} default="none">
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/add-movies"
            element={
              <PageLayout title="Add Movies" description="Build out your marathon, and say what to watch before each movie.">
                <MoviesView />
              </PageLayout>
            }
          />
          <Route
            path="/watch-order"
            element={
              <PageLayout title="Watch Order" description="Plan your MCU rewatch before Avengers: Doomsday, one movie at a time.">
                <RewatchView />
              </PageLayout>
            }
          />
          <Route
            path="/find-cinemas"
            element={
              <PageLayout title="Find Cinemas" description="Book an opening-night watch party for your whole group.">
                <BookingView />
              </PageLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ViewTransition>
    </div>
  )
}

export default App
