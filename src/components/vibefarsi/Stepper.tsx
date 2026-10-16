import { Check } from 'lucide-react'
import type React from 'react'

export interface StepItem {
  number: number
  title: string
  description?: string
  status: 'completed' | 'current' | 'upcoming'
}

interface StepperProps {
  steps: StepItem[]
  className?: string
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const Stepper: React.FC<StepperProps> = ({ steps, className = '' }) => {
  return (
    <div dir="rtl" className={`w-full select-none ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Connecting Line behind steps */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-border -z-0" />

        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed'
          const isCurrent = step.status === 'current'
          const stepKey = `stepper-step-${step.number}-${idx}`

          return (
            <div
              key={stepKey}
              className="relative z-10 flex flex-col items-center text-center flex-1"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md font-black'
                      : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{toPersianDigits(step.number)}</span>
                )}
              </div>

              <div className="mt-2 space-y-0.5">
                <span
                  className={`text-xs font-bold block ${
                    isCurrent
                      ? 'text-foreground'
                      : isCompleted
                        ? 'text-foreground/90'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
