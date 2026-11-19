import { useState } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { errorMessage } from '@/api/client'
import { updateMovie, type Movie } from '@/api/movies'
import { PrereqPicker } from '@/components/movies/PrereqPicker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

interface EditPrereqsDialogProps {
  movie: Movie
  movies: Movie[]
  onSaved: () => void
}

// Replaces a movie's prerequisites. A change that would create a cycle comes
// back as a 409, which is shown in the dialog so the user can adjust it.
export function EditPrereqsDialog({ movie, movies, onSaved }: EditPrereqsDialogProps) {
  const [open, setOpen] = useState(false)
  const [prereqs, setPrereqs] = useState(movie.prereqs)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setPrereqs(movie.prereqs)
      setError(null)
    }
    setOpen(next)
  }

  async function save() {
    setPending(true)
    setError(null)
    try {
      await updateMovie(movie.id, { prereqs })
      setOpen(false)
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const fieldId = `prereqs-${movie.id}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit prerequisites</DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Prerequisites for {movie.title}</DialogTitle>
          <DialogDescription>Movies to watch before this one.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={fieldId}>Watch these first</FieldLabel>
          <PrereqPicker
            id={fieldId}
            defaultOpen
            options={movies.filter((m) => m.id !== movie.id)}
            value={prereqs}
            onChange={setPrereqs}
          />
        </Field>
        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Couldn't save</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={save} disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
