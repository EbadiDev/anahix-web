import type React from 'react'
import { useEffect, useRef } from 'react'

interface OtpFieldProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

function toEnDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

export const OtpField: React.FC<OtpFieldProps> = ({
  length = 5,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  className = '',
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Ensure digits array matches length
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus])

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const rawVal = e.target.value
    const enVal = toEnDigits(rawVal).replace(/\D/g, '')

    if (!enVal) {
      // Clear current slot
      const updated = [...digits]
      updated[index] = ''
      const newStr = updated.join('')
      onChange(newStr)
      return
    }

    // Take last digit
    const char = enVal.slice(-1)
    const updated = [...digits]
    updated[index] = char
    const newStr = updated.join('')
    onChange(newStr)

    // Focus next slot
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    if (newStr.length === length && onComplete) {
      onComplete(newStr)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = toEnDigits(e.clipboardData.getData('text')).replace(
      /\D/g,
      '',
    )
    if (!pasted) return

    const chars = pasted.slice(0, length)
    onChange(chars)

    // Focus the slot right after the pasted length or last slot
    const nextSlot = Math.min(chars.length, length - 1)
    inputsRef.current[nextSlot]?.focus()

    if (chars.length === length && onComplete) {
      onComplete(chars)
    }
  }

  return (
    <div
      dir="ltr"
      className={`flex items-center justify-center gap-2 sm:gap-2.5 ${className}`}
    >
      {digits.map((digit, idx) => {
        const slotKey = `otp-slot-${idx}`
        const isFilled = Boolean(digit)

        return (
          <input
            key={slotKey}
            ref={(el) => {
              inputsRef.current[idx] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={`w-11 h-12 sm:w-12 sm:h-13 rounded-control text-center font-black font-latin text-lg sm:text-xl border transition-all duration-motion ease-motion outline-none select-none ${
              isFilled
                ? 'border-foreground/40 bg-muted/30 text-foreground ring-1 ring-foreground/20'
                : 'border-border/80 bg-muted/20 text-foreground focus:border-foreground/50 focus:ring-1 focus:ring-foreground/30'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-text'}`}
          />
        )
      })}
    </div>
  )
}
