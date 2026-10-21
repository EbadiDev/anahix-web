import type React from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  size?: 'sm' | 'md'
  variant?: 'primary' | 'emerald'
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  ariaLabel,
  size = 'md',
  variant = 'emerald',
}) => {
  const isSm = size === 'sm'
  const trackWidth = isSm ? 'w-9 h-5' : 'w-11 h-6'
  const circleSize = isSm ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
  const translateVal = isSm ? 'translate-x-4' : 'translate-x-5'

  const activeColor =
    variant === 'primary'
      ? 'bg-primary border-primary'
      : 'bg-emerald-600 border-emerald-600'

  return (
    <button
      type="button"
      role="switch"
      dir="ltr"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex ${trackWidth} shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center select-none ${
        checked ? activeColor : 'bg-muted border-border/70 hover:border-border'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={`pointer-events-none inline-block ${circleSize} transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
          checked ? translateVal : 'translate-x-0'
        }`}
      />
    </button>
  )
}
