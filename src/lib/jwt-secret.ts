/**
 * JWT Secret utility with fallback
 * Ensures the app works even if environment variables are not loaded
 */

// Default secret for development - should be overridden in production
const DEFAULT_SECRET = "monetra-development-secret-key-2024-secure"

export function getJwtSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET
}

export function getAdminJwtSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET
}
