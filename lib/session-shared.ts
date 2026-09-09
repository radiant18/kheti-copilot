/**
 * Bits of session handling that both the browser and the server need.
 *
 * lib/session.ts is "use client" because it talks to localStorage. Validation
 * is not client-specific, and the subscribe route must apply the same rule the
 * sign-in screen does, so it lives here rather than being written twice.
 */

/** Indian mobile numbers: 10 digits starting 6-9. */
export function isValidPhone(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(raw.replace(/\D/g, ""));
}
