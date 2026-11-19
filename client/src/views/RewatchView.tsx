import { useState } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { cn } from 'cn'
import { errorMessage } from '@/api/client'
import { getMovies, getRewatchOrder, updateMovie } from '@/api/movies'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApi } from '@/hooks/useApi'
import { formatRuntime } from '@/lib/format'

export function RewatchView() {
  const movies = useApi('movies', getMovies)
  const [picked, setPicked] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Newest first; until the user picks, the target is the newest movie
  const newestFirst = [...(movies.data ?? [])].reverse()
  const targetId = picked ?? newestFirst[0]?.id ?? null
  const plan = useApi(targetId, getRewatchOrder)

  async function setWatched(id: string, watched: boolean) {
    setError(null)
    try {
      await updateMovie(id, { watched })
      plan.reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const items = newestFirst.map((movie) => ({ label: movie.title, value: movie.id }))
  const shownError = movies.error ?? plan.error ?? error

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Rewatch plan</CardTitle>
          <CardDescription>Pick a movie to see everything to watch before it, in order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="rewatch-target">Target movie</FieldLabel>
            <Select items={items} value={targetId} onValueChange={(value) => setPicked(value)}>
              <SelectTrigger id="rewatch-target" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {shownError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{shownError}</AlertDescription>
        </Alert>
      )}

      {plan.loading && <Skeleton className="h-96 w-full rounded-[1.25rem]" />}

      {plan.data && (
        <Card>
          <CardHeader>
            <CardTitle>Before {plan.data.target.title}</CardTitle>
            <CardDescription>
              {plan.data.unwatchedRuntime === 0
                ? 'All caught up. You are ready.'
                : `${formatRuntime(plan.data.unwatchedRuntime)} of watching left`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {plan.data.total === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nothing to watch first</EmptyTitle>
                  <EmptyDescription>{plan.data.target.title} has no prerequisites.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <Progress value={Math.round((plan.data.watchedCount / plan.data.total) * 100)}>
                  <ProgressLabel>
                    {plan.data.watchedCount} of {plan.data.total} watched
                  </ProgressLabel>
                  <ProgressValue />
                </Progress>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead className="w-28">Watched</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-32">Runtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.data.order.map((movie, i) => (
                      <TableRow key={movie.id}>
                        <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={movie.watched}
                            onCheckedChange={(checked) => setWatched(movie.id, checked)}
                            aria-label={`Mark ${movie.title} as watched`}
                          />
                        </TableCell>
                        <TableCell className={cn('font-medium', movie.watched && 'line-through opacity-55')}>
                          {movie.title}
                        </TableCell>
                        <TableCell className={cn('text-foreground/80 tabular-nums', movie.watched && 'opacity-55')}>
                          {formatRuntime(movie.runtime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
