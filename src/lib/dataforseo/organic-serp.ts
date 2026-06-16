import { dataForSEORequest, DataForSEOError } from './client'

export interface SERPRequestParams {
  keyword: string
  locationName?: string
  languageName?: string
  locationCode?: number
  languageCode?: string
  device?: 'desktop' | 'mobile'
  os?: 'windows' | 'macos' | 'android' | 'ios'
  depth?: number
}

export interface SERPResultItem {
  type: string
  rank_group?: number
  rank_absolute?: number
  url?: string
  domain?: string
  title?: string
  description?: string
}

export interface SERPResponseResult {
  keyword: string
  location_code: number
  language_code: string
  check_url: string
  datetime: string
  items_count: number
  items: SERPResultItem[] | null
}

export async function checkSERPRanking(
  params: SERPRequestParams
): Promise<SERPResponseResult> {
  const endpoint = `/serp/google/organic/live/advanced`

  const requestBody: Record<string, unknown> = {
    keyword: params.keyword,
    depth: params.depth ?? 10,
  }

  if (params.locationCode) {
    requestBody.location_code = params.locationCode
  } else if (params.locationName) {
    requestBody.location_name = params.locationName
  } else {
    requestBody.location_name = 'United States'
  }

  if (params.languageCode) {
    requestBody.language_code = params.languageCode
  } else if (params.languageName) {
    requestBody.language_name = params.languageName
  } else {
    requestBody.language_name = 'English'
  }

  if (params.device) {
    requestBody.device = params.device
  }
  if (params.os) {
    requestBody.os = params.os
  }

  const response = await dataForSEORequest<SERPResponseResult>(endpoint, [requestBody])

  const task = response.tasks[0]
  if (task.status_code !== 20000 || !task.result?.length) {
    throw new DataForSEOError(
      task.status_code,
      task.status_message || 'No result returned'
    )
  }

  return task.result[0]
}
