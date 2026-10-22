import type React from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
  size?: 'sm' | 'md'
  variant?: 'primary' | 'emerald'
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  style,
  ariaLabel,
  size = 'md',
}) => {
  const isSm = size === 'sm'
  const trackWidth = isSm ? 'w-9 h-5' : 'w-11 h-6'
  const circleSize = isSm ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
  const translateVal = isSm ? 'translate-x-4' : 'translate-x-5'

  const activeStyle: React.CSSProperties | undefined = checked
    ? {
        backgroundColor: '#f59e0b', // Vibe Farsi Signature Warm Amber/Orange
        borderColor: '#d97706',
        ...style,
      }
    : style

  return (
    <button
      type="button"
      role="switch"
      dir="ltr"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex ${trackWidth} shrink-0 cursor-pointer rounded-full border transition-all duration-200 ease-in-out focus:outline-none p-0.5 items-center select-none shadow-xs ${
        checked
          ? 'bg-amber-500 border-amber-600 text-white'
          : 'bg-muted/80 border-border/70 hover:border-border'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={activeStyle}
    >
      <span
        className={`pointer-events-none inline-block ${circleSize} transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          checked ? translateVal : 'translate-x-0'
        }`}
      />
    </button>
  )
}
