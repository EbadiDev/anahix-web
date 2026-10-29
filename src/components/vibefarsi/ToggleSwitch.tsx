import type React from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
  size?: 'sm' | 'md'
  variant?: 'brand' | 'primary' | 'emerald' | 'amber'
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  style,
  ariaLabel,
  size = 'md',
  variant = 'brand',
}) => {
  const isSm = size === 'sm'

  // Dimensions: sm = 36px x 20px with 16px knob, md = 44px x 24px with 20px knob
  const trackClass = isSm ? 'w-9 h-5' : 'w-11 h-6'
  const thumbClass = isSm ? 'w-4 h-4' : 'w-5 h-5'
  const translateClass = isSm ? 'translate-x-4' : 'translate-x-5'

  const activeBg =
    variant === 'primary'
      ? 'bg-primary border-primary shadow-primary/20'
      : 'bg-brand border-brand shadow-brand/25'

  return (
    <button
      type="button"
      role="switch"
      dir="ltr"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex ${trackClass} shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center select-none shadow-sm ${
        checked
          ? `${activeBg} text-white`
          : 'bg-muted/80 border-border hover:border-border/80'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={style}
    >
      <span
        className={`pointer-events-none inline-block ${thumbClass} transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          checked ? translateClass : 'translate-x-0'
        }`}
      />
    </button>
  )
}
