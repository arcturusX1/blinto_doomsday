export interface Item {
  _id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export type ItemInput = Pick<Item, 'name'> & Partial<Pick<Item, 'description'>>

const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/items`

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return (res.status === 204 ? null : await res.json()) as T
}

export const getItems = () => request<Item[]>(BASE)
export const createItem = (data: ItemInput) =>
  request<Item>(BASE, { method: 'POST', body: JSON.stringify(data) })
export const deleteItem = (id: string) =>
  request<null>(`${BASE}/${id}`, { method: 'DELETE' })
