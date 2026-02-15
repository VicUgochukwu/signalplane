import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize database/API error messages for user-facing display.
 * Maps known Postgres error patterns to friendly messages and
 * strips internal details (constraint names, schema info, etc.).
 */
export function friendlyError(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';

  const lower = raw.toLowerCase();

  // Duplicate key / unique constraint violations
  if (lower.includes('duplicate key') || lower.includes('unique constraint') || lower.includes('already exists')) {
    if (lower.includes('tracked_page') || lower.includes('url')) {
      return 'This page is already being tracked.';
    }
    if (lower.includes('competitor') || lower.includes('company')) {
      return 'This competitor is already being tracked.';
    }
    return 'This record already exists.';
  }

  // Foreign key violations
  if (lower.includes('foreign key') || lower.includes('violates foreign key')) {
    return 'This action references data that no longer exists.';
  }

  // Not-null violations
  if (lower.includes('not-null') || lower.includes('null value in column')) {
    return 'A required field is missing. Please check your input.';
  }

  // Permission / auth errors
  if (lower.includes('unauthorized') || lower.includes('permission denied') || lower.includes('admin access')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Rate limiting
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Row-level security
  if (lower.includes('row-level security') || lower.includes('rls')) {
    return 'You don\'t have access to this data.';
  }

  // Generic Postgres error codes — strip technical details
  if (lower.includes('pgrst') || lower.includes('pg_') || lower.includes('idx_') || lower.includes('constraint')) {
    return 'Something went wrong. Please try again.';
  }

  // If the message looks technical (contains schema/table/column references), sanitize it
  if (/\b(schema|table|column|index|relation|function)\b/i.test(raw)) {
    return 'Something went wrong. Please try again.';
  }

  // Otherwise return as-is (likely already a user-friendly message from an RPC RAISE)
  return raw;
}
