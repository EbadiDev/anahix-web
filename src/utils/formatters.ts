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
 * Guaranteed to format as "۳۱۸,۰۰۰" on every browser and environment.
 */
export function formatToman(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '۰'
  }
  const formattedWithCommas = Math.round(amount).toLocaleString('en-US')
  return toPersianDigits(formattedWithCommas)
}

/**
 * Formats any count or metric (views, likes, orders, stock) with thousands separator and Persian digits.
 * E.g. 15400 -> "۱۵,۴۰۰", 2 -> "۲"
 */
export function formatNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '۰'
  const num = typeof n === 'number' ? n : Number(n)
  if (Number.isNaN(num)) return '۰'
  const formattedWithCommas = Math.round(num).toLocaleString('en-US')
  return toPersianDigits(formattedWithCommas)
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
