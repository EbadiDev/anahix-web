import { Loader2, Search, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  inputClassName?: string
  size?: 'sm' | 'md'
  loading?: boolean
  ariaLabel?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'جستجو...',
  debounceMs = 350,
  className = '',
  inputClassName = '',
  size = 'md',
  loading = false,
  ariaLabel = 'جستجو',
}) => {
  const [internalVal, setInternalVal] = useState(value)
  const isFirstMount = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep internal state in sync if parent changes value externally
  useEffect(() => {
    setInternalVal(value)
  }, [value])

  // Debounced auto-search
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (debounceMs <= 0) {
      onChange(internalVal)
      onSearch?.(internalVal)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(internalVal)
      onSearch?.(internalVal)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [internalVal, debounceMs, onChange, onSearch])

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange(internalVal)
    onSearch?.(internalVal)
  }

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setInternalVal('')
    onChange('')
    onSearch?.('')
  }

  const isSm = size === 'sm'
  const heightClass = isSm ? 'h-8 text-xs' : 'h-9 text-xs'
  const btnSize = isSm ? 'w-6 h-6' : 'w-7 h-7'
  const iconSize = isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'

  return (
    <form
      aria-label={ariaLabel}
      onSubmit={handleManualSubmit}
      className={`relative flex items-center w-full ${className}`}
    >
      {/* Right Search Action Button */}
      <button
        type="submit"
        aria-label="اجرای جستجو"
        title="اجرای جستجو (یا اینتر)"
        className={`absolute right-1.5 flex items-center justify-center ${btnSize} rounded-control text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer select-none`}
      >
        {loading ? (
          <Loader2 className={`${iconSize} animate-spin text-brand`} />
        ) : (
          <Search className={iconSize} />
        )}
      </button>

      {/* Input Field */}
      <input
        type="text"
        value={internalVal}
        onChange={(e) => setInternalVal(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${heightClass} pr-8 pl-8 rounded-control border border-border/60 bg-muted/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans ${inputClassName}`}
      />

      {/* Left Clear Button when typing */}
      {internalVal && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="پاک کردن متن جستجو"
          title="پاک کردن متن"
          className={`absolute left-1.5 flex items-center justify-center ${btnSize} rounded-control text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer select-none`}
        >
          <X className={iconSize} />
        </button>
      )}
    </form>
  )
}
