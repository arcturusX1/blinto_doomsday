import { useState, type FormEvent } from 'react'
import { CircleAlertIcon, CircleCheckIcon, PlusIcon } from 'lucide-react'
import { ApiError, errorMessage } from '@/api/client'
import { createMovie, type Movie } from '@/api/movies'
import { PrereqPicker } from '@/components/movies/PrereqPicker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { formatRuntime } from '@/lib/format'

// Same limits as the server's movie model
const maxReleaseYear = new Date().getFullYear() + 1

interface FieldErrors {
  title?: string
  releaseYear?: string
  runtime?: string
}

const duplicateTitle = 'That movie is already in your list.'

function validate(title: string, releaseYear: string, runtime: string, movies: Movie[]): FieldErrors {
  const errors: FieldErrors = {}
  const year = Number(releaseYear)
  const minutes = Number(runtime)
  if (!title) errors.title = 'Enter a title.'
  else if (movies.some((m) => m.title.toLowerCase() === title.toLowerCase())) errors.title = duplicateTitle
  if (releaseYear.trim() === '' || !Number.isInteger(year) || year < 1900 || year > maxReleaseYear) {
    errors.releaseYear = `Enter a year between 1900 and ${maxReleaseYear}.`
  }
  if (runtime.trim() === '' || !Number.isInteger(minutes) || minutes < 1 || minutes > 300) {
    errors.runtime = 'Enter whole minutes, 1 to 300.'
  }
  return errors
}

export function AddMovieForm({ movies, onCreated }: { movies: Movie[]; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [releaseYear, setReleaseYear] = useState('')
  const [runtime, setRuntime] = useState('')
  const [prereqs, setPrereqs] = useState<string[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [added, setAdded] = useState<{ title: string; detail: string } | null>(null)
  const [pickerKey, setPickerKey] = useState(0)

  // Editing a field clears its error and the last confirmation
  function edit(field: keyof FieldErrors, set: (value: string) => void) {
    return (value: string) => {
      set(value)
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setAdded(null)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const trimmed = title.trim()
    const found = validate(trimmed, releaseYear, runtime, movies)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setAdded(null)
      return
    }

    setPending(true)
    try {
      await createMovie({ title: trimmed, releaseYear: Number(releaseYear), runtime: Number(runtime), prereqs })
      const before = movies.filter((m) => prereqs.includes(m.id)).map((m) => m.title)
      setAdded({
        title: trimmed,
        detail: `${releaseYear} · ${formatRuntime(Number(runtime))} · Watch first: ${before.length > 0 ? before.join(', ') : 'None'}`,
      })
      setTitle('')
      setReleaseYear('')
      setRuntime('')
      setPrereqs([])
      setPickerKey((k) => k + 1)
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_TITLE') setErrors({ title: duplicateTitle })
      else setFormError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add a movie</CardTitle>
          <CardDescription>Prerequisites can be changed later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="add-movie" noValidate onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={errors.title ? true : undefined}>
                <FieldLabel htmlFor="movie-title">Title</FieldLabel>
                <Input
                  id="movie-title"
                  autoComplete="off"
                  placeholder="e.g. Spider-Man: Homecoming"
                  aria-invalid={errors.title ? true : undefined}
                  value={title}
                  onChange={(e) => edit('title', setTitle)(e.target.value)}
                />
                {errors.title && <FieldError>{errors.title}</FieldError>}
              </Field>
              <FieldGroup className="grid sm:grid-cols-2">
                <Field data-invalid={errors.releaseYear ? true : undefined}>
                  <FieldLabel htmlFor="movie-year">Release year</FieldLabel>
                  <Input
                    id="movie-year"
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={maxReleaseYear}
                    placeholder="e.g. 2017"
                    aria-invalid={errors.releaseYear ? true : undefined}
                    value={releaseYear}
                    onChange={(e) => edit('releaseYear', setReleaseYear)(e.target.value)}
                  />
                  {errors.releaseYear && <FieldError>{errors.releaseYear}</FieldError>}
                </Field>
                <Field data-invalid={errors.runtime ? true : undefined}>
                  <FieldLabel htmlFor="movie-runtime">Runtime (minutes)</FieldLabel>
                  <Input
                    id="movie-runtime"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={300}
                    placeholder="e.g. 133"
                    aria-invalid={errors.runtime ? true : undefined}
                    value={runtime}
                    onChange={(e) => edit('runtime', setRuntime)(e.target.value)}
                  />
                  {errors.runtime && <FieldError>{errors.runtime}</FieldError>}
                </Field>
              </FieldGroup>
              <Field>
                <FieldLabel htmlFor="movie-prereqs">Watch these first</FieldLabel>
                <PrereqPicker
                  key={pickerKey}
                  id="movie-prereqs"
                  options={movies}
                  value={prereqs}
                  onChange={(ids) => {
                    setPrereqs(ids)
                    setAdded(null)
                  }}
                />
                <FieldDescription>Optional.</FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="add-movie" size="lg" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
            Add movie
          </Button>
        </CardFooter>
      </Card>

      {added && (
        <Alert variant="success">
          <CircleCheckIcon />
          <AlertTitle>Added {added.title}</AlertTitle>
          <AlertDescription>{added.detail}</AlertDescription>
        </Alert>
      )}
      {formError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Couldn't add the movie</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
    </>
  )
}
