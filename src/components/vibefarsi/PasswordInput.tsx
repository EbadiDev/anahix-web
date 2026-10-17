import { Eye, EyeOff, Lock } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'

interface PasswordInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  id?: string
  name?: string
  required?: boolean
  showStrength?: boolean
  className?: string
  disabled?: boolean
  autoComplete?: string
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = '••••••••',
  id,
  name,
  required = false,
  showStrength = false,
  className = '',
  disabled = false,
  autoComplete,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  // Pure password strength calculation: returns score 0 to 4
  const strength = useMemo(() => {
    if (!value) return 0
    let score = 0
    if (value.length >= 6) score += 1
    if (value.length >= 10) score += 1
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1
    return score
  }, [value])

  const strengthLabel = useMemo(() => {
    switch (strength) {
      case 1:
        return { label: 'کلمه عبور ضعیف', color: 'text-rose-500' }
      case 2:
        return { label: 'کلمه عبور متوسط', color: 'text-amber-500' }
      case 3:
        return { label: 'کلمه عبور خوب', color: 'text-blue-400' }
      case 4:
        return { label: 'کلمه عبور بسیار قوی', color: 'text-emerald-400' }
      default:
        return { label: 'حداقل ۶ کاراکتر', color: 'text-muted-foreground' }
    }
  }, [strength])

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative w-full">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          dir="ltr"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          onChange={onChange}
          className={`w-full h-11 pl-10 pr-10 text-xs font-latin rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors ${className}`}
        />

        <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5 rounded-control"
          title={showPassword ? 'مخفی کردن کلمه عبور' : 'نمایش کلمه عبور'}
          aria-label={showPassword ? 'مخفی کردن کلمه عبور' : 'نمایش کلمه عبور'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Optional Password Strength Indicator Meter - High Visibility & Contrast */}
      {showStrength && value.length > 0 && (
        <div className="space-y-1.5 pt-1.5" dir="rtl">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((level) => {
              const isActive = strength >= level
              return (
                <div
                  key={`strength-slot-${level}`}
                  className={`h-2 flex-1 rounded-full border transition-all duration-motion ease-motion ${
                    isActive
                      ? strength <= 1
                        ? 'bg-rose-500 border-rose-600 shadow-xs'
                        : strength === 2
                          ? 'bg-amber-500 border-amber-600 shadow-xs'
                          : strength === 3
                            ? 'bg-blue-500 border-blue-600 shadow-xs'
                            : 'bg-emerald-500 border-emerald-600 shadow-xs'
                      : 'bg-muted/80 border-border/80'
                  }`}
                />
              )
            })}
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-black ${strengthLabel.color}`}>
              {strengthLabel.label}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground font-latin">
              {value.length} کاراکتر (حداقل ۶)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
