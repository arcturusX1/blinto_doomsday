import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from 'cn'
import type { Movie } from '@/api/movies'
import { Checkbox } from '@/components/ui/checkbox'

interface PrereqPickerProps {
  id: string
  options: Movie[]
  value: string[]
  onChange: (ids: string[]) => void
  defaultOpen?: boolean
}

// A field-like button showing the picked titles, which opens an inline checklist of movies.
export function PrereqPicker({ id, options, value, onChange, defaultOpen = false }: PrereqPickerProps) {
  const [open, setOpen] = useState(defaultOpen)
  const picked = options.filter((movie) => value.includes(movie.id))
  const listId = `${id}-list`

  function toggle(movieId: string, checked: boolean) {
    onChange(checked ? [...value, movieId] : value.filter((v) => v !== movieId))
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="flex h-13 w-full items-center justify-between gap-3 rounded-lg border border-input bg-background px-4 text-left text-base font-medium transition-colors outline-none hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={cn('min-w-0 flex-1 truncate', picked.length === 0 && 'text-muted-foreground')}>
          {picked.length === 0 ? 'None' : picked.map((movie) => movie.title).join(', ')}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          id={listId}
          className="grid max-h-80 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-0.5 overflow-y-auto rounded-lg border bg-background p-2"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-[15px] text-muted-foreground">No other movies yet.</p>
          ) : (
            options.map((movie) => (
              <label
                key={movie.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-[15px] hover:bg-accent"
              >
                <Checkbox
                  checked={value.includes(movie.id)}
                  onCheckedChange={(checked) => toggle(movie.id, checked)}
                />
                <span className="min-w-0 flex-1">{movie.title}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">{movie.releaseYear}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}
