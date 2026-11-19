import { useState } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { errorMessage } from '@/api/client'
import { getMovies, updateMovie, type Movie } from '@/api/movies'
import { AddMovieForm } from '@/components/movies/AddMovieForm'
import { EditPrereqsDialog } from '@/components/movies/EditPrereqsDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApi } from '@/hooks/useApi'
import { formatRuntime } from '@/lib/format'

export function MoviesView() {
  const movies = useApi('movies', getMovies)
  const [error, setError] = useState<string | null>(null)

  async function setWatched(movie: Movie, watched: boolean) {
    setError(null)
    try {
      await updateMovie(movie.id, { watched })
      movies.reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const list = movies.data ?? []
  const titles = new Map(list.map((movie) => [movie.id, movie.title]))
  const shownError = movies.error ?? error

  return (
    <>
      <AddMovieForm movies={list} onCreated={movies.reload} />

      <Card>
        <CardHeader>
          <CardTitle>Your movies</CardTitle>
          <CardDescription>Tick a movie once you've watched it, or change what to watch before it.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {shownError && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{shownError}</AlertDescription>
            </Alert>
          )}

          {movies.loading && (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {movies.data?.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No movies yet</EmptyTitle>
                <EmptyDescription>Add one above, or load the sample data with npm run seed in server/.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {list.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Watched</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Runtime</TableHead>
                  <TableHead>Watch first</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      <Checkbox
                        checked={movie.watched}
                        onCheckedChange={(checked) => setWatched(movie, checked)}
                        aria-label={`Mark ${movie.title} as watched`}
                      />
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal">{movie.title}</TableCell>
                    <TableCell className="text-foreground/80 tabular-nums">{movie.releaseYear}</TableCell>
                    <TableCell className="text-foreground/80 tabular-nums">{formatRuntime(movie.runtime)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {movie.prereqs.length === 0 ? (
                        <span className="text-muted-foreground">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {movie.prereqs.map((id) => (
                            <Badge key={id} variant="secondary">
                              {titles.get(id)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditPrereqsDialog movie={movie} movies={list} onSaved={movies.reload} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
