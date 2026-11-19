import { request } from './client'

export interface Cinema {
  id: string
  name: string
  bundleSizes: number[]
}

export interface BookingQuote {
  cinema: { id: string; name: string }
  groupSize: number
  possible: boolean
  totalBundles: number | null
  bundles: { size: number; count: number }[] // largest size first
}

export const getCinemas = () => request<Cinema[]>('/cinemas')

export const getBookingQuote = (id: string, groupSize: number) =>
  request<BookingQuote>(`/cinemas/${id}/booking?${new URLSearchParams({ groupSize: String(groupSize) })}`)
