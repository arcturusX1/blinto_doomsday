import { request } from './client'

export interface Movie {
  id: string
  title: string
  releaseYear: number
  runtime: number
  prereqs: string[] // movie ids
  watched: boolean
}

export interface MovieInput {
  title: string
  releaseYear: number
  runtime: number
  prereqs?: string[]
  watched?: boolean
}

export interface RewatchPlan {
  target: { id: string; title: string }
  order: { id: string; title: string; runtime: number; watched: boolean }[]
  total: number
  watchedCount: number
  unwatchedRuntime: number
}

export const getMovies = () => request<Movie[]>('/movies')

export const createMovie = (data: MovieInput) => request<Movie>('/movies', { method: 'POST', body: data })

export const updateMovie = (id: string, data: Partial<MovieInput>) =>
  request<Movie>(`/movies/${id}`, { method: 'PATCH', body: data })

export const getRewatchOrder = (id: string) => request<RewatchPlan>(`/movies/${id}/rewatch-order`)
