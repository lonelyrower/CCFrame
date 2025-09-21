import type { ThemeMode } from './alias'
import { aliasTokens } from './alias'

type Primitive = string | number

const toKebab = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase()

const walk = (
  value: unknown,
  path: string[],
  output: Record<string, string>,
): void => {
  if (value === undefined || value === null) {
    return
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const name = `--token-${path.map(toKebab).join('-')}`
    output[name] = String(value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walk(item, [...path, `${index}`], output)
    })
    return
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
      walk(nested, [...path, key], output)
    })
  }
}

export const buildCssVariables = (mode: ThemeMode): Record<string, string> => {
  const tokens = aliasTokens[mode]
  const output: Record<string, string> = {}
  walk(tokens, [], output)
  return output
}
