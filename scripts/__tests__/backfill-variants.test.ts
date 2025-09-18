import { parseArgs, computePlan } from '../backfill-variants'

describe('parseArgs', () => {
  test('defaults and booleans', () => {
    const parsed = parseArgs([])
    expect(parsed.limit).toBe(0)
    expect(parsed.dry).toBe(false)
    expect(parsed.dryPlan).toBe(false)
    expect(parsed.onlyMissing).toBe(true) // default true
    expect(parsed.force).toBe(false)
  })

  test('parses numeric and boolean flags', () => {
    const parsed = parseArgs(['--limit=10', '--dry=true', '--only-missing=false', '--force=true', '--concurrency=5'])
    expect(parsed.limit).toBe(10)
    expect(parsed.dry).toBe(true)
    expect(parsed.onlyMissing).toBe(false)
    expect(parsed.force).toBe(true)
    expect(parsed.concurrency).toBe(5)
  })

  test('parses variants and formats', () => {
    const parsed = parseArgs(['--variants=thumb,small', '--formats=webp,jpeg'])
    expect(parsed.variantsArg).toBe('thumb,small')
    expect(parsed.formatsArg).toBe('webp,jpeg')
  })
})

describe('computePlan', () => {
  const mockPhoto = (existing: string[]) => ({
    variants: existing.map(k => { const [variant, format] = k.split('.'); return { variant, format } })
  })

  test('missing detection', () => {
    const photo = mockPhoto(['thumb.webp', 'small.jpeg'])
    const names = new Set(['thumb', 'small'])
    const formats = new Set(['webp', 'jpeg'])
    const plan = computePlan(photo as any, names, formats)
    // want 4 combos, have 2
    expect(plan.want.length).toBe(4)
    expect(plan.missing.sort()).toEqual(['small.webp', 'thumb.jpeg'].sort())
  })

  test('no missing when all present', () => {
    const photo = mockPhoto(['thumb.webp', 'thumb.jpeg'])
    const names = new Set(['thumb'])
    const formats = new Set(['webp', 'jpeg'])
    const plan = computePlan(photo as any, names, formats)
    expect(plan.missing.length).toBe(0)
  })
})
