// Database adapter to handle PostgreSQL vs SQLite differences
import { Prisma } from '@prisma/client'

export const isPostgreSQL = process.env.DATABASE_URL?.includes('postgresql') || false
export const isSQLite = process.env.DATABASE_URL?.includes('file:') || false

// Helper to create database-agnostic string filters
export function createStringFilter(value: string, caseSensitive = false): Prisma.StringFilter {
  const baseFilter: Prisma.StringFilter = {
    contains: value,
  }

  // Only add mode for PostgreSQL
  if (isPostgreSQL && !caseSensitive) {
    return {
      ...baseFilter,
      mode: 'insensitive' as const
    }
  }

  // For SQLite, return basic filter (case sensitive)
  return baseFilter
}

// Helper to handle JSON fields based on database type
export function parseJsonField<T>(value: string | T | null): T | null {
  if (!value) return null

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  return value as T
}

export function stringifyJsonField<T>(value: T | null): string | T | null {
  if (!value) return null

  // For SQLite, we need to stringify JSON
  if (isSQLite) {
    return JSON.stringify(value)
  }

  // For PostgreSQL, return as-is
  return value
}