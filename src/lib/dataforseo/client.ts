const BASE_URL = 'https://api.dataforseo.com/v3'

export interface DataForSEOResponse<T> {
  version: string
  status_code: number
  status_message: string
  cost: number
  tasks_count: number
  tasks_error: number
  tasks: Array<{
    id: string
    status_code: number
    status_message: string
    cost: number
    result_count: number
    result: T[] | null
    data?: Record<string, unknown>
  }>
}

export class DataForSEOError extends Error {
  constructor(public code: number, message: string) {
    super(message)
    this.name = 'DataForSEOError'
  }
}

export async function dataForSEORequest<T>(
  endpoint: string,
  body: unknown
): Promise<DataForSEOResponse<T>> {
  const login = process.env.DATAFORSEO_LOGIN!
  const password = process.env.DATAFORSEO_PASSWORD!
  const credentials = Buffer.from(`${login}:${password}`).toString('base64')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new DataForSEOError(res.status, `HTTP ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as DataForSEOResponse<T>

  if (data.status_code !== 20000) {
    throw new DataForSEOError(data.status_code, data.status_message)
  }

  return data
}
