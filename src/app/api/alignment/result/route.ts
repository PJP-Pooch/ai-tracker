import { NextRequest, NextResponse } from 'next/server'
import { getBrandAlignment } from '@/lib/queries/brand-alignment'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId')
  if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 })

  const result = await getBrandAlignment(runId)
  if (!result) return NextResponse.json(null)

  return NextResponse.json(result)
}
