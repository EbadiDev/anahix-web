/**
 * Iranian Financial & Identity Validators (iran-validation)
 * Pure, high-precision validation functions for Iranian fintech & ecommerce.
 */

import { toEnDigits } from './formatters'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface MobileValidationResult extends ValidationResult {
  operator?: string
  normalized: string
}

export interface BankCardValidationResult extends ValidationResult {
  bankName?: string
  bin?: string
}

/**
 * Validates 10-digit Iranian National Code (کد ملی) using official Modulo 11 checksum algorithm.
 */
export function validateIranianNationalCode(
  rawCode: string | null | undefined,
): ValidationResult {
  if (!rawCode) {
    return { valid: false, error: 'کد ملی نمی‌تواند خالی باشد' }
  }

  const clean = toEnDigits(rawCode).replace(/\D/g, '')

  if (clean.length < 8 || clean.length > 10) {
    return { valid: false, error: 'کد ملی باید ۱۰ رقم باشد' }
  }

  // Pad with leading zeros if 8 or 9 digits
  const padded = clean.padStart(10, '0')

  // Blacklist repeated digits like 0000000000, 1111111111, ..., 9999999999
  if (/^(\d)\1{9}$/.test(padded)) {
    return { valid: false, error: 'کد ملی وارد شده نامعتبر است' }
  }

  const checkDigit = Number.parseInt(padded[9], 10)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(padded[i], 10) * (10 - i)
  }

  const remainder = sum % 11

  const isValid =
    (remainder < 2 && checkDigit === remainder) ||
    (remainder >= 2 && checkDigit === 11 - remainder)

  if (!isValid) {
    return { valid: false, error: 'چک‌سام کد ملی نادرست است' }
  }

  return { valid: true }
}

/**
 * Validates and normalizes Iranian Mobile numbers (همراه اول، ایرانسل، رایتل، شاتل و ...)
 */
export function validateIranianMobile(
  rawPhone: string | null | undefined,
): MobileValidationResult {
  if (!rawPhone) {
    return {
      valid: false,
      normalized: '',
      error: 'شماره موبایل نمی‌تواند خالی باشد',
    }
  }

  let clean = toEnDigits(rawPhone).replace(/[^\d+]/g, '')

  // Normalize international prefix
  if (clean.startsWith('+98')) {
    clean = `0${clean.slice(3)}`
  } else if (clean.startsWith('0098')) {
    clean = `0${clean.slice(4)}`
  } else if (clean.startsWith('98')) {
    clean = `0${clean.slice(2)}`
  } else if (clean.length === 10 && clean.startsWith('9')) {
    clean = `0${clean}`
  }

  // Exact 11 digits starting with 09
  const regex = /^09(0[1-5]|1[0-9]|2[0-3]|3[0-9]|9[0-9])[0-9]{7}$/

  if (!regex.test(clean)) {
    return {
      valid: false,
      normalized: clean,
      error:
        'فرمت شماره موبایل باید به صورت ۰۹xxxxxxxxx و متعلق به اپراتورهای معتبر باشد',
    }
  }

  // Detect Operator
  const prefix3 = clean.slice(0, 4)
  let operator = 'سایر اپراتورها'
  if (/^09(10|11|12|13|14|15|16|17|18|19|90|91|92|93|94|96)/.test(prefix3)) {
    operator = 'همراه اول (MCI)'
  } else if (/^09(30|33|35|36|37|38|39|01|02|03|04|05)/.test(prefix3)) {
    operator = 'ایرانسل (MTN Irancell)'
  } else if (/^09(20|21|22|23)/.test(prefix3)) {
    operator = 'رایتل (RighTel)'
  } else if (/^09(98)/.test(prefix3)) {
    operator = 'شاتل موبایل (Shatel)'
  } else if (/^09(99)/.test(prefix3)) {
    operator = 'سامانتل (Samantel)'
  }

  return {
    valid: true,
    normalized: clean,
    operator,
  }
}

/**
 * Validates 16-digit Iranian bank card numbers using the standard Luhn algorithm (الگوریتم لاین)
 */
export function validateIranianBankCard(
  rawCard: string | null | undefined,
): BankCardValidationResult {
  if (!rawCard) {
    return { valid: false, error: 'شماره کارت نمی‌تواند خالی باشد' }
  }

  const clean = toEnDigits(rawCard).replace(/\D/g, '')

  if (clean.length !== 16) {
    return { valid: false, error: 'شماره کارت باید ۱۶ رقم باشد' }
  }

  // Luhn Algorithm check
  let sum = 0
  for (let i = 0; i < 16; i++) {
    let digit = Number.parseInt(clean[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'چک‌سام شماره کارت نامعتبر است' }
  }

  // Identify Bank by BIN (Bank Identification Number)
  const bin = clean.slice(0, 6)
  const BANK_BINS: Record<string, string> = {
    '603799': 'بانک ملی ایران',
    '610433': 'بانک ملت',
    '585983': 'بانک تجارت',
    '603769': 'بانک صادرات ایران',
    '627353': 'بانک تجارت',
    '502229': 'بانک پاسارگاد',
    '621986': 'بانک سامان / بلو‌بانک',
    '622106': 'بانک پارسیان',
    '627412': 'بانک اقتصاد نوین',
    '639346': 'بانک سینا',
    '603770': 'بانک کشاورزی',
    '628023': 'بانک مسکن',
    '502908': 'بانک توسعه تعاون',
    '627760': 'پست بانک ایران',
    '504706': 'بانک شهر',
    '502806': 'بانک شهر',
    '639347': 'بانک پاسارگاد',
    '639607': 'بانک سرمایه',
    '636214': 'بانک آینده',
    '505785': 'بانک ایران زمین',
    '505416': 'بانک گردشگری',
    '636795': 'بانک مرکزی',
    '627961': 'بانک صنعت و معدن',
  }

  const bankName = BANK_BINS[bin] || 'بانک عضو شبکه شتاب'

  return {
    valid: true,
    bankName,
    bin,
  }
}

/**
 * Validates 24-digit Iranian IBAN / Sheba (شماره شبا) using ISO 7064 Modulo 97-10 check.
 */
export function validateIranianSheba(
  rawSheba: string | null | undefined,
): ValidationResult {
  if (!rawSheba) {
    return { valid: false, error: 'شماره شبا نمی‌تواند خالی باشد' }
  }

  let clean = toEnDigits(rawSheba).trim().toUpperCase().replace(/[\s-]/g, '')

  if (!clean.startsWith('IR')) {
    clean = `IR${clean}`
  }

  if (clean.length !== 26) {
    return {
      valid: false,
      error: 'شماره شبا باید با IR و ۲۴ رقم عددی باشد (مجموعاً ۲۶ کاراکتر)',
    }
  }

  // Move "IR" (I=18, R=27) and the first two digits to the end
  // IRxx -> xx1827
  const rearranged = `${clean.slice(4)}1827${clean.slice(2, 4)}`

  // BigInt modulo 97 check
  try {
    const bigNum = BigInt(rearranged)
    if (bigNum % 97n !== 1n) {
      return { valid: false, error: 'چک‌سام شماره شبا نامعتبر است' }
    }
  } catch {
    return { valid: false, error: 'فرمت شماره شبا حاوی کاراکترهای غیرمجاز است' }
  }

  return { valid: true }
}
