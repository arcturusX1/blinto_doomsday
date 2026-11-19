import { useState, type FormEvent } from 'react'
import { ArrowRightIcon, CircleAlertIcon } from 'lucide-react'
import { errorMessage } from '@/api/client'
import { getBookingQuote, getCinemas, type BookingQuote } from '@/api/cinemas'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApi } from '@/hooks/useApi'
import { formatList } from '@/lib/format'

// Same limit as the server
const maxGroupSize = 10000

type Outcome = { quote: BookingQuote } | { problem: { title: string; message: string } }

export function BookingView() {
  const cinemas = useApi('cinemas', getCinemas)
  const [picked, setPicked] = useState<string | null>(null)
  const [groupSize, setGroupSize] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [pending, setPending] = useState(false)

  // Until the user picks, the first cinema is selected
  const cinemaId = picked ?? cinemas.data?.[0]?.id ?? null
  const cinema = cinemas.data?.find((c) => c.id === cinemaId)
  const items = (cinemas.data ?? []).map((c) => ({ label: c.name, value: c.id }))

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cinema) return
    const size = Number(groupSize)
    if (groupSize.trim() === '' || !Number.isInteger(size) || size < 1) {
      setOutcome({ problem: { title: 'Check the group size', message: 'Enter a whole number of people, 1 or more.' } })
      return
    }
    if (size > maxGroupSize) {
      setOutcome({ problem: { title: 'Group too large', message: 'Quotes go up to 10,000 people.' } })
      return
    }

    setPending(true)
    try {
      const quote = await getBookingQuote(cinema.id, size)
      setOutcome(
        quote.possible
          ? { quote }
          : {
              problem: {
                title: 'Not possible',
                message: `No combination of bundles at ${quote.cinema.name} adds up to exactly ${quote.groupSize} seats.`,
              },
            }
      )
    } catch (err) {
      setOutcome({ problem: { title: "Couldn't get a quote", message: errorMessage(err) } })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Book a watch party</CardTitle>
          <CardDescription>Opening-night seats are sold only in bundles. Find the fewest bundles for your group.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="booking" noValidate onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="booking-cinema">Cinema</FieldLabel>
                <Select
                  items={items}
                  value={cinemaId}
                  onValueChange={(value) => {
                    setPicked(value)
                    setOutcome(null)
                  }}
                >
                  <SelectTrigger id="booking-cinema" className="w-full">
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
                {cinema && <FieldDescription>Sells bundles of {formatList(cinema.bundleSizes)} seats.</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="booking-group-size">Group size</FieldLabel>
                <Input
                  id="booking-group-size"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={maxGroupSize}
                  value={groupSize}
                  onChange={(e) => {
                    setGroupSize(e.target.value)
                    setOutcome(null)
                  }}
                />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="booking" size="lg" disabled={!cinema || pending}>
            Get quote
            {pending ? <Spinner data-icon="inline-end" /> : <ArrowRightIcon data-icon="inline-end" />}
          </Button>
        </CardFooter>
      </Card>

      {cinemas.error && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Couldn't load cinemas</AlertTitle>
          <AlertDescription>{cinemas.error}</AlertDescription>
        </Alert>
      )}

      <div aria-live="polite" className="flex flex-col gap-6">
        {outcome && 'problem' in outcome && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>{outcome.problem.title}</AlertTitle>
            <AlertDescription>{outcome.problem.message}</AlertDescription>
          </Alert>
        )}

        {outcome && 'quote' in outcome && (
          <Card>
            <CardHeader>
              <CardTitle>
                {outcome.quote.totalBundles} {outcome.quote.totalBundles === 1 ? 'bundle' : 'bundles'}
              </CardTitle>
              <CardDescription>
                For a group of {outcome.quote.groupSize} at {outcome.quote.cinema.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle size</TableHead>
                    <TableHead>How many</TableHead>
                    <TableHead>Seats</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outcome.quote.bundles.map((bundle) => (
                    <TableRow key={bundle.size} className="tabular-nums">
                      <TableCell className="font-medium">{bundle.size}</TableCell>
                      <TableCell>× {bundle.count}</TableCell>
                      <TableCell>{bundle.size * bundle.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
