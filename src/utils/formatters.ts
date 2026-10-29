/**
 * Pure Utility Formatting Functions (Anahix Fintech & Ecommerce)
 * Conforms to DRY and pure functional programming principles.
 */

const PERSIAN_DIGITS = [
  '۰',
  '۱',
  '۲',
  '۳',
  '۴',
  '۵',
  '۶',
  '۷',
  '۸',
  '۹',
] as const

/**
 * Converts any Latin or Arabic digits to Persian digits. Pure function.
 */
export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return ''
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d)
}

/**
 * Converts Persian or Arabic digits to standard Latin ASCII digits. Pure function.
 */
export function toEnDigits(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

/**
 * Formats a number to Iranian Toman with thousands separator and Persian digits. Pure function.
 */
export function formatToman(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '۰'
  }
  // Enforce Persian digits across all browsers and operating environments
  return toPersianDigits(Math.round(amount).toLocaleString('fa-IR'))
}

/**
 * Formats seconds into a Persian MM:SS countdown timer string. Pure function.
 */
export function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '۰۰:۰۰'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const padMin = mins.toString().padStart(2, '0')
  const padSec = secs.toString().padStart(2, '0')
  return `${toPersianDigits(padMin)}:${toPersianDigits(padSec)}`
}

/**
 * Truncates string cleanly with an ellipsis. Pure function.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Formats a phone number for user display.
 * Replaces synthetic hex placeholder phones (e.g. 09835c3f7f0) with email or 'شماره ثبت‌نشده',
 * and formats valid Iranian mobile numbers with full Persian numerals. Pure function.
 */
export function formatDisplayPhone(
  phone: string | null | undefined,
  emailFallback?: string,
): string {
  if (!phone) return emailFallback || 'شماره ثبت‌نشده'
  // Detect synthetic phone generated from UUID (098 + 8 hex chars)
  if (/^098[0-9a-f]{8}$/i.test(phone)) {
    return emailFallback || 'شماره ثبت‌نشده'
  }
  // Normalize +98 to 0 and remove spaces
  const clean = phone.replace(/^\+98/, '0').replace(/\s+/g, '')
  return toPersianDigits(clean)
}
